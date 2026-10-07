import { buildCatalogView, CatalogLoadError, catalogPlanYears, validateCatalog } from './catalogMapper';
import type { CatalogView } from './catalogMapper';
import type { CatalogSnapshot, CatalogStatus, Course, Professor } from './catalogTypes';

export interface CatalogIdentityMap {
  courseAliases: Record<string, string>;
  professorAliases: Record<string, string>;
  /** Official identities -> imported business UUIDs. */
  businessCourseIds: Record<string, string>;
  businessProfessorIds: Record<string, string>;
}

interface CloudCatalog {
  payload: unknown;
  importedAt?: string | null;
}

// Audited old route: mockData.ts's lm92_001 is MENTE E LINGUAGGI;
// both official B385 plans identify that activity as B034857. This is a
// navigation alias only: demo ratings/teachers are never copied or imported.
const LEGACY_COURSE_ALIASES: Record<string, string> = { lm92_001: 'B034857' };

export interface CatalogRepositoryOptions {
  snapshot?: unknown;
  /** A separate JSON asset keeps the full syllabi out of the initial JS bundle. */
  loadSnapshot?: () => Promise<unknown>;
  fetchCloud: () => Promise<CloudCatalog>;
  identityMap?: Partial<CatalogIdentityMap>;
  onIdentityMap?: (map: CatalogIdentityMap) => void;
}

