import type { Review } from './communityStorage';

/** A local draft never counts as an account or published review, even if legacy fields say otherwise. */
export function reviewActivitySummary(reviews: Pick<Review, 'isDemo' | 'status'>[]) {
  const summary = { account: 0, localDrafts: 0, published: 0, hidden: 0, other: 0 };
  for (const review of reviews) {
    if (review.isDemo === true) { summary.localDrafts += 1; continue; }
    summary.account += 1;
    if (review.status === 'published') summary.published += 1;
    else if (review.status === 'hidden') summary.hidden += 1;
    else summary.other += 1;
  }
  return summary;
}
