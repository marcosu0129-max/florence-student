import type { CatalogIdentityMap } from './catalogRepository';
import type { Course, Professor } from './catalogTypes';

export type CatalogReviewSubject = 'course' | 'professor';
export type CatalogStatsReader = (subject: CatalogReviewSubject, ids: string[], signal: AbortSignal) => PromiseLike<unknown>;
interface PublishedStats { reviewCount: number; rating?: number; difficulty?: number; teaching?: number; grading?: number; }
type StatsResult = { available: true; rows: Map<string, PublishedStats> } | { available: false };
interface Options {
  identityMap: () => CatalogIdentityMap;
  read: CatalogStatsReader;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unavailable = { statsStatus: 'unavailable' as const, reviewCount: undefined, rating: undefined };

function numeric(value: unknown): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) throw new Error('Invalid review statistic');
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error('Invalid review statistic');
  return result;
}
function score(value: unknown): number {
  const result = numeric(value);
  if (result < 1 || result > 5) throw new Error('Invalid review score');
  return result;
}

function parseRows(subject: CatalogReviewSubject, ids: string[], value: unknown): Map<string, PublishedStats> {
  if (!Array.isArray(value)) throw new Error('Missing review statistics');
  const expected = new Set(ids);
  const rows = new Map<string, PublishedStats>();
  for (const item of value) {
    if (!item || typeof item !== 'object') throw new Error('Invalid review statistics');
    const row = item as Record<string, unknown>;
    const id = row[`${subject}_id`];
    if (typeof id !== 'string' || !expected.has(id) || rows.has(id)) throw new Error('Invalid review identity');
    const reviewCount = numeric(row.review_count);
    if (!Number.isSafeInteger(reviewCount) || reviewCount < 0) throw new Error('Invalid review count');
    if (!reviewCount) { rows.set(id, { reviewCount: 0 }); continue; }
    const stats: PublishedStats = { reviewCount, rating: score(row.rating) };
    if (subject === 'course') {
      stats.difficulty = score(row.average_difficulty);
      stats.teaching = score(row.average_teaching);
      stats.grading = score(row.average_grading);
    } else {
      score(row.average_chiarezza);
      score(row.average_disponibilita);
      score(row.average_equita);
    }
    rows.set(id, stats);
  }
  return rows;
}

/** Read only published aggregates. Shared batches prevent one request per saved course/card. */
export function createCatalogReviewStats({ identityMap, read, now = Date.now, ttlMs = 30000, timeoutMs = 4000 }: Options) {
  const cache = new Map<string, { until: number; pending: Promise<StatsResult> }>();

  function load(subject: CatalogReviewSubject, businessIds: Record<string, string>): Promise<StatsResult> {
    const ids = [...new Set(Object.values(businessIds).filter(id => UUID.test(id)))].sort();
    if (!ids.length) return Promise.resolve({ available: false });
    const key = `${subject}:${ids.join(',')}`;
    const existing = cache.get(key);
    if (existing && existing.until > now()) return existing.pending;
    const entry = { until: Infinity, pending: Promise.resolve<StatsResult>({ available: false }) };
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const request = Promise.resolve().then(async () => {
      // Bound URLs and stay below the server row cap when the catalog grows.
      const batches: string[][] = [];
      for (let offset = 0; offset < ids.length; offset += 100) batches.push(ids.slice(offset, offset + 100));
      const results = await Promise.all(batches.map(async batch => parseRows(subject, batch, await read(subject, batch, controller.signal))));
      return { available: true as const, rows: new Map(results.flatMap(rows => [...rows])) };
    });
    entry.pending = Promise.race([
      request,
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Review statistics timeout')); }, timeoutMs); }),
    ]).catch(() => {
      controller.abort();
      return { available: false as const };
    }).then(result => {
      // Failed reads have a short retry window; they never become fabricated zeroes.
      entry.until = now() + (result.available ? ttlMs : Math.min(ttlMs, 2000));
      return result;
    }).finally(() => { if (timer) clearTimeout(timer); });
    cache.set(key, entry);
    return entry.pending;
  }

  async function courses(items: Course[]): Promise<Course[]> {
    if (!items.length) return [];
    const ids = { ...identityMap().businessCourseIds };
    const result = await load('course', ids);
    return items.map(item => {
      const id = ids[item.officialCode];
      if (!result.available || !id || !UUID.test(id)) return { ...item, ...unavailable, difficulty: undefined, teaching: undefined, grading: undefined };
      const stats = result.rows.get(id) || { reviewCount: 0 };
      return { ...item, ...unavailable, difficulty: undefined, teaching: undefined, grading: undefined, ...stats, statsStatus: 'ready' };
    });
  }

  async function professors(items: Professor[]): Promise<Professor[]> {
    if (!items.length) return [];
    const ids = { ...identityMap().businessProfessorIds };
    const result = await load('professor', ids);
    return items.map(item => {
      const id = ids[item.officialId];
      if (!result.available || !id || !UUID.test(id)) return { ...item, ...unavailable };
      return { ...item, ...unavailable, ...(result.rows.get(id) || { reviewCount: 0 }), statsStatus: 'ready' };
    });
  }
  return { courses, professors, invalidate: () => cache.clear() };
}
