import type { SchoolAliases, SchoolCohort, SchoolContext, SchoolFindOptions, SchoolIndex, SchoolJsonReader, SchoolLoadOptions, SchoolOffering, SchoolReadOptions, SchoolResourceState } from './schoolCatalogTypes';
import { SchoolCatalogLoadError } from './schoolCatalogTransport';
import { validateSchoolCohort, validateSchoolIndex, validateSchoolOfferingDetail, validateSchoolSearch } from './schoolCatalogValidation';

export const SCHOOL_CATALOG_INDEX_URL = '/catalog/school/index.json';
const IDLE: SchoolResourceState = Object.freeze({ status: 'idle', error: null });
export class SchoolCatalogSupersededError extends Error {
  constructor() { super('La richiesta è stata sostituita da una versione più recente.'); this.name = 'SchoolCatalogSupersededError'; }
}
export type SchoolRequestResult<T> = { status: 'ready'; data: T } | { status: 'error'; error: Error } | { status: 'superseded' };

/** Per-consumer scope: late responses may fill the immutable cache but cannot replace a newer selection. */
export function createSchoolCatalogRequestScope() {
  let revision = 0;
  return {
    cancel: () => { revision += 1; },
    async run<T>(request: () => Promise<T>): Promise<SchoolRequestResult<T>> {
      const current = ++revision;
      try {
        const data = await request();
        return current === revision ? { status: 'ready', data } : { status: 'superseded' };
      } catch (error) {
        if (current !== revision || error instanceof SchoolCatalogSupersededError) return { status: 'superseded' };
        return { status: 'error', error: error instanceof Error ? error : new SchoolCatalogLoadError() };
      }
    },
  };
}

function canonicalAlias(value: string, maps: Array<Record<string, string>>): string {
  const seen = new Set<string>();
  let current = value;
  while (!seen.has(current)) {
    seen.add(current);
    const map = maps.find(candidate => Object.hasOwn(candidate, current));
    const next = map?.[current];
    if (!next || next === current) return current;
    current = next;
  }
  throw new SchoolCatalogLoadError('I collegamenti del catalogo non sono validi. Riprova.');
}
function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value); Object.values(value).forEach(item => freeze(item, seen)); Object.freeze(value);
  }
  return value;
}
function validateContext(context: SchoolContext) {
  if (!context || typeof context.programKey !== 'string' || !context.programKey || !Number.isInteger(context.cohortYear) || context.cohortYear < 1900) {
    throw new SchoolCatalogLoadError('Seleziona un corso di laurea e un anno di ingresso validi.');
  }
  if (context.academicYearStart !== undefined && (!Number.isInteger(context.academicYearStart) || context.academicYearStart < 1900)) {
    throw new SchoolCatalogLoadError('Seleziona un anno di insegnamento valido.');
  }
}
export function selectSchoolOfferings(cohort: SchoolCohort, context: Pick<SchoolContext, 'curriculumCode' | 'academicYearStart'> = {}): SchoolOffering[] {
  if (context.curriculumCode !== undefined && !cohort.curricula.some(curriculum => curriculum.code === context.curriculumCode)) {
    throw new SchoolCatalogLoadError('Il percorso richiesto non è presente in questo piano di studi.');
  }
  return cohort.offerings.filter(offering => (context.curriculumCode === undefined || offering.curriculum_code === context.curriculumCode)
    && (context.academicYearStart === undefined || offering.academic_year_start === context.academicYearStart));
}

