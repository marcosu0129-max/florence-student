import { communityRequest } from './communityApi';
import { supabase } from './supabase';
import type { MaterialRecord, ModerationReport } from './materialsApi';

export interface ListingCursor { created_at: string; id: string; }
export interface ListingPage<T> { items: T[]; hasMore: boolean; nextCursor: ListingCursor | null; }
export type ReviewSubject = 'course' | 'professor';
export interface HiddenReviewRecord { id: string; subject_type: ReviewSubject; subject_name: string; verbal_review: string; plan_year: string | null; moderation_note: string | null; created_at: string; }
export type ModerationQueueKind = 'pending' | 'reconsider' | 'reports';
export interface MaterialFilters { courseId?: string | null; mine?: boolean; query?: string; fileType?: string | null; planYear?: string | null; }
type ListingRpc = (name: string, params: Record<string, unknown>) => Promise<unknown>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const invalidPage = () => new Error('La risposta dell’elenco non è valida. Aggiorna la pagina e riprova.');
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const identity = (value: unknown): value is string => typeof value === 'string' && uuid.test(value);
function cursor(value: unknown): value is ListingCursor {
  return object(value) && identity(value.id) && date(value.created_at);
}
function material(value: unknown): MaterialRecord {
  if (!object(value) || !identity(value.id) || !identity(value.course_id) || !date(value.created_at)
    || !['course_name', 'uploader', 'title', 'file_type', 'status'].every(key => typeof value[key] === 'string')
    || !['description', 'mime_type', 'storage_bucket', 'storage_path', 'plan_year', 'moderation_note'].every(key => value[key] === null || typeof value[key] === 'string')
    || !(value.file_size === null || (typeof value.file_size === 'number' && Number.isSafeInteger(value.file_size) && value.file_size >= 0))) throw invalidPage();
  return value as unknown as MaterialRecord;
}
function report(value: unknown): ModerationReport {
  if (!object(value) || !identity(value.id) || !identity(value.review_id) || !date(value.created_at)
    || !['course', 'professor'].includes(String(value.subject_type)) || typeof value.reason !== 'string' || typeof value.status !== 'string'
    || !['verbal_review', 'subject_name'].every(key => value[key] === null || typeof value[key] === 'string')) throw invalidPage();
  return value as unknown as ModerationReport;
}
function hiddenReview(value: unknown, subject: ReviewSubject): HiddenReviewRecord {
  if (!object(value) || !identity(value.id) || !date(value.created_at) || value.subject_type !== subject
    || typeof value.subject_name !== 'string' || typeof value.verbal_review !== 'string'
    || !['plan_year', 'moderation_note'].every(key => value[key] === null || typeof value[key] === 'string')) throw invalidPage();
  return value as unknown as HiddenReviewRecord;
}
function parsePage<T>(value: unknown, parse: (item: unknown) => T, requestedCursor: ListingCursor | null): ListingPage<T> {
  if (!object(value) || !Array.isArray(value.items) || typeof value.has_more !== 'boolean'
    || (value.has_more ? !cursor(value.next_cursor) || value.items.length === 0 : value.next_cursor !== null)) throw invalidPage();
  const next = value.next_cursor as ListingCursor | null;
  if (next && requestedCursor && next.id === requestedCursor.id && next.created_at === requestedCursor.created_at) throw invalidPage();
  return { items: value.items.map(parse), hasMore: value.has_more, nextCursor: next };
}
const defaultRpc: ListingRpc = (name, params) => communityRequest(async signal => {
  const result = await supabase.rpc(name, params).abortSignal(signal);
  if (result.error && ['PGRST202', '42883'].includes(result.error.code)) {
    throw new Error('Il servizio materiali e moderazione è in aggiornamento. La ricerca completa e le nuove pagine non sono ancora disponibili. Riprova dopo l’aggiornamento; i contenuti sono conservati.');
  }
  return result;
});
export function createMaterialListingApi(rpc: ListingRpc = defaultRpc) {
  return {
    async materials(filters: MaterialFilters = {}, next: ListingCursor | null = null): Promise<ListingPage<MaterialRecord>> {
      const query = filters.query?.trim() || '';
      if (query.length > 200 || (filters.courseId && !identity(filters.courseId))
        || (filters.fileType && !['pdf', 'doc', 'image', 'audio'].includes(filters.fileType)) || (next !== null && !cursor(next))) throw new Error('Controlla i filtri dei materiali e riprova.');
      return parsePage(await rpc('list_resources_v2', { p_course_id: filters.courseId || null, p_mine: filters.mine || false,
        p_query: query || null, p_file_type: filters.fileType || null, p_plan_year: filters.planYear || null, p_limit: 100, p_cursor: next }), material, next);
    },
    async hiddenReviews(subject: ReviewSubject, next: ListingCursor | null = null): Promise<ListingPage<HiddenReviewRecord>> {
      if (!['course', 'professor'].includes(subject) || (next !== null && !cursor(next))) throw new Error('Pagina delle recensioni non valida.');
      return parsePage(await rpc('admin_hidden_review_page', { p_subject_type: subject, p_limit: 100, p_cursor: next }), value => hiddenReview(value, subject), next);
    },
    async moderation<K extends ModerationQueueKind>(kind: K, next: ListingCursor | null = null): Promise<ListingPage<K extends 'reports' ? ModerationReport : MaterialRecord>> {
      if (!['pending', 'reconsider', 'reports'].includes(kind) || (next !== null && !cursor(next))) throw new Error('Pagina di moderazione non valida.');
      return parsePage(await rpc('admin_queue_page', { p_kind: kind, p_limit: 100, p_cursor: next }), kind === 'reports' ? report : material as (item: unknown) => ModerationReport | MaterialRecord, next) as ListingPage<K extends 'reports' ? ModerationReport : MaterialRecord>;
    },
  };
}
const listing = createMaterialListingApi();
export const fetchMaterialPage = listing.materials;
export const fetchModerationPage = listing.moderation;

export const fetchHiddenReviewPage = listing.hiddenReviews;
