import SchoolSubjectResolver from '../components/SchoolSubjectResolver';
import SchoolProfessorDetail from './SchoolProfessorDetail';
import CommunityReviews from '../components/CommunityReviews';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import CatalogSource from '../components/CatalogSource';
import CatalogCourseGrid from '../components/CatalogCourseGrid';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { fetchProfessorById, fetchCoursesByProfessor, type Professor, type Course } from '../lib/dataService';
import { useCatalog, useCatalogData, catalogLink } from '../contexts/CatalogContext';

export default function ProfessorDetail() {
  const [params] = useSearchParams();
  return params.has('program') ? <SchoolProfessorDetail /> : <SchoolSubjectResolver subject="professor" fallback={<LegacyProfessorDetail />} />;
}

function LegacyProfessorDetail() {
  const { id = '' } = useParams();
  const { planYear } = useCatalog();
  const { data, loading, error, reload } = useCatalogData(async () => {
    const [professor, courses] = await Promise.all([fetchProfessorById(id, planYear), fetchCoursesByProfessor(id, planYear)]);
    return { professor, courses };
  }, [id, planYear], { professor: null as Professor | null, courses: [] as Course[] });
  const { professor, courses } = data;
  return <Layout><div className="flex flex-col gap-8 md:gap-12">
      <header>{!loading && !error && professor ? <><p className="text-sm text-text mb-3">{professor.department || 'Dipartimento non pubblicato'}</p><h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-ink text-pretty">{professor.name}</h1></> : <h1 className="text-3xl font-semibold">{!loading && !error ? 'Docente non trovato nel piano selezionato' : 'Dettagli del docente'}</h1>}</header>
      <PlanYearSelect />
      {loading ? <CatalogLoading /> : error ? <CatalogError message={error} retry={reload} /> : !professor ?
      <Link className="self-start underline" to={catalogLink('/professors', planYear)}>Torna ai docenti</Link> : <>
      {professor.bio && <p className="max-w-3xl text-text leading-relaxed whitespace-pre-line">{professor.bio}</p>}
      <dl className="flex flex-col gap-3 text-sm text-text">
        {professor.email && <div><dt className="font-semibold text-ink">Email istituzionale</dt><dd className="mt-1 break-words"><a className="underline underline-offset-4" href={`mailto:${professor.email}`}>{professor.email}</a></dd></div>}
        {professor.office && <div><dt className="font-semibold text-ink">Sede / ricevimento</dt><dd className="mt-1 whitespace-pre-line">{professor.office}</dd></div>}
      </dl>
      <CatalogSource record={professor} yearLabel="Piano · anno di ingresso" />
      <section><h2 className="text-2xl font-semibold text-ink mb-3">Attività nel piano {planYear}</h2><p className="text-sm text-text mb-5">Associazioni verificate per l’anno di svolgimento di ciascuna attività.</p>{courses.length ? <CatalogCourseGrid courses={courses} /> : <p className="text-text">Nessuna attività associata nel piano selezionato.</p>}</section>
      <CommunityReviews key={professor.id} subject="professor" subjectId={professor.id} />
      </>}
    </div></Layout>;
}
