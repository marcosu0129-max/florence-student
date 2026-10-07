import type { Review } from './communityStorage';

// UUIDs are unique within each table, and local drafts have a separate identity.
export function reviewKey(review: Pick<Review, 'id' | 'subjectType' | 'isDemo'>): string {
  return JSON.stringify([review.isDemo ? 'local' : 'account', review.subjectType || 'course', review.id]);
}

/** Name enrichment must not replace another subject, revive deleted rows, or overwrite newer edits. */
export function applyReviewNames(current: Review[], enriched: Review[]): Review[] {
  const names = new Map(enriched.map(review => [reviewKey(review), review.courseName]));
  return current.map(review => {
    const name = names.get(reviewKey(review));
    return !review.courseName && name ? { ...review, courseName: name } : review;
  });
}
