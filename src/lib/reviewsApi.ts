import { communityRequest, communityRpc, communityWrite } from './communityApi';
import { supabase } from './supabase';
import type { Review } from './communityStorage';
export type ReviewSubject = 'course' | 'professor';
export interface ReviewRow {
  id: string; subject_type: ReviewSubject; course_id: string | null; professor_id: string | null;
  course_name: string | null; professor_name: string | null; author: string; is_anonymous: boolean; is_mine: boolean;
  plan_year: string | null; difficulty_score: number | null; teaching_score: number | null; grading_score: number | null;
  chiarezza_score: number | null; disponibilita_score: number | null; equita_score: number | null;
  verbal_review: string; exam_tips: string | null; helpful_count: number; status: string; created_at: string;
}
export function mapReview(row: ReviewRow): Review {
  return { id: row.id, courseId: row.course_id || '', professorId: row.professor_id || undefined,
    subjectType: row.subject_type, isDemo: false, isMine: row.is_mine, isAnonymous: row.is_anonymous, status: row.status,
    author: row.is_anonymous ? 'Studente anonimo' : row.author || 'Studente',
    date: new Date(row.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    courseName: (row.subject_type === 'professor' ? row.professor_name : row.course_name) || undefined,
    professorName: row.professor_name || undefined, planYear: row.plan_year || undefined,
    ratingDifficulty: row.difficulty_score ?? row.equita_score ?? 0, ratingTeaching: row.teaching_score ?? row.chiarezza_score ?? 0,
    grade: row.grading_score ?? undefined, chiarezzaScore: row.chiarezza_score ?? undefined,
    disponibilitaScore: row.disponibilita_score ?? undefined, equitaScore: row.equita_score ?? undefined,
    content: row.verbal_review, tip: row.exam_tips || undefined, helpfulCount: row.helpful_count || 0 };
}
export async function readReviewsPage({ subjectType, subjectId, mine = false, offset = 0 }: { subjectType?: ReviewSubject; subjectId?: string; mine?: boolean; offset?: number } = {}) {
  const rows = await communityRpc<ReviewRow[]>('list_reviews', { p_subject_type: subjectType || null, p_subject_id: subjectId || null, p_mine: mine, p_limit: 100, p_offset: offset });
  return (rows || []).map(mapReview);
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export interface ReviewCursor { created_at: string; id: string; subject_type: ReviewSubject; }
export interface ReviewPage { items: Review[]; hasMore: boolean; nextCursor: ReviewCursor | null; }
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
function isReviewCursor(value: unknown): value is ReviewCursor {
  return record(value) && typeof value.id === 'string' && UUID.test(value.id)
    && typeof value.created_at === 'string' && Number.isFinite(Date.parse(value.created_at))
    && (value.subject_type === 'course' || value.subject_type === 'professor');
}
const sameCursor = (a: ReviewCursor, b: ReviewCursor) => a.id === b.id && a.created_at === b.created_at && a.subject_type === b.subject_type;
export function parseReviewPage(value: unknown, requested: ReviewCursor | null = null): ReviewPage {
  const invalid = () => new Error('Elenco delle recensioni non valido. Aggiorna e riprova.');
  if (!record(value) || !Array.isArray(value.items) || typeof value.has_more !== 'boolean' || value.items.length > 100) throw invalid();
  const rows = value.items.map(item => {
    if (!isReviewCursor(item) || !record(item)
      || !['author', 'verbal_review', 'status'].every(k => typeof item[k] === 'string')
      || !['is_anonymous', 'is_mine'].every(k => typeof item[k] === 'boolean')
      || !['course_name', 'professor_name', 'plan_year', 'exam_tips'].every(k => item[k] === null || typeof item[k] === 'string')
      || !['course_id', 'professor_id'].every(k => item[k] === null || (typeof item[k] === 'string' && UUID.test(item[k])))
      || (item.subject_type === 'course' ? !item.course_id : !item.professor_id)
      || !['difficulty_score', 'teaching_score', 'grading_score', 'chiarezza_score', 'disponibilita_score', 'equita_score'].every(k => item[k] === null || (typeof item[k] === 'number' && Number.isFinite(item[k])))
      || typeof item.helpful_count !== 'number' || !Number.isSafeInteger(item.helpful_count) || item.helpful_count < 0) throw invalid();
    return item as unknown as ReviewRow;
  });
  if (new Set(rows.map(row => `${row.subject_type}:${row.id}`)).size !== rows.length) throw invalid();
  const next = value.next_cursor;
  if (value.has_more ? !isReviewCursor(next) || !rows.length || !sameCursor(next, rows[rows.length - 1]) || (requested && sameCursor(next, requested)) : next !== null) throw invalid();
  return { items: rows.map(mapReview), hasMore: value.has_more, nextCursor: next as ReviewCursor | null };
}
export function createReviewPager(rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> = communityRpc) {
  return async ({ subjectType, subjectId, mine = false, cursor = null }: { subjectType?: ReviewSubject; subjectId?: string; mine?: boolean; cursor?: ReviewCursor | null } = {}): Promise<ReviewPage> => {
    if ((subjectType && !['course', 'professor'].includes(subjectType)) || (subjectId && (!subjectType || !UUID.test(subjectId))) || (cursor !== null && !isReviewCursor(cursor))) throw new Error('Pagina delle recensioni non valida.');
    return parseReviewPage(await rpc('list_reviews_v2', { p_subject_type: subjectType || null, p_subject_id: subjectId || null, p_mine: mine, p_limit: 100, p_cursor: cursor }), cursor);
  };
}
export const readReviewCursorPage = createReviewPager();
interface ReviewActionsTransport {
  write: (name: string, params: Record<string, unknown>, userId: string) => Promise<unknown>;
  changed: () => void;
}
export function createReviewActions(transport: ReviewActionsTransport = {
  write: communityWrite,
  changed: () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('florence:reviews-change')); },
}) {
  function subject(review: Review, userId: string) {
    if (!userId.trim()) throw new Error('Accedi di nuovo per continuare.');
    if (!UUID.test(review.id) || (review.subjectType && !['course', 'professor'].includes(review.subjectType))) throw new Error('La recensione selezionata non è valida. Aggiorna l’elenco.');
    return review.subjectType || 'course';
  }
  return {
    async remove(review: Review, userId: string) {
      const deleted = await transport.write('delete_my_review', { p_subject_type: subject(review, userId), p_review_id: review.id }, userId);
      if (deleted !== true) throw new Error('Eliminazione non confermata. La recensione potrebbe essere già stata rimossa oppure non appartenere a questo account. Aggiorna l’elenco.');
      transport.changed();
      return true;
    },
    async report(review: Review, reason: string, userId: string) {
      const subjectType = subject(review, userId);
      const trimmed = reason.trim();
      if (trimmed.length < 10 || trimmed.length > 1000) throw new Error('Descrivi il problema con un testo da 10 a 1000 caratteri.');
      const result = await transport.write('report_review', { p_subject_type: subjectType, p_review_id: review.id, p_reason: trimmed }, userId);
      if (typeof result !== 'string' || !UUID.test(result)) throw new Error('Invio non confermato. Riprova la segnalazione.');
      return result;
    },
  };
}
const reviewActions = createReviewActions();
export const deleteCloudReview = reviewActions.remove;
export const reportReview = reviewActions.report;
export interface ReviewStats { review_count: number; rating: number; average_difficulty?: number; average_teaching?: number; average_grading?: number; average_chiarezza?: number; average_disponibilita?: number; average_equita?: number; }
export async function fetchReviewStats(subjectType: ReviewSubject, subjectId: string): Promise<ReviewStats | null> {
  return communityRequest<ReviewStats | null>(signal => supabase.from(subjectType === 'course' ? 'course_review_stats' : 'professor_review_stats').select('*').eq(subjectType === 'course' ? 'course_id' : 'professor_id', subjectId).abortSignal(signal).maybeSingle());
}