/** One repository backs lists, detail links and teacher associations. */
export function createCatalogRepository(options: CatalogRepositoryOptions) {
  let bundled: CatalogSnapshot | null = null;
  let active: CatalogSnapshot | null = null;
  let initialError: string | null = null;
  let bundledAttempted = options.snapshot !== undefined;
  let bundledPending: Promise<void> | null = null;
  let lastCloudSnapshot: CatalogSnapshot | null = null;
  let attemptedCloud = false;
  let pending: Promise<CatalogStatus> | null = null;
  const listeners = new Set<() => void>();
  const views = new Map<string, CatalogView>();
  const identities: CatalogIdentityMap = {
    courseAliases: { ...options.identityMap?.courseAliases, ...LEGACY_COURSE_ALIASES },
    professorAliases: { ...options.identityMap?.professorAliases },
    businessCourseIds: { ...options.identityMap?.businessCourseIds },
    businessProfessorIds: { ...options.identityMap?.businessProfessorIds },
  };

  function registerIdentities(snapshot: CatalogSnapshot, cloud: boolean) {
    for (const course of snapshot.courses) {
      identities.courseAliases[course.id] = course.official_code;
      if (cloud) identities.businessCourseIds[course.official_code] = course.id;
    }
    for (const professor of snapshot.professors) {
      identities.professorAliases[professor.id] = professor.official_id;
      if (cloud) identities.businessProfessorIds[professor.official_id] = professor.id;
    }
    // Persist only public identity mappings, never credentials or user content.
    if (cloud) options.onIdentityMap?.(identities);
  }

  function remapBundled(snapshot: CatalogSnapshot): CatalogSnapshot {
    const courseIds = Object.fromEntries(snapshot.courses.map((course) => [course.id, identities.businessCourseIds[course.official_code] || course.id]));
    const professorIds = Object.fromEntries(snapshot.professors.map((professor) => [professor.id, identities.businessProfessorIds[professor.official_id] || professor.id]));
    return {
      ...snapshot,
      courses: snapshot.courses.map((course) => ({ ...course, id: courseIds[course.id] })),
      professors: snapshot.professors.map((professor) => ({ ...professor, id: professorIds[professor.id] })),
      offerings: snapshot.offerings.map((offering) => ({ ...offering, course_id: courseIds[offering.course_id], professor_ids: offering.professor_ids.map((id) => professorIds[id]) })),
      requirements: snapshot.requirements.map((requirement) => ({ ...requirement, course_ids: Array.isArray(requirement.course_ids) ? requirement.course_ids.map((id) => courseIds[String(id)] || id) : requirement.course_ids })),
    };
  }

  if (options.snapshot !== undefined) {
    try {
      bundled = validateCatalog(options.snapshot);
      registerIdentities(bundled, false);
      active = remapBundled(bundled);
    } catch (error) {
      initialError = error instanceof Error ? error.message : 'Catalogo ufficiale non disponibile.';
    }
  }
  let status: CatalogStatus = {
    loading: false,
    source: active ? 'official-snapshot' : 'unavailable',
    academicYear: active ? catalogPlanYears(active)[0] || '' : '',
    academicYears: active ? catalogPlanYears(active) : [],
    updatedAt: active?.generated_at ?? null,
    cloudError: null,
    error: active ? null : initialError,
  };

  function publish(patch: Partial<CatalogStatus>) {
    status = { ...status, ...patch };
    for (const listener of listeners) listener();
  }

  async function loadBundled(retry = false): Promise<void> {
    if (bundledPending) return bundledPending;
    if (bundled || !options.loadSnapshot || (bundledAttempted && !retry)) return;
    bundledAttempted = true;
    publish({ loading: true });
    bundledPending = Promise.resolve().then(options.loadSnapshot).then((value) => {
      bundled = validateCatalog(value);
      registerIdentities(bundled, false);
      if (!lastCloudSnapshot) {
        active = remapBundled(bundled);
        views.clear();
        const academicYears = catalogPlanYears(active);
        publish({ source: 'official-snapshot', updatedAt: active.generated_at, academicYear: academicYears[0] || '', academicYears, error: null });
      }
      initialError = null;
    }).catch((error) => {
      initialError = error instanceof Error ? error.message : 'Impossibile caricare la copia ufficiale UNIFI.';
      if (!active) publish({ error: initialError });
    }).finally(() => { bundledPending = null; });
    return bundledPending;
  }

  async function refresh(retryBundled = true): Promise<CatalogStatus> {
    if (pending) return pending;
    attemptedCloud = true;
    publish({ loading: true });
    pending = (async () => {
      // Defer even a synchronous configuration error until the shared promise is stored.
      await Promise.resolve();
      try {
        await loadBundled(retryBundled);
        const response = await options.fetchCloud();
        const loaded = validateCatalog(response.payload);
        registerIdentities(loaded, true);
        active = loaded;
        lastCloudSnapshot = loaded;
        views.clear();
        const academicYears = catalogPlanYears(loaded);
        publish({
          loading: false, source: 'cloud', updatedAt: loaded.generated_at,
          academicYear: academicYears[0] || '', academicYears, cloudError: null, error: null,
        });
      } catch (error) {
        const cloudError = error instanceof Error ? error.message : 'Impossibile aggiornare il catalogo dal database.';
        if (lastCloudSnapshot || bundled) {
          // A failed refresh must not replace newer verified data with an older file.
          active = lastCloudSnapshot || remapBundled(bundled!);
          views.clear();
          const academicYears = catalogPlanYears(active);
          publish({ loading: false, source: 'official-snapshot', updatedAt: active.generated_at, academicYear: academicYears[0] || '', academicYears, cloudError, error: null });
        } else {
          active = null;
          publish({ loading: false, source: 'unavailable', updatedAt: null, academicYears: [], academicYear: '', cloudError, error: initialError || cloudError });
        }
      } finally {
        pending = null;
      }
      return status;
    })();
    return pending;
  }

  async function getView(academicYear?: string): Promise<CatalogView> {
    await loadBundled();
    if (!attemptedCloud || !active) {
      // Official offline data is immediately useful; refresh publishes a new status.
      const request = refresh(!active && attemptedCloud);
      if (!active) await request;
    }
    if (!active || status.source === 'unavailable') throw new CatalogLoadError(status.error || 'Catalogo ufficiale non disponibile.');
    const selected = academicYear || status.academicYear;
    if (!status.academicYears.includes(selected)) throw new CatalogLoadError('Il piano di studi richiesto non è presente nel catalogo ufficiale.');
    const key = `${status.source}:${selected}`;
    if (!views.has(key)) views.set(key, buildCatalogView(active, selected, status.source));
    return views.get(key)!;
  }

  return {
    getStatus: () => status,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh,
    academicYears: () => [...status.academicYears],
    defaultAcademicYear: () => status.academicYear,
    programs: async (academicYear?: string) => (await getView(academicYear)).programs,
    initialPrograms: () => active ? buildCatalogView(active, undefined, status.source === 'cloud' ? 'cloud' : 'official-snapshot').programs : [],
    courses: async (programCodes?: string[], academicYear?: string): Promise<Course[]> => {
      const courses = (await getView(academicYear)).courses;
      return programCodes?.length ? courses.filter((course) => programCodes.includes(course.programCode)) : courses;
    },
    courseById: async (id: string, academicYear?: string): Promise<Course | null> => {
      const courses = (await getView(academicYear)).courses;
      const officialCode = identities.courseAliases[id] || id;
      return courses.find((course) => course.id === id || course.officialCode === officialCode) ?? null;
    },
    professors: async (academicYear?: string): Promise<Professor[]> => (await getView(academicYear)).professors,
    professorById: async (id: string, academicYear?: string): Promise<Professor | null> => {
      const professors = (await getView(academicYear)).professors;
      const officialId = identities.professorAliases[id] || id;
      return professors.find((professor) => professor.id === id || professor.officialId === officialId) ?? null;
    },
    coursesByProfessor: async (id: string, academicYear?: string): Promise<Course[]> => {
      const view = await getView(academicYear);
      const officialId = identities.professorAliases[id] || id;
      const professor = view.professors.find((item) => item.id === id || item.officialId === officialId);
      return professor ? view.courses.filter((course) => course.professorIds?.includes(professor.id)) : [];
    },
    identityMap: () => identities,
  };
}
