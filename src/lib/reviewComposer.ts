/** Explicitly carried across login; incomplete text is never treated as a published review. */
export interface ReviewComposer { subject: 'course' | 'professor'; subjectId: string; planYear: string; ratings: Record<string, number>; content: string; isAnonymous: boolean; createdAt: number; }
const prefix = 'florence:review-composer:';
export function saveReviewComposer(value: Omit<ReviewComposer, 'createdAt'>): string {
  const id = crypto.randomUUID();
  try { localStorage.setItem(prefix + id, JSON.stringify({ ...value, createdAt: Date.now() })); }
  catch { throw new Error('Non è stato possibile conservare il testo. Salva una copia prima di accedere e riprova.'); }
  return id;
}
export function readReviewComposer(id: string, subject: string, subjectId: string, planYear: string): ReviewComposer | null {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const row = JSON.parse(localStorage.getItem(prefix + id) || 'null');
    if (!row || row.subject !== subject || row.subjectId !== subjectId || row.planYear !== planYear || typeof row.content !== 'string' || row.content.length > 5000 || typeof row.isAnonymous !== 'boolean' || !row.ratings || typeof row.ratings !== 'object' || Array.isArray(row.ratings) || !Object.values(row.ratings).every(score => typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 5)) return null;
    return row;
  } catch { return null; }
}
