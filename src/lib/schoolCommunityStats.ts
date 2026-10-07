import { createCatalogReviewStats, type CatalogStatsReader } from './catalogReviewStats';
import type { Course, Professor } from './catalogTypes';
import { schoolCommunityIdentity, type SchoolCommunityIdentity } from './schoolCommunityIdentity';
import { isSupabaseConfigured, supabase } from './supabase';

export interface SchoolCommunityStatsFields {
  rating?: number; reviewCount?: number; statsStatus: 'ready' | 'unavailable';
  difficulty?: number; teaching?: number; grading?: number;
  communityStatus: SchoolCommunityIdentity['status']; communityId?: string; communityMessage?: string;
}
type Identity = typeof schoolCommunityIdentity;
/** Attach batches to any list shape without changing its route IDs or requesting per card. */
export function createSchoolCommunityStats({ identity = schoolCommunityIdentity, read }:
  { identity?: Identity; read: CatalogStatsReader }) {
  const stats = createCatalogReviewStats({ identityMap: identity.communityIdentityMap, read });
  function fields(row: Pick<Course, 'rating' | 'reviewCount' | 'statsStatus' | 'difficulty' | 'teaching' | 'grading'>, confirmed: SchoolCommunityIdentity): SchoolCommunityStatsFields {
    if (confirmed.status !== 'ready') return { rating: undefined, reviewCount: undefined, statsStatus: 'unavailable',
      difficulty: undefined, teaching: undefined, grading: undefined, communityStatus: confirmed.status, communityId: undefined, communityMessage: confirmed.message };
    return { rating: row.rating, reviewCount: row.reviewCount, statsStatus: row.statsStatus || 'unavailable',
      difficulty: row.difficulty, teaching: row.teaching, grading: row.grading,
      communityStatus: 'ready', communityId: confirmed.communityId, communityMessage: undefined };
  }
  async function attachCourseStats<T extends { id: string; officialCode: string }>(items: T[]): Promise<Array<T & SchoolCommunityStatsFields>> {
    if (!items.length) return [];
    const confirmations = await identity.confirmCourses(items).catch(() => items.map(item => ({ status: 'unavailable' as const, catalogId: item.id,
      officialKey: item.officialCode, message: 'Statistiche non disponibili. Riprova dopo aver caricato il catalogo.' })));
    if (confirmations.every(item => item.status !== 'ready')) return items.map((item, index) => ({ ...item, ...fields({}, confirmations[index]) }));
    // The existing aggregate adapter only reads officialCode and spreads the input; no official fields are synthesized here.
    const rows = await stats.courses(items as unknown as Course[]);
    return items.map((item, index) => ({ ...item, ...fields(rows[index], confirmations[index]) }));
  }
  async function attachProfessorStats<T extends { id: string; officialId: string }>(items: T[]): Promise<Array<T & SchoolCommunityStatsFields>> {
    if (!items.length) return [];
    const confirmations = await identity.confirmProfessors(items).catch(() => items.map(item => ({ status: 'unavailable' as const, catalogId: item.id,
      officialKey: item.officialId, message: 'Statistiche non disponibili. Riprova dopo aver caricato il catalogo.' })));
    if (confirmations.every(item => item.status !== 'ready')) return items.map((item, index) => ({ ...item, ...fields({}, confirmations[index]) }));
    const rows = await stats.professors(items as unknown as Professor[]);
    return items.map((item, index) => ({ ...item, ...fields(rows[index], confirmations[index]) }));
  }
  return { attachCourseStats, attachProfessorStats, invalidate: stats.invalidate };
}

export const schoolCommunityStats = createSchoolCommunityStats({ read: async (subject, ids, signal) => {
  if (!isSupabaseConfigured) throw new Error('Statistiche non disponibili.');
  const columns = subject === 'course'
    ? 'course_id,review_count,rating,average_difficulty,average_teaching,average_grading'
    : 'professor_id,review_count,rating,average_chiarezza,average_disponibilita,average_equita';
  const { data, error } = await supabase.from(`${subject}_review_stats`).select(columns).in(`${subject}_id`, ids).abortSignal(signal);
  if (error) throw error;
  return data;
} });
export const attachCourseStats = schoolCommunityStats.attachCourseStats;
export const attachProfessorStats = schoolCommunityStats.attachProfessorStats;
if (typeof window !== 'undefined') window.addEventListener('florence:reviews-change', schoolCommunityStats.invalidate);
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('florence:reviews-change', schoolCommunityStats.invalidate));