interface Entry {
  fingerprint: string; state: SchoolResourceState; until: number;
  promise: Promise<unknown>; controller: AbortController;
}
export function createSchoolCatalogRepository({ read, now = Date.now, indexTtlMs = 60000, timeoutMs = 12000 }:
  { read: SchoolJsonReader; now?: () => number; indexTtlMs?: number; timeoutMs?: number }) {
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let activeIndex: SchoolIndex | null = null;
  const publish = () => listeners.forEach(listener => listener());

  function resource<T>(url: string, validate: (value: unknown) => T, options: SchoolLoadOptions = {}, integrity: Omit<SchoolReadOptions, 'signal'> = {}, ttl = Infinity, contextKey = ''): Promise<T> {
    const fingerprint = `${integrity.sha256 || ''}:${integrity.bytes ?? ''}:${contextKey}`;
    const current = entries.get(url);
    if (!options.retry && current?.fingerprint === fingerprint && current.until > now() && current.state.status !== 'error') return current.promise as Promise<T>;
    current?.controller.abort();
    const controller = new AbortController();
    const entry: Entry = { fingerprint, state: { status: 'loading', error: null }, until: Infinity, promise: Promise.resolve(), controller };
    entries.set(url, entry);
    let timer: ReturnType<typeof setTimeout> | undefined;
    entry.promise = Promise.race([
      Promise.resolve().then(() => read(url, { signal: controller.signal, ...integrity })),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new SchoolCatalogLoadError('Il catalogo sta impiegando troppo tempo a rispondere. Riprova.')); }, timeoutMs); }),
    ]).then(value => {
      if (entries.get(url) !== entry) throw new SchoolCatalogSupersededError();
      const result = freeze(validate(value));
      entry.until = now() + ttl;
      entry.state = { status: 'ready', error: null }; publish(); return result;
    }).catch(reason => {
      if (entries.get(url) !== entry) throw new SchoolCatalogSupersededError();
      const error = reason instanceof Error && !(reason instanceof TypeError) ? reason : new SchoolCatalogLoadError();
      entry.state = { status: 'error', error: error.message }; entry.until = 0; publish(); throw error;
    }).finally(() => { if (timer) clearTimeout(timer); });
    publish();
    return entry.promise as Promise<T>;
  }

  async function index(options: SchoolLoadOptions = {}): Promise<SchoolIndex> {
    const data = await resource(SCHOOL_CATALOG_INDEX_URL, validateSchoolIndex, options, {}, indexTtlMs);
    activeIndex = data;
    return data;
  }
  function assertCurrentRelease(manifest: SchoolIndex) {
    if (activeIndex && activeIndex.release_id !== manifest.release_id) throw new SchoolCatalogSupersededError();
  }
  function resolveProgram(manifest: SchoolIndex, key: string) {
    const canonical = canonicalAlias(key, [manifest.aliases.programs]);
    return manifest.programs.find(program => program.program_key === canonical || program.id === canonical) ?? null;
  }
  async function locate(context: SchoolContext) {
    validateContext(context);
    const manifest = await index();
    const program = resolveProgram(manifest, context.programKey);
    if (!program) throw new SchoolCatalogLoadError('Il corso di laurea richiesto non è presente nel catalogo della scuola.');
    const reference = program.cohorts.find(cohort => cohort.cohort_year === context.cohortYear);
    if (!reference) throw new SchoolCatalogLoadError('L’anno di ingresso richiesto non è presente per questo corso di laurea.');
    return { manifest, program, reference };
  }
  async function loadCohort(context: SchoolContext, options: SchoolLoadOptions = {}) {
    const { manifest, program, reference } = await locate(context);
    const data = await resource(reference.url, value => validateSchoolCohort(value, { program, reference, generatedAt: manifest.generated_at }), options,
      { sha256: reference.sha256, bytes: reference.bytes }, Infinity, `${manifest.release_id}:${manifest.generated_at}:${program.id}:${reference.cohort_year}`);
    assertCurrentRelease(manifest);
    return { data, manifest };
  }
  const cohort = async (context: SchoolContext, options: SchoolLoadOptions = {}) => (await loadCohort(context, options)).data;
  const offerings = async (context: SchoolContext, options: SchoolLoadOptions = {}) => selectSchoolOfferings(await cohort(context, options), context);
  async function offering(id: string, context: SchoolContext, options: SchoolLoadOptions = {}) {
    return (await offerings(context, options)).find(item => item.id === id) ?? null;
  }
  async function offeringDetail(id: string, context: SchoolContext, options: SchoolLoadOptions = {}) {
    const { data, manifest } = await loadCohort(context);
    const selected = selectSchoolOfferings(data, context).find(item => item.id === id);
    if (!selected) return null;
    const detail = await resource(selected.details_url, value => validateSchoolOfferingDetail(value, selected), options, {}, Infinity,
      `${manifest.release_id}:${selected.id}:${selected.course_id}:${selected.program_key}:${selected.cohort_year}:${selected.curriculum_code}:${selected.academic_year_start}`);
    assertCurrentRelease(manifest);
    return detail;
  }
  function resolveSubject(id: string, subject: 'courses' | 'professors', cohortAliases: SchoolAliases, manifest: SchoolIndex) {
    return canonicalAlias(id, [cohortAliases[subject], manifest.aliases[subject]]);
  }
  async function resolveCourseRoute(id: string, context: SchoolContext, options: SchoolLoadOptions = {}) {
    const { data, manifest } = await loadCohort(context, options);
    // The sole audited demo route. Other legacy IDs are never guessed by name or array order.
    const alias = id === 'lm92_001' && data.program.program_key === 'B385' ? 'B034857' : id;
    const canonical = resolveSubject(alias, 'courses', data.aliases, manifest);
    const course = data.courses.find(item => item.id === canonical || item.official_code === canonical);
    if (!course) return null;
    return { course, offerings: selectSchoolOfferings(data, context).filter(item => item.course_id === course.id) };
  }
  async function professorProfile(id: string, profileYear: number, context: SchoolContext, options: SchoolLoadOptions = {}) {
    if (!Number.isInteger(profileYear) || profileYear < 1900) throw new SchoolCatalogLoadError('Seleziona l’anno della scheda docente.');
    const { data, manifest } = await loadCohort(context, options);
    const canonical = resolveSubject(id, 'professors', data.aliases, manifest);
    return data.professor_profiles.find(profile => (profile.id === canonical || profile.official_id === canonical) && profile.profile_year === profileYear) ?? null;
  }
  async function offeringProfessors(id: string, context: SchoolContext, options: SchoolLoadOptions = {}) {
    const data = await cohort(context, options);
    const selected = selectSchoolOfferings(data, context).find(item => item.id === id);
    if (!selected) return [];
    return selected.assignments.map(assignment => ({ assignment,
      profile: data.professor_profiles.find(profile => profile.id === assignment.professor_id && profile.profile_year === assignment.profile_year)!,
    }));
  }

  async function loadSearch(options: SchoolLoadOptions = {}) {
    const manifest = await index();
    const reference = manifest.search;
    if (!reference) throw new SchoolCatalogLoadError('La ricerca della scuola non è ancora disponibile per questa versione del catalogo.');
    const data = await resource(reference.url, value => validateSchoolSearch(value, manifest), options,
      { sha256: reference.sha256, bytes: reference.bytes }, Infinity, `${manifest.release_id}:${manifest.generated_at}`);
    assertCurrentRelease(manifest);
    return { data, manifest };
  }
  const search = async (options: SchoolLoadOptions = {}) => (await loadSearch(options)).data;
  async function locateCourse(id: string, options: SchoolLoadOptions = {}) {
    const { data, manifest } = await loadSearch(options);
    const canonical = canonicalAlias(id === 'lm92_001' ? 'B034857' : id, [manifest.aliases.courses]);
    const course = data.courses.find(course => course.id === canonical || course.official_code === canonical);
    return course ? id === 'lm92_001' ? { ...course, contexts: course.contexts.filter(context => context.program_key === 'B385') } : course : null;
  }
  async function locateProfessor(id: string, options: SchoolLoadOptions = {}) {
    const { data, manifest } = await loadSearch(options);
    const canonical = canonicalAlias(id, [manifest.aliases.professors]);
    return data.professors.find(professor => professor.id === canonical || professor.official_id === canonical) ?? null;
  }
  async function find(query: string, options: SchoolFindOptions = {}) {
    const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('it');
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    if (!terms.length) return { courses: [], professors: [] };
    const { data, manifest } = await loadSearch();
    const program = options.programKey === undefined ? undefined : resolveProgram(manifest, options.programKey);
    if (options.programKey !== undefined && !program) throw new SchoolCatalogLoadError('Il corso di laurea richiesto non è presente nel catalogo della scuola.');
    if (options.cohortYear !== undefined && (!Number.isInteger(options.cohortYear) || options.cohortYear < 1900)) throw new SchoolCatalogLoadError('Seleziona un anno di ingresso valido.');
    const limit = Number.isFinite(options.limit) ? Math.max(1, Math.min(100, Math.floor(options.limit!))) : 20;
    const inScope = (context: { program_key: string; cohort_year: number }) => (!program || context.program_key === program.program_key)
      && (options.cohortYear === undefined || context.cohort_year === options.cohortYear);
    const matches = (value: string) => { const normalized = normalize(value); return terms.every(term => normalized.includes(term)); };
    return {
      courses: data.courses.filter(course => matches([course.official_code, course.name, ...course.names].join(' ')))
        .map(course => ({ ...course, contexts: course.contexts.filter(inScope) })).filter(course => course.contexts.length).slice(0, limit),
      professors: data.professors.filter(professor => matches(`${professor.official_id} ${professor.name}`))
        .map(professor => ({ ...professor, contexts: professor.contexts.filter(inScope) })).filter(professor => professor.contexts.length).slice(0, limit),
    };
  }

  return {
    index, cohort, offerings, offering, offeringDetail, professorProfile, offeringProfessors, resolveCourseRoute, resolveProgram,
    search, locateCourse, locateProfessor, find,
    refresh: () => index({ retry: true }),
    getState: (url = SCHOOL_CATALOG_INDEX_URL): SchoolResourceState => entries.get(url)?.state || IDLE,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    clear: () => { entries.forEach(entry => entry.controller.abort()); entries.clear(); activeIndex = null; publish(); },
  };
}
