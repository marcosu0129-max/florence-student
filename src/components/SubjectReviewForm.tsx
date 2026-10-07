import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ReviewForm, { type RatingField } from './ReviewForm';
import { createReview, createProfessorReview, fetchDemoReviews, type Review } from '../lib/dataService';
import { readReviewCursorPage, type ReviewCursor, type ReviewSubject } from '../lib/reviewsApi';
import { useStudentProfile } from '../lib/useStudentProfile';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { readReviewComposer, saveReviewComposer } from '../lib/reviewComposer';
import { canonicalCourseKey } from '../lib/catalog';
import { schoolReviewSubject } from '../lib/schoolReviewSubject';
import { createReturnState, returnNavigationState } from '../lib/navigation';

export default function SubjectReviewForm({ subject, subjectId, name, professorId, fields, disabled, backTo, school = false }: { subject: ReviewSubject; subjectId: string; name: string; professorId?: string; fields: RatingField[]; disabled: boolean; backTo: string; school?: boolean }) {
  const account = useStudentProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reviewId = params.get('review');
  const draftId = params.get('draft');
  const composerId = params.get('composer');
  const { planYear } = useCatalog();
  const [loaded, setLoaded] = useState<{ key: string; review: Review | null } | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const key = `${subject}:${subjectId}:${planYear}:${reviewId}:${draftId}:${composerId}:${account.session?.user.id || 'guest'}`;
  useEffect(() => {
    if (account.checking) return;
    let active = true;
    setLoaded(null); setError('');
    async function load() {
      if (reviewId && draftId) throw new Error('Il collegamento contiene due recensioni. Riaprilo dalle tue recensioni.');
      if (!reviewId && !draftId) return null;
      let review: Review | undefined;
      if (draftId) review = fetchDemoReviews().find(row => row.id === draftId && row.subjectType === subject);
      else {
        if (!account.session) throw new Error('Accedi con l’account autore per modificare la recensione.');
        let cursor: ReviewCursor | null = null;
        do {
          const cloudId = school ? await schoolReviewSubject.cloudId(subject, subjectId) : subjectId;
          const page = await readReviewCursorPage({ subjectType: subject, subjectId: cloudId, mine: true, cursor });
          review = page.items.find(row => row.id === reviewId);
          cursor = page.nextCursor;
        } while (!review && cursor);
      }
      const reviewSubjectId = subject === 'course' ? review?.courseId : review?.professorId;
      const matches = review?.subjectType === subject && Boolean(reviewSubjectId) && (school
        ? await schoolReviewSubject.matches(subject, reviewSubjectId!, subjectId)
        : subject === 'course' ? canonicalCourseKey(reviewSubjectId!) === canonicalCourseKey(subjectId) : reviewSubjectId === subjectId);
      if (!review || !matches || (review.planYear && review.planYear !== planYear)) throw new Error('Recensione non disponibile per questo account, soggetto o piano. Riaprila dalle tue recensioni.');
      return review;
    }
    load().then(review => { if (active) setLoaded({ key, review }); }).catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [key, account.checking, revision]);
  const loginTo = catalogLink(`/login?next=${encodeURIComponent(location.pathname + location.search)}`, planYear);
  if (error || account.error) return <div role="alert" className="space-y-4 rounded-xl border border-outline-variant p-5"><p className="text-sm text-error">{error || account.error}</p><button type="button" onClick={() => { account.retry(); setRevision(value => value + 1); }} className="min-h-11 rounded-full border border-outline-variant px-5 text-sm font-semibold">Riprova</button>{!account.session && <Link to={loginTo} className="ml-4 inline-flex min-h-11 items-center text-sm font-semibold underline">Accedi per modificare</Link>}</div>;
  if (!account.ready || loaded?.key !== key) return <p role="status" className="py-8 text-sm text-text">Preparazione recensione…</p>;
  const review = loaded.review;
  const carried = composerId ? readReviewComposer(composerId, subject, subjectId, planYear) : null;
  if (composerId && !carried) return <p role="alert" className="text-sm text-error">Il testo conservato non è disponibile in questo browser. Torna al dispositivo usato per iniziare la recensione.</p>;
  const initial = carried || { content: review?.content || '', isAnonymous: review?.isAnonymous ?? account.preferences.anonymousReviews,
    ratings: subject === 'course' ? { difficulty: review?.ratingDifficulty || 0, teaching: review?.ratingTeaching || 0, grading: review?.grade || 0 } : { clarity: review?.chiarezzaScore || 0, availability: review?.disponibilitaScore || 0, fairness: review?.equitaScore || 0 } };
  return <ReviewForm key={key} fields={fields} initial={initial} cloudAvailable={account.cloud} editing={Boolean(reviewId)} disabled={disabled} backTo={backTo} savedTo={catalogLink('/my-reviews', planYear)} loginTo={loginTo} onLogin={values => {
    const carryId = saveReviewComposer({ ...values, subject, subjectId, planYear });
    const nextParams = new URLSearchParams(location.search); nextParams.set('composer', carryId);
    const returnTo = `${location.pathname}?${nextParams.toString()}`;
    const loginState = createReturnState(returnTo, location.state);
    navigate(returnTo, { replace: true, state: returnNavigationState(loginState) });
    navigate(catalogLink(`/login?next=${encodeURIComponent(returnTo)}`, planYear), { state: loginState });
  }} onSubmit={async ({ ratings, content, isAnonymous, storage }) => {
    const targetId = school && storage === 'cloud' ? await schoolReviewSubject.cloudId(subject, subjectId) : subjectId;
    const common = { expectedUserId: account.session?.user.id, content, isAnonymous, storage, planYear, reviewId: reviewId || undefined, draftId: storage === 'local' ? draftId || undefined : undefined };
    return subject === 'course' ? createReview({ ...common, courseId: targetId, courseName: name, professorId, difficultyScore: ratings.difficulty, teachingScore: ratings.teaching, gradingScore: ratings.grading, tip: review?.tip }) : createProfessorReview({ ...common, professorId: targetId, professorName: name, chiarezzaScore: ratings.clarity, disponibilitaScore: ratings.availability, equitaScore: ratings.fairness });
  }} />;
}
