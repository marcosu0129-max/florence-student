import { schoolCommunityIdentity } from './schoolCommunityIdentity';
import { getSavedCourseIds, saveCourse, unsaveCourse } from './communityStorage';
import { communityRequest, requireAccountSession, setAccountFavorite, type FavoriteRecord } from './communityApi';
import { supabase } from './supabase';

type Identity = typeof schoolCommunityIdentity;
export interface FavoriteActionScope { owner: string | null; planYear: string; isCurrent: () => boolean; }
export interface FavoriteImportResult { imported: number; missing: number; notReady: number; unavailable: number; error: string | null; }

/** Isolated mutation boundary: never infer cloud identity from the selected programme or source UUID. */
export function createSchoolFavoriteActions({ identity = schoolCommunityIdentity, readLocal = getSavedCourseIds,
  saveLocal = saveCourse, removeLocal = unsaveCourse, write = setAccountFavorite }:
  { identity?: Identity; readLocal?: typeof getSavedCourseIds; saveLocal?: typeof saveCourse;
    removeLocal?: typeof unsaveCourse; write?: typeof setAccountFavorite } = {}) {
  async function toggle(id: string, savedIds: string[], scope: FavoriteActionScope) {
    try { await identity.readyCatalog(); }
    catch (error) { if (!savedIds.includes(id)) throw error; }
    if (!scope.isCurrent()) return null;
    const key = identity.canonicalCourseKey(id);
    const matching = savedIds.filter(saved => identity.canonicalCourseKey(saved) === key);
    const saved = !matching.length;
    if (scope.owner) {
      if (!saved) {
        // These IDs came from this owner's SELECT. Removing obsolete favorites does not need a current catalog row.
        for (const storedId of matching) {
          if (!scope.isCurrent()) return null;
          await write(storedId, false, scope.planYear, scope.owner);
        }
        return scope.isCurrent() ? { saved: false, courseId: id, removedIds: matching } : null;
      }
      const { identity: confirmed } = await identity.requireCourse(id);
      if (!scope.isCurrent()) return null;
      await write(confirmed.communityId, true, scope.planYear, scope.owner);
      return scope.isCurrent() ? { saved: true, courseId: confirmed.communityId, removedIds: [] } : null;
    }
    if (saved) {
      const course = await identity.resolveCourse(id);
      if (!course) throw new Error('Questo corso non è ancora presente nel catalogo. I preferiti esistenti sono conservati.');
      if (!scope.isCurrent()) return null;
      saveLocal(course.id);
      return { saved: true, courseId: course.id, removedIds: [] };
    }
    if (!scope.isCurrent()) return null;
    matching.forEach(removeLocal);
    return { saved: false, courseId: id, removedIds: matching };
  }

  async function importLocal(scope: FavoriteActionScope): Promise<FavoriteImportResult> {
    const result: FavoriteImportResult = { imported: 0, missing: 0, notReady: 0, unavailable: 0, error: null };
    if (!scope.owner || !scope.isCurrent()) return result;
    try {
      const localIds = readLocal();
      const resolved = await identity.resolveCourses(localIds);
      if (!scope.isCurrent()) return result;
      result.missing = new Set(localIds.filter((_, index) => !resolved[index])).size;
      const courses = [...new Map(resolved.filter(course => course !== null).map(course => [course!.official_code, course!])).values()];
      const identities = await identity.confirmCourses(courses.map(course => ({ id: course.id, officialCode: course.official_code })));
      for (const confirmed of identities) {
        if (!scope.isCurrent()) return result;
        if (confirmed.status === 'not-imported') { result.notReady += 1; continue; }
        if (confirmed.status === 'unavailable') { result.unavailable += 1; continue; }
        if (confirmed.status === 'ready') {
          await write(confirmed.communityId, true, scope.planYear, scope.owner);
          result.imported += 1;
        }
      }
    } catch (error) { result.error = error instanceof Error ? error.message : 'Importazione incompleta. Puoi riprovare.'; }
    return result;
  }
  return { toggle, importLocal };
}
export const schoolFavoriteActions = createSchoolFavoriteActions();

/** A completed write invalidates pending pre-write reads, even when another hook still awaits them. */
export function createFavoriteReader(load: (owner: string) => Promise<FavoriteRecord[]>) {
  const requests = new Map<string, Promise<FavoriteRecord[]>>();
  const revisions = new Map<string, number>();
  function read(owner: string): Promise<FavoriteRecord[]> {
    const existing = requests.get(owner);
    if (existing) return existing;
    const revision = revisions.get(owner) || 0;
    const currentResult = (rows: FavoriteRecord[]) => revision === (revisions.get(owner) || 0) ? rows : read(owner);
    const request = load(owner).then(currentResult, error => {
      if (revision !== (revisions.get(owner) || 0)) return read(owner);
      throw error;
    }).finally(() => { if (requests.get(owner) === request) requests.delete(owner); });
    requests.set(owner, request);
    return request;
  }
  return { read, invalidate(owner: string) {
    revisions.set(owner, (revisions.get(owner) || 0) + 1);
    requests.delete(owner);
  } };
}
const favoriteReader = createFavoriteReader(async owner => {
  const session = await requireAccountSession(owner);
  const authorization = `Bearer ${session.access_token}`;
  const favorites = new Map<string, FavoriteRecord>();
  for (let offset = 0; ; offset += 500) {
    const rows = await communityRequest<FavoriteRecord[]>(signal => supabase.from('user_favorites').select('course_id,plan_year')
      .setHeader('Authorization', authorization).order('created_at', { ascending: false }).order('id', { ascending: false })
      .range(offset, offset + 499).abortSignal(signal));
    if (!Array.isArray(rows) || rows.some(row => !row || typeof row.course_id !== 'string')) throw new Error('I preferiti non sono disponibili. Riprova.');
    rows.forEach(row => favorites.set(row.course_id, row));
    if (rows.length < 500) return [...favorites.values()];
  }
});
export const fetchSchoolAccountFavorites = favoriteReader.read;
export const invalidateSchoolAccountFavorites = favoriteReader.invalidate;
