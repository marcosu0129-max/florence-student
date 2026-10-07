import { useEffect, useState } from 'react';
import { applyReviewNames } from './reviewIdentity';
import { fetchCourseById, fetchProfessorById, fetchDemoReviews, type Review } from './dataService';

/** Community reads can fail without hiding the drafts already saved on this device. */
export function useReviewList(loader: () => Promise<Review[]>, planYear: string, ownerKey = 'guest', enabled = true) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    setError('');
    async function load() {
      let loaded: Review[];
      try {
        loaded = await Promise.race([
          loader(),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Timeout')), 15000); }),
        ]);
      } catch {
        loaded = fetchDemoReviews();
        if (active) setError('Le recensioni online non sono disponibili. Le prove locali restano accessibili; puoi riprovare.');
      } finally {
        if (timer) clearTimeout(timer);
      }
      if (!active) return;
      setReviews(loaded);
      setLoadedOwner(ownerKey);
      setLoading(false);
      // Names are optional in older local drafts; catalogue failures must not hide a draft.
      const enriched = await Promise.all(loaded.map(async review => {
        if (review.courseName) return review;
        try {
          const record = review.subjectType === 'professor' && review.professorId
            ? await fetchProfessorById(review.professorId, review.planYear || planYear)
            : review.courseId ? await fetchCourseById(review.courseId, review.planYear || planYear) : null;
          return record ? { ...review, courseName: record.name } : review;
        } catch { return review; }
      }));
      if (active) setReviews(current => applyReviewNames(current, enriched));
    }
    void load();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [loader, planYear, attempt, ownerKey, enabled]);
  return { reviews: enabled && loadedOwner === ownerKey ? reviews : [], setReviews, loading: loading || !enabled || loadedOwner !== ownerKey, error, reload: () => setAttempt(value => value + 1) };
}
