import snapshotUrl from '../../data/catalog/lm92.catalog.json?url';
import { createCatalogRepository } from './catalogRepository';
import type { CatalogIdentityMap } from './catalogRepository';
import { validateCatalog } from './catalogMapper';
import { createCatalogReviewStats } from './catalogReviewStats';

const IDENTITY_KEY = 'florence:official-catalog-identities:v1';
export let catalogCoverage: Record<string, unknown> | undefined;
function readIdentityMap(): Partial<CatalogIdentityMap> | undefined {
  try {
    const value = JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null');
    return value && typeof value === 'object' ? value : undefined;
  } catch { return undefined; }
}

const repository = createCatalogRepository({
  loadSnapshot: async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(snapshotUrl, { signal: controller.signal });
      if (!response.ok) throw new Error('Impossibile caricare la copia ufficiale UNIFI. Riprova.');
      const snapshot = validateCatalog(await response.json());
      catalogCoverage = snapshot.coverage;
      return snapshot;
    } catch (error) {
      if (controller.signal.aborted || error instanceof TypeError) throw new Error('Connessione interrotta durante il caricamento della copia ufficiale UNIFI. Riprova.');
      throw error;
    } finally { clearTimeout(timer); }
  },
  identityMap: readIdentityMap(),
  onIdentityMap: (identityMap) => {
    try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(identityMap)); } catch { /* Private browsing can disable storage. */ }
  },
  fetchCloud: async () => {
    const { isSupabaseConfigured, supabase, supabaseConfigurationError } = await import('./supabase');
    if (!isSupabaseConfigured) throw new Error(supabaseConfigurationError || 'Connessione al database non configurata.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const { data, error } = await supabase
        .from('official_catalog_snapshots')
        .select('payload,imported_at,source_generated_at')
        .eq('program_code', 'LM-92')
        .order('academic_year', { ascending: false })
        .limit(1)
        .abortSignal(controller.signal);
      if (error) {
        if (controller.signal.aborted) throw new Error('Il database non risponde. Riprova per aggiornare il catalogo.');
        if (['PGRST205', '42P01'].includes(error.code)) throw new Error('Il catalogo ufficiale LM-92 non è ancora stato importato nel database.');
        if (['42501', 'PGRST301', 'PGRST302'].includes(error.code)) throw new Error('Il database non consente la lettura del catalogo. Verifica la configurazione e i permessi.');
        throw new Error('Impossibile leggere il catalogo dal database. Riprova per aggiornare i dati.');
      }
      if (!data?.[0]?.payload) throw new Error('Il catalogo ufficiale LM-92 non è ancora stato importato nel database.');
      return { payload: data[0].payload, importedAt: data[0].imported_at };
    } catch (error) {
      if (controller.signal.aborted) throw new Error('Il database non risponde. Riprova per aggiornare il catalogo.');
      if (error instanceof TypeError) throw new Error('Connessione al database non disponibile. Riprova per aggiornare il catalogo.');
      throw error;
    } finally { clearTimeout(timer); }
  },
});

const reviewStats = createCatalogReviewStats({
  identityMap: repository.identityMap,
  read: async (subject, ids, signal) => {
    const { isSupabaseConfigured, supabase } = await import('./supabase');
    if (!isSupabaseConfigured) throw new Error('Statistiche non disponibili.');
    const fields = subject === 'course'
      ? 'course_id,review_count,rating,average_difficulty,average_teaching,average_grading'
      : 'professor_id,review_count,rating,average_chiarezza,average_disponibilita,average_equita';
    const { data, error } = await supabase.from(`${subject}_review_stats`).select(fields).in(`${subject}_id`, ids).abortSignal(signal);
    if (error) throw error;
    return data;
  },
});
export const invalidateCatalogReviewStats = reviewStats.invalidate;
if (typeof window !== 'undefined') window.addEventListener('florence:reviews-change', invalidateCatalogReviewStats);
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('florence:reviews-change', invalidateCatalogReviewStats));

export const canonicalCourseKey = (id: string) => repository.identityMap().courseAliases[id] || id;
export const getCatalogStatus = repository.getStatus;
export const subscribeCatalogStatus = repository.subscribe;
export const getCatalogAcademicYears = repository.academicYears;
export const getDefaultAcademicYear = repository.defaultAcademicYear;
export const refreshCatalog = (...args: Parameters<typeof repository.refresh>) => {
  invalidateCatalogReviewStats();
  return repository.refresh(...args);
};
export const retryCatalog = refreshCatalog;
export const fetchCourses = async (...args: Parameters<typeof repository.courses>) => reviewStats.courses(await repository.courses(...args));
export const fetchCourseById = async (...args: Parameters<typeof repository.courseById>) => {
  const course = await repository.courseById(...args);
  return course ? (await reviewStats.courses([course]))[0] : null;
};
export const fetchProfessors = async (...args: Parameters<typeof repository.professors>) => reviewStats.professors(await repository.professors(...args));
export const fetchProfessorById = async (...args: Parameters<typeof repository.professorById>) => {
  const professor = await repository.professorById(...args);
  return professor ? (await reviewStats.professors([professor]))[0] : null;
};
export const fetchCoursesByProfessor = async (...args: Parameters<typeof repository.coursesByProfessor>) => reviewStats.courses(await repository.coursesByProfessor(...args));
export const fetchPrograms = repository.programs;
export const programs = repository.initialPrograms();

repository.subscribe(() => {
  // Retain the old synchronous export for existing callers; only official programs remain.
  programs.splice(0, programs.length, ...repository.initialPrograms());
});

export async function fetchCoursesByProgram(programCode: string, academicYear?: string) {
  return fetchCourses([programCode], academicYear);
}

export { CatalogLoadError } from './catalogMapper';
export type { Course, Professor, Program, CatalogStatus, RequirementGroup } from './catalogTypes';
