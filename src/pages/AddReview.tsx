import SchoolSubjectResolver from '../components/SchoolSubjectResolver';
import SchoolSubjectReview from '../components/SchoolSubjectReview';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SubjectReviewForm from '../components/SubjectReviewForm';
import { CatalogError, CatalogLoading, PlanYearSelect } from '../components/CatalogNotice';
import { fetchCourseById, type Course } from '../lib/dataService';
import { catalogLink, useCatalog, useCatalogData } from '../contexts/CatalogContext';

const ratingFields = [
  { key: 'difficulty', label: 'Difficoltà', icon: 'trending_up', descriptions: ['Molto facile', 'Facile', 'Media', 'Difficile', 'Molto difficile'] },
  { key: 'teaching', label: 'Didattica', icon: 'school', descriptions: ['Molto scarsa', 'Scarsa', 'Discreta', 'Buona', 'Ottima'] },
  { key: 'grading', label: 'Equità dei voti', icon: 'balance', descriptions: ['Molto scarsa', 'Scarsa', 'Discreta', 'Buona', 'Ottima'] },
];

export default function AddReview() {
  const [params] = useSearchParams();
  return params.has('program') ? <SchoolSubjectReview subject="course" fields={ratingFields} /> : <SchoolSubjectResolver subject="course" fallback={<LegacyAddReview />} />;
}

function LegacyAddReview() {
  const { id = '' } = useParams<{ id: string }>();
  const { planYear } = useCatalog();
  const { data: course, loading, error, reload } = useCatalogData(() => fetchCourseById(id, planYear), [id, planYear], null as Course | null);
  const backTo = catalogLink(`/courses/${course?.id || id}`, planYear);

  return <Layout showBack backTo={backTo}>
    <div className="mx-auto w-full max-w-xl">
      {loading && (!course || course.planYear !== planYear) ? <CatalogLoading /> : error && !course ? <CatalogError message={error} retry={reload} /> : !course ? <section className="space-y-5 py-10">
        <h1 className="text-3xl font-semibold text-ink text-balance">Corso non disponibile</h1>
        <p className="text-sm leading-relaxed text-text text-pretty">Questo corso non è presente nel piano selezionato. Scegli un altro anno o torna al catalogo.</p>
        <PlanYearSelect /><Link to={catalogLink('/courses', planYear)} className="inline-block underline underline-offset-4">Torna ai corsi</Link>
      </section> : <>
        <header className="mb-7"><p className="mb-2 text-sm text-text">Piano {planYear} · {course.officialCode}</p><h1 className="text-3xl font-semibold leading-tight text-ink text-balance sm:text-4xl">La tua recensione</h1><p className="mt-3 text-base leading-relaxed text-text text-pretty">{course.name}</p></header>
        {error && <div className="mb-6"><CatalogError message={error} retry={reload} /></div>}
        <SubjectReviewForm subject="course" subjectId={course.id} name={course.name} professorId={course.professorRealIds?.length === 1 ? course.professorRealIds[0] : undefined} disabled={loading || Boolean(error)} fields={ratingFields} backTo={backTo} />
      </>}
    </div>
  </Layout>;
}
