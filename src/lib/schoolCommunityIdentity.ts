import { schoolCatalog, type SchoolSearch } from './schoolCatalog';
import { supabase, isSupabaseConfigured } from './supabase';

type Subject = 'course' | 'professor';
export interface SchoolCommunityRecord { id: string; officialKey: string; sourceId: string; }
export type SchoolIdentityReader = (subject: Subject, by: 'key' | 'id', values: string[], signal: AbortSignal) => PromiseLike<unknown>;
export type SchoolCommunityIdentity = { status: 'ready'; communityId: string; officialKey: string; catalogId: string }
  | { status: 'not-imported' | 'unavailable'; officialKey: string; catalogId: string; message: string };
type CourseSearchRecord = SchoolSearch['courses'][number];
type Repository = Pick<typeof schoolCatalog, 'index' | 'search'>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_IMPORTED = 'Questa scheda è consultabile, ma la sincronizzazione con l’account non è ancora pronta. I dati locali sono conservati.';
const UNAVAILABLE = 'Impossibile verificare la sincronizzazione con l’account. Controlla la connessione e riprova.';

/** Static source IDs are navigation identities, not proof that a cloud business row exists. */
export function createSchoolCommunityIdentity({ repository = schoolCatalog, read, now = Date.now, timeoutMs = 6000 }:
  { repository?: Repository; read: SchoolIdentityReader; now?: () => number; timeoutMs?: number }) {
  let catalog: SchoolSearch | null = null;
  let release = '';
  let loading: Promise<void> | null = null;
  let revision = 0;
  let generation = 0;
  const listeners = new Set<() => void>();
  const courseKeys = new Map<string, string>();
  const professorKeys = new Map<string, string>();
  const communityCourseIds: Record<string, string> = {};
  const communityProfessorIds: Record<string, string> = {};
  type Confirmation = { status: 'ready'; communityId: string; officialKey: string }
    | { status: 'not-imported' | 'unavailable'; officialKey: string; message: string };
  const cached = new Map<string, { until: number; pending: Promise<Confirmation> }>();
  const reverseReads = new Map<string, Promise<void>>();
  const queued = new Map<Subject, Map<string, Array<{ resolve: (value: Confirmation) => void; entry: { until: number }; generation: number }>>>();
  const publish = () => { revision += 1; listeners.forEach(listener => listener()); };

  async function readyCatalog() {
    if (loading) return loading;
    loading = (async () => {
      const index = await repository.index();
      const search = await repository.search();
      catalog = search;
      if (release === index.release_id) return;
      release = index.release_id;
      for (const course of search.courses) { courseKeys.set(course.id, course.official_code); courseKeys.set(course.official_code, course.official_code); }
      for (const professor of search.professors) { professorKeys.set(professor.id, professor.official_id); professorKeys.set(professor.official_id, professor.official_id); }
      for (const [source, id] of Object.entries(index.aliases.courses)) if (courseKeys.has(id)) courseKeys.set(source, courseKeys.get(id)!);
      for (const [source, id] of Object.entries(index.aliases.professors)) if (professorKeys.has(id)) professorKeys.set(source, professorKeys.get(id)!);
      if (search.courses.some(course => course.official_code === 'B034857')) courseKeys.set('lm92_001', 'B034857');
      publish();
    })().finally(() => { loading = null; });
    return loading;
  }
  async function readRecords(subject: Subject, by: 'key' | 'id', values: string[]) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const value = await Promise.race([
        Promise.resolve().then(() => read(subject, by, values, controller.signal)),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error(UNAVAILABLE)); }, timeoutMs); }),
      ]);
      if (!Array.isArray(value)) throw new Error(UNAVAILABLE);
      const rows: SchoolCommunityRecord[] = value.map(row => {
        if (!row || typeof row !== 'object' || !UUID.test(row.id) || !UUID.test(row.sourceId) || typeof row.officialKey !== 'string' || !row.officialKey
          || !values.includes(by === 'key' ? row.officialKey : row.id)) throw new Error(UNAVAILABLE);
        return { id: row.id, officialKey: row.officialKey, sourceId: row.sourceId };
      });
      if (new Set(rows.map(row => row.officialKey)).size !== rows.length || new Set(rows.map(row => row.id)).size !== rows.length) throw new Error(UNAVAILABLE);
      const known = subject === 'course' ? courseKeys : professorKeys;
      if (rows.some(row => [row.id, row.sourceId].some(id => known.has(id) && known.get(id) !== row.officialKey))) throw new Error(UNAVAILABLE);
      return rows;
    } catch { controller.abort(); throw new Error(UNAVAILABLE); }
    finally { if (timer) clearTimeout(timer); }
  }
  function remember(subject: Subject, row: SchoolCommunityRecord, notify = true) {
    const aliases = subject === 'course' ? courseKeys : professorKeys;
    const ids = subject === 'course' ? communityCourseIds : communityProfessorIds;
    const changed = aliases.get(row.id) !== row.officialKey || aliases.get(row.sourceId) !== row.officialKey || ids[row.officialKey] !== row.id;
    aliases.set(row.id, row.officialKey); aliases.set(row.sourceId, row.officialKey); ids[row.officialKey] = row.id;
    if (changed && notify) publish();
    return changed;
  }
  function confirm(subject: Subject, officialKey: string): Promise<Confirmation> {
    const key = `${subject}:${officialKey}`;
    const existing = cached.get(key);
    if (existing && existing.until > now()) return existing.pending;
    let resolve!: (value: Confirmation) => void;
    const entry = { until: Infinity, pending: new Promise<Confirmation>(done => { resolve = done; }) };
    cached.set(key, entry);
    let queue = queued.get(subject);
    if (!queue) {
      queue = new Map(); queued.set(subject, queue);
      void Promise.resolve().then(async () => {
        const pending = queued.get(subject)!; queued.delete(subject);
        const keys = [...pending.keys()];
        await Promise.all(Array.from({ length: Math.ceil(keys.length / 100) }, async (_, index) => {
          const batch = keys.slice(index * 100, index * 100 + 100);
          let rows: SchoolCommunityRecord[] | null = null;
          try { rows = await readRecords(subject, 'key', batch); } catch { /* Distinct from a successful missing row. */ }
          let changed = false;
          for (const officialKey of batch) {
            const row = rows?.find(row => row.officialKey === officialKey);
            const result: Confirmation = row ? { status: 'ready', communityId: row.id, officialKey }
              : { status: rows ? 'not-imported' : 'unavailable', officialKey, message: rows ? NOT_IMPORTED : UNAVAILABLE };
            const targets = pending.get(officialKey)!;
            if (targets.some(target => target.generation === generation)) {
              if (row) changed = remember(subject, row, false) || changed;
              else delete (subject === 'course' ? communityCourseIds : communityProfessorIds)[officialKey];
            }
            for (const target of targets) {
              target.entry.until = now() + (result.status === 'ready' ? 60000 : result.status === 'not-imported' ? 15000 : 2000);
              target.resolve(target.generation === generation ? result : { status: 'unavailable', officialKey, message: UNAVAILABLE });
            }
          }
          if (changed) publish();
        }));
      });
    }
    queue.set(officialKey, [...(queue.get(officialKey) || []), { resolve, entry, generation }]);
    return entry.pending;
  }
  async function resolveCourses(ids: string[]): Promise<Array<CourseSearchRecord | null>> {
    await readyCatalog();
    const unknown = [...new Set(ids.filter(id => !courseKeys.has(id) && UUID.test(id)))];
    for (let offset = 0; offset < unknown.length; offset += 100) {
      const batch = unknown.slice(offset, offset + 100).sort();
      const key = batch.join(',');
      let pending = reverseReads.get(key);
      if (!pending) {
        const started = generation;
        pending = (async () => {
          let changed = false;
          const rows = await readRecords('course', 'id', batch);
          if (started !== generation) throw new Error(UNAVAILABLE);
          for (const row of rows) changed = remember('course', row, false) || changed;
          if (changed) publish();
        })().finally(() => { reverseReads.delete(key); });
        reverseReads.set(key, pending);
      }
      await pending;
    }
    return ids.map(id => catalog!.courses.find(course => course.official_code === (courseKeys.get(id) || id)) || null);
  }
  async function resolveCourse(id: string) { return (await resolveCourses([id]))[0]; }
  async function resolveProfessor(id: string) {
    await readyCatalog();
    if (!professorKeys.has(id) && UUID.test(id)) {
      const started = generation;
      const rows = await readRecords('professor', 'id', [id]);
      if (started !== generation) throw new Error(UNAVAILABLE);
      for (const row of rows) remember('professor', row);
    }
    return catalog!.professors.find(professor => professor.official_id === (professorKeys.get(id) || id)) || null;
  }
  async function confirmCourses(items: Array<{ id: string; officialCode: string }>): Promise<SchoolCommunityIdentity[]> {
    await readyCatalog();
    return Promise.all(items.map(async item => courseKeys.get(item.id) !== item.officialCode
      ? { status: 'unavailable' as const, officialKey: item.officialCode, catalogId: item.id, message: UNAVAILABLE }
      : { ...await confirm('course', item.officialCode), catalogId: item.id }));
  }
  async function confirmProfessors(items: Array<{ id: string; officialId: string }>): Promise<SchoolCommunityIdentity[]> {
    await readyCatalog();
    return Promise.all(items.map(async item => professorKeys.get(item.id) !== item.officialId
      ? { status: 'unavailable' as const, officialKey: item.officialId, catalogId: item.id, message: UNAVAILABLE }
      : { ...await confirm('professor', item.officialId), catalogId: item.id }));
  }
  async function requireCourse(id: string) {
    const course = await resolveCourse(id);
    if (!course) throw new Error('Questo corso non è ancora presente nel catalogo della scuola. Il preferito è conservato.');
    const identity = (await confirmCourses([{ id: course.id, officialCode: course.official_code }]))[0];
    if (identity.status !== 'ready') throw new Error(identity.message);
    return { course, identity };
  }
  async function requireProfessor(id: string) {
    const professor = await resolveProfessor(id);
    if (!professor) throw new Error('Questo docente non è ancora presente nel catalogo della scuola.');
    const identity = (await confirmProfessors([{ id: professor.id, officialId: professor.official_id }]))[0];
    if (identity.status !== 'ready') throw new Error(identity.message);
    return { professor, identity };
  }
  return {
    readyCatalog, resolveCourse, resolveCourses, resolveProfessor, confirmCourses, confirmProfessors, requireCourse, requireProfessor,
    canonicalCourseKey: (id: string) => courseKeys.get(id) || id,
    canonicalProfessorKey: (id: string) => professorKeys.get(id) || id,
    getRevision: () => revision,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    communityIdentityMap: () => ({ courseAliases: Object.fromEntries(courseKeys), professorAliases: Object.fromEntries(professorKeys),
      businessCourseIds: { ...communityCourseIds }, businessProfessorIds: { ...communityProfessorIds } }),
    invalidate: () => { generation += 1; cached.clear(); Object.keys(communityCourseIds).forEach(key => delete communityCourseIds[key]); Object.keys(communityProfessorIds).forEach(key => delete communityProfessorIds[key]); publish(); },
  };
}

export const schoolCommunityIdentity = createSchoolCommunityIdentity({ read: async (subject, by, values, signal) => {
  if (!isSupabaseConfigured) throw new Error(UNAVAILABLE);
  const course = subject === 'course';
  const officialColumn = course ? 'official_code' : 'official_id';
  const idColumn = course ? 'course_id' : 'professor_id';
  const { data, error } = await supabase.from(course ? 'official_course_keys' : 'official_professor_keys')
    .select(`${officialColumn},${idColumn},source_entity_id`).eq('institution', 'unifi')
    .in(by === 'key' ? officialColumn : idColumn, values).abortSignal(signal);
  if (error || !data) throw new Error(UNAVAILABLE);
  return data.map(row => ({ officialKey: row[officialColumn], id: row[idColumn], sourceId: row.source_entity_id }));
} });
