import type { SchoolOtherAsset, SchoolOtherIndex, SchoolOtherLoadOptions, SchoolOtherReader } from './schoolOtherTypes';
import { SchoolOtherLoadError, validateSchoolOtherDirectory, validateSchoolOtherDocument, validateSchoolOtherIndex, validateSchoolOtherManifest, validateSchoolOtherProgram, validateSchoolOtherProvenance, validateSchoolOtherScope } from './schoolOtherValidation';

export const SCHOOL_OTHER_INDEX_URL = '/catalog/school-other/index.json';
export class SchoolOtherSupersededError extends Error {
  constructor() { super('La richiesta è stata sostituita da una versione più recente.'); this.name = 'SchoolOtherSupersededError'; }
}
export type SchoolOtherRequestResult<T> = { status: 'ready'; data: T } | { status: 'error'; error: Error } | { status: 'superseded' };
/** One scope per mounted consumer prevents a late result from changing a newer selection. */
export function createSchoolOtherRequestScope() {
  let revision = 0;
  return {
    cancel: () => { revision += 1; },
    async run<T>(request: () => Promise<T>): Promise<SchoolOtherRequestResult<T>> {
      const current = ++revision;
      try { const data = await request(); return current === revision ? { status: 'ready', data } : { status: 'superseded' }; }
      catch (error) {
        if (current !== revision || error instanceof SchoolOtherSupersededError) return { status: 'superseded' };
        return { status: 'error', error: error instanceof Error ? error : new SchoolOtherLoadError() };
      }
    },
  };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
interface Entry { fingerprint: string; until: number; controller: AbortController; promise: Promise<unknown>; }

export function createSchoolOtherRepository({ read, now = Date.now, indexTtlMs = 60000, timeoutMs = 12000 }:
  { read: SchoolOtherReader; now?: () => number; indexTtlMs?: number; timeoutMs?: number }) {
  const cache = new Map<string, Entry>();
  let activeIndex: SchoolOtherIndex | null = null;
  let generation = 0;
  function resource<T>(url: string, validate: (value: unknown) => T, options: SchoolOtherLoadOptions = {}, integrity: Partial<SchoolOtherAsset> = {}, ttl = Infinity): Promise<T> {
    const fingerprint = `${integrity.sha256 || ''}:${integrity.bytes ?? ''}`;
    const prior = cache.get(url);
    if (!options.retry && prior?.fingerprint === fingerprint && prior.until > now()) return prior.promise as Promise<T>;
    prior?.controller.abort();
    const controller = new AbortController();
    const entry: Entry = { fingerprint, until: Infinity, controller, promise: Promise.resolve() };
    cache.set(url, entry);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    entry.promise = Promise.race([
      Promise.resolve().then(() => read(url, { signal: controller.signal, sha256: integrity.sha256, bytes: integrity.bytes })),
      new Promise<never>((_, reject) => {
        onAbort = () => reject(new SchoolOtherSupersededError());
        controller.signal.addEventListener('abort', onAbort, { once: true });
        timer = setTimeout(() => {
          // Reject with a useful timeout before aborting a transport that may ignore cancellation.
          reject(new SchoolOtherLoadError('Il caricamento sta impiegando troppo tempo. Riprova.'));
          controller.abort();
        }, timeoutMs);
      }),
    ]).then(value => {
      if (cache.get(url) !== entry) throw new SchoolOtherSupersededError();
      const result = freeze(validate(value)); entry.until = now() + ttl; return result;
    }).catch(reason => {
      if (cache.get(url) !== entry) throw new SchoolOtherSupersededError();
      cache.delete(url); // Failed requests never poison a later retry.
      throw reason instanceof Error && !(reason instanceof TypeError) ? reason : new SchoolOtherLoadError();
    }).finally(() => { if (timer) clearTimeout(timer); if (onAbort) controller.signal.removeEventListener('abort', onAbort); });
    return entry.promise as Promise<T>;
  }
  async function index(options: SchoolOtherLoadOptions = {}) {
    const snapshot = generation;
    const data = await resource(SCHOOL_OTHER_INDEX_URL, validateSchoolOtherIndex, options, {}, indexTtlMs);
    if (snapshot !== generation) throw new SchoolOtherSupersededError();
    activeIndex = data; return data;
  }
  function assertCurrent(snapshot: SchoolOtherIndex, expectedGeneration: number) {
    if (generation !== expectedGeneration || activeIndex?.release_id !== snapshot.release_id) throw new SchoolOtherSupersededError();
  }
  async function asset<T>(snapshot: SchoolOtherIndex, reference: SchoolOtherAsset, validate: (value: unknown) => T, options: SchoolOtherLoadOptions = {}, expectedGeneration = generation) {
    assertCurrent(snapshot, expectedGeneration);
    const data = await resource(reference.url, validate, options, reference);
    assertCurrent(snapshot, expectedGeneration); return data;
  }
  async function program(id: string, options: SchoolOtherLoadOptions = {}) {
    const snapshot = await index(); const reference = snapshot.programs.find(p => p.id === id);
    return reference ? asset(snapshot, reference.detail, value => validateSchoolOtherProgram(value, snapshot, reference), options) : null;
  }
  async function edition(id: string, academicYearStart: number, options: SchoolOtherLoadOptions = {}) {
    if (!Number.isInteger(academicYearStart) || academicYearStart < 1900) throw new SchoolOtherLoadError('Seleziona un anno accademico valido.');
    const data = await program(id, options);
    // Exact academic-year match. Running two-year editions are not new admission cohorts.
    return data?.program.editions.find(item => item.academic_year_start === academicYearStart) ?? null;
  }
  async function directoryEntry(id: string, options: SchoolOtherLoadOptions = {}) {
    const snapshot = await index(); const reference = snapshot.directory_entries.find(entry => entry.id === id);
    return reference ? asset(snapshot, reference.detail, value => validateSchoolOtherDirectory(value, snapshot, reference), options) : null;
  }
  async function scope(options: SchoolOtherLoadOptions = {}) {
    const snapshot = await index(); return asset(snapshot, snapshot.scope, value => validateSchoolOtherScope(value, snapshot), options);
  }
  async function loadProvenance(options: SchoolOtherLoadOptions = {}) {
    const snapshot = await index(); const expectedGeneration = generation;
    const data = await asset(snapshot, snapshot.provenance, value => validateSchoolOtherProvenance(value, snapshot), options, expectedGeneration);
    return { snapshot, data, expectedGeneration };
  }
  const provenance = async (options: SchoolOtherLoadOptions = {}) => (await loadProvenance(options)).data;
  async function document(id: string, options: SchoolOtherLoadOptions = {}) {
    const { snapshot, data, expectedGeneration } = await loadProvenance(); const reference = data.documents.find(d => d.id === id);
    return reference ? asset(snapshot, reference, value => validateSchoolOtherDocument(value, snapshot, reference), options, expectedGeneration) : null;
  }
  async function manifest(options: SchoolOtherLoadOptions = {}) {
    const snapshot = await index(); const expectedGeneration = generation;
    // Immutable manifest carries checksums for every asset; index is the discovery trust anchor.
    const data = await resource(snapshot.manifest_url, value => validateSchoolOtherManifest(value, snapshot), options);
    assertCurrent(snapshot, expectedGeneration); return data;
  }
  return {
    index, program, edition, directoryEntry, scope, provenance, document, manifest,
    refresh: () => index({ retry: true }),
    clear: () => { generation += 1; cache.forEach(entry => entry.controller.abort()); cache.clear(); activeIndex = null; },
  };
}
