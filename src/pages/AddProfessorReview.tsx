import SchoolSubjectResolver from '../components/SchoolSubjectResolver';
import SchoolSubjectReview from '../components/SchoolSubjectReview';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SubjectReviewForm from '../components/SubjectReviewForm';
import { CatalogError, CatalogLoading, PlanYearSelect } from '../components/CatalogNotice';
import { fetchProfessorById, type Professor } from '../lib/dataService';
import { catalogLink, useCatalog, useCatalogData } from '../contexts/CatalogContext';

const ratingFields = [
  { key: 'clarity', label: 'Chiarezza', icon: 'lightbulb', descriptions: ['Molto scarsa', 'Scarsa', 'Discreta', 'Buona', 'Ottima'] },
  { key: 'availability', label: 'Disponibilità', icon: 'support_agent', descriptions: ['Molto scarsa', 'Scarsa', 'Discreta', 'Buona', 'Ottima'] },
  { key: 'fairness', label: 'Equità', icon: 'balance', descriptions: ['Molto scarsa', 'Scarsa', 'Discreta', 'Buona', 'Ottima'] },
];

export default function AddProfessorReview() {
  const [params] = useSearchParams();
  return params.has('program') ? <SchoolSubjectReview subject="professor" fields={ratingFields} /> : <SchoolSubjectResolver subject="professor" fallback={<LegacyAddProfessorReview />} />;
}

function LegacyAddProfessorReview() {
  const { id = '' } = useParams<{ id: string }>();
  const { planYear } = useCatalog();
  const { data: professor, loading, error, reload } = useCatalogData(() => fetchProfessorById(id, planYear), [id, planYear], null as Professor | null);
  const backTo = catalogLink(`/professors/${professor?.id || id}`, planYear);

  return <Layout showBack backTo={backTo}>
    <div className="mx-auto w-full max-w-xl">
      {loading && (!professor || professor.academicYear !== planYear) ? <CatalogLoading /> : error && !professor ? <CatalogError message={error} retry={reload} /> : !professor ? <section className="space-y-5 py-10">
        <h1 className="text-3xl font-semibold text-ink text-balance">Docente non disponibile</h1>
        <p className="text-sm leading-relaxed text-text text-pretty">Questo docente non è presente nel piano selezionato. Scegli un altro anno o torna all’elenco.</p>
        <PlanYearSelect /><Link to={catalogLink('/professors', planYear)} className="inline-block underline underline-offset-4">Torna ai docenti</Link>
      </section> : <>
        <header className="mb-7"><p className="mb-2 text-sm text-text">Piano {planYear}</p><h1 className="text-3xl font-semibold leading-tight text-ink text-balance sm:text-4xl">La tua valutazione</h1><p className="mt-3 text-base leading-relaxed text-text text-pretty">{professor.name}</p></header>
        {error && <div className="mb-6"><CatalogError message={error} retry={reload} /></div>}
        <SubjectReviewForm subject="professor" subjectId={professor.id} name={professor.name} disabled={loading || Boolean(error)} fields={ratingFields} backTo={backTo} />
      </>}
    </div>
  </Layout>;
}
