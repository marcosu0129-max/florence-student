import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import SubjectReviewForm from './SubjectReviewForm';
import { CatalogError, CatalogLoading, PlanYearSelect } from './CatalogNotice';
import type { RatingField } from './ReviewForm';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { schoolLink } from '../lib/schoolLinks';
import { useSchoolData } from '../lib/useSchoolData';

export default function SchoolSubjectReview({ subject, fields }: { subject: 'course' | 'professor'; fields: RatingField[] }) {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { planYear } = useCatalog();
  const context = { programKey: params.get('program') || 'B385', cohortYear: Number(planYear.slice(0,4)), curriculumCode: params.get('curriculum') || undefined, academicYearStart: params.has('academicYear') ? Number(params.get('academicYear')) : undefined };
  const profileYear = params.has('profileYear') ? Number(params.get('profileYear')) : null;
  const state = useSchoolData(`review-subject:${subject}:${id}:${JSON.stringify(context)}:${profileYear}`, async retry => {
    if (subject === 'course') {
      const resolved = await schoolCatalog.resolveCourseRoute(id, context, { retry });
      if (!resolved) return null;
      return { id: resolved.course.id, name: resolved.course.name };
    }
    const cohort = await schoolCatalog.cohort(context, { retry });
    const canonical = cohort.aliases.professors[id] || id;
    const profiles = cohort.professor_profiles.filter(profile => profile.id === canonical || profile.official_id === canonical);
    const profile = profileYear !== null ? profiles.find(item => item.profile_year === profileYear) : profiles.length === 1 ? profiles[0] : null;
    return profile ? { id: profile.id, name: profile.name } : null;
  });
  const backTo = schoolLink(`/${subject === 'course' ? 'courses' : 'professors'}/${id}`, context, { profileYear: profileYear ?? undefined });
  return <Layout showBack catalogNotice={false} backTo={backTo}><div className="mx-auto w-full max-w-xl">
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !state.data ? <section className="space-y-5"><h1 className="text-3xl font-semibold text-balance">Scheda non disponibile</h1><p className="text-sm text-text">Riapri la scheda nel piano e nell’anno corretti per scrivere la tua valutazione.</p><PlanYearSelect /><Link className="inline-flex min-h-11 items-center underline" to={backTo}>Torna alla scheda</Link></section> : <>
      <header className="mb-7"><p className="text-sm text-text mb-2">Piano {planYear}</p><h1 className="text-3xl sm:text-4xl font-semibold text-balance">{subject === 'course' ? 'La tua recensione' : 'La tua valutazione'}</h1><p className="mt-3 text-base text-text text-pretty">{state.data.name}</p></header>
      <SubjectReviewForm school subject={subject} subjectId={state.data.id} name={state.data.name} fields={fields} disabled={false} backTo={backTo} />
    </>}
  </div></Layout>;
}
