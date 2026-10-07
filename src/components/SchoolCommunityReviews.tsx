import { Link } from 'react-router-dom';
import CommunityReviews from './CommunityReviews';
import { schoolReviewSubject } from '../lib/schoolReviewSubject';
import { useSchoolData } from '../lib/useSchoolData';
import { schoolLink } from '../lib/schoolLinks';
import type { SchoolContext } from '../lib/schoolCatalogTypes';
import type { ReviewSubject } from '../lib/reviewsApi';

export default function SchoolCommunityReviews({ subject, subjectId, schoolContext, profileYear }: {
  subject: ReviewSubject; subjectId: string; schoolContext: SchoolContext; profileYear?: number;
}) {
  const identity = useSchoolData(`community:${subject}:${subjectId}`, () => schoolReviewSubject.cloudId(subject, subjectId));
  if (identity.data) return <CommunityReviews subject={subject} subjectId={identity.data} routeSubjectId={subjectId} schoolContext={schoolContext} profileYear={profileYear} />;
  return <section className="space-y-4 rounded-xl border border-outline-variant p-5" aria-label="Recensioni della comunità">
    <h2 className="text-2xl font-semibold">Valutazioni degli studenti</h2>
    {identity.loading ? <p role="status" className="text-sm text-text">Verifica delle recensioni…</p> : <>
      <p className="text-sm text-text">{identity.error}</p>
      <div className="flex flex-wrap gap-4"><button type="button" onClick={identity.reload} className="min-h-11 text-sm underline">Riprova</button>
        <Link className="inline-flex min-h-11 items-center text-sm underline" to={schoolLink(`/${subject === 'course' ? 'courses' : 'professors'}/${subjectId}/review`, schoolContext, { profileYear })}>Prepara una bozza locale</Link></div>
    </>}
  </section>;
}
