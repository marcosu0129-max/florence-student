import { isSupabaseConfigured, supabase } from './supabase';
import { communityWrite } from './communityApi';
import { readReviewsPage, readReviewCursorPage, type ReviewCursor } from './reviewsApi';
import { appendLocalReview, fetchDemoReviews, validateReview, type Review } from './communityStorage';

// Catalog lists, details and teacher links use the same verified source.
export {
  fetchCourses, fetchProfessors, fetchCourseById, fetchProfessorById,
  fetchCoursesByProfessor, fetchCoursesByProgram, fetchPrograms, programs,
  getCatalogStatus, subscribeCatalogStatus, getCatalogAcademicYears,
  getDefaultAcademicYear, refreshCatalog, retryCatalog, catalogCoverage, CatalogLoadError,
} from './catalog';
export type { Course, Professor, Program, CatalogStatus, RequirementGroup } from './catalogTypes';
export type { Review } from './communityStorage';
export { getSavedCourseIds, isCourseSaved, saveCourse, unsaveCourse, toggleSaveCourse, fetchDemoReviews, deleteDemoReview } from './communityStorage';

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: 'pdf' | 'audio' | 'video' | 'doc' | 'image';
  uploader: string;
  date: string;
  size: string;
  downloads: number;
  description?: string;
}

interface ReviewStorageParams {
  storage?: 'local' | 'cloud';
  isAnonymous?: boolean;
  planYear?: string;
  expectedUserId?: string;
  reviewId?: string;
  draftId?: string;
}
export interface CreateReviewParams extends ReviewStorageParams {
  courseId: string;
  courseName?: string;
  professorId?: string;
  professorName?: string;
  difficultyScore: number;
  teachingScore: number;
  gradingScore?: number;
  content: string;
  tip?: string;
}
export interface CreateProfessorReviewParams extends ReviewStorageParams {
  professorId: string;
  professorName?: string;
  chiarezzaScore: number;
  disponibilitaScore: number;
  equitaScore: number;
  content: string;
}

type SaveResult = { success: boolean; error?: string };
const SESSION_ERROR = 'Impossibile verificare la sessione. Riprova oppure accedi di nuovo.';
const WRITE_ERROR = 'Salvataggio online non riuscito. La recensione non è stata pubblicata; riprova.';
const dateLabel = (value: string | number) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data non disponibile' : date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
};
const localId = (subject: string) => `demo-${subject}-${crypto.randomUUID()}`;

async function timedRequest<T>(request: (signal: AbortSignal) => PromiseLike<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(request(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('La connessione ha impiegato troppo tempo. Riprova.'));
          controller.abort();
        }, 8000);
      }),
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

async function getReviewSession() {
  if (!isSupabaseConfigured) throw new Error(SESSION_ERROR);
  const { data, error } = await timedRequest(() => supabase.auth.getSession());
  if (error) throw new Error(SESSION_ERROR);
  return data.session;
}

export async function createReview(params: CreateReviewParams): Promise<SaveResult> {
  const validation = validateReview(params.content, [params.difficultyScore, params.teachingScore, ...(params.gradingScore === undefined ? [] : [params.gradingScore])]);
  if (validation) return { success: false, error: validation };
  if (!params.courseId?.trim()) return { success: false, error: 'Corso non valido. Riapri la scheda e riprova.' };
  const content = params.content.trim();
  try {
    // Saving a local preview never consults the session or changes storage implicitly.
    if ((params.storage ?? 'local') === 'local') {
      appendLocalReview({
        id: params.draftId || localId('course'), courseId: params.courseId, courseName: params.courseName,
        professorId: params.professorId, professorName: params.professorName,
        subjectType: 'course', isDemo: true, isMine: true, isAnonymous: params.isAnonymous !== false, planYear: params.planYear,
        author: params.isAnonymous === false ? 'Tu' : 'Studente anonimo', date: dateLabel(Date.now()),
        ratingDifficulty: params.difficultyScore, ratingTeaching: params.teachingScore,
        grade: params.gradingScore, content, tip: params.tip?.trim() || undefined,
        tipType: params.tip?.trim() ? 'success' : undefined, helpfulCount: 0,
      });
      return { success: true };
    }
    const session = await getReviewSession();
    if (!session) return { success: false, error: 'Accedi per pubblicare una recensione online.' };
    await communityWrite('save_course_review', {
      p_course_id: params.courseId, p_professor_id: params.professorId || null,
      p_difficulty_score: params.difficultyScore, p_teaching_score: params.teachingScore,
      p_grading_score: params.gradingScore, p_content: content, p_tip: params.tip?.trim() || null,
      p_is_anonymous: params.isAnonymous !== false, p_plan_year: params.planYear || null, p_review_id: params.reviewId || null,
    }, params.expectedUserId || '');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('florence:reviews-change'));
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : WRITE_ERROR }; }
}

export async function createProfessorReview(params: CreateProfessorReviewParams): Promise<SaveResult> {
  const validation = validateReview(params.content, [params.chiarezzaScore, params.disponibilitaScore, params.equitaScore]);
  if (validation) return { success: false, error: validation };
  if (!params.professorId?.trim()) return { success: false, error: 'Docente non valido. Riapri la scheda e riprova.' };
  const content = params.content.trim();
  try {
    if ((params.storage ?? 'local') === 'local') {
      appendLocalReview({
        id: params.draftId || localId('professor'), courseId: '', professorId: params.professorId,
        professorName: params.professorName, courseName: params.professorName,
        subjectType: 'professor', isDemo: true, isMine: true, isAnonymous: params.isAnonymous !== false, planYear: params.planYear,
        author: params.isAnonymous === false ? 'Tu' : 'Studente anonimo', date: dateLabel(Date.now()),
        chiarezzaScore: params.chiarezzaScore, disponibilitaScore: params.disponibilitaScore,
        equitaScore: params.equitaScore, ratingDifficulty: params.equitaScore,
        ratingTeaching: params.chiarezzaScore, content, helpfulCount: 0,
      });
      return { success: true };
    }
    const session = await getReviewSession();
    if (!session) return { success: false, error: 'Accedi per pubblicare una recensione online.' };
    await communityWrite('save_professor_review', {
      p_professor_id: params.professorId, p_chiarezza_score: params.chiarezzaScore,
      p_disponibilita_score: params.disponibilitaScore, p_equita_score: params.equitaScore,
      p_content: content, p_is_anonymous: params.isAnonymous !== false,
      p_plan_year: params.planYear || null, p_review_id: params.reviewId || null,
    }, params.expectedUserId || '');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('florence:reviews-change'));
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : WRITE_ERROR }; }
}

export const fetchAllReviews = (offset = 0) => readReviewsPage({ offset });
export async function fetchUserReviews(): Promise<Review[]> {
  const session = await getReviewSession();
  const cloud: Review[] = [];
  if (session) {
    let cursor: ReviewCursor | null = null;
    do {
      const page = await readReviewCursorPage({ mine: true, cursor });
      cloud.push(...page.items.filter(row => !cloud.some(existing => existing.id === row.id && existing.subjectType === row.subjectType)));
      cursor = page.nextCursor;
    } while (cursor);
  }
  return [...cloud, ...fetchDemoReviews()];
}
export const fetchReviewsByCourse = (courseId: string, offset = 0) => readReviewsPage({ subjectType: 'course', subjectId: courseId, offset });
export const fetchReviewsByProfessor = (professorId: string, offset = 0) => readReviewsPage({ subjectType: 'professor', subjectId: professorId, offset });

export function getProfessorInitials(name: string): string {
  return name.replace(/^(Prof\.?|Prof\.ssa\.?)\s*/i, '').split(' ').filter(Boolean).map(part => part[0].toUpperCase()).slice(0, 2).join('');
}
