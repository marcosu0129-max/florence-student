import SchoolSubjectResolver from '../components/SchoolSubjectResolver';
import SchoolCourseDetail from './SchoolCourseDetail';
import CommunityReviews from '../components/CommunityReviews';
import { Link, useParams, useLocation, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import Layout from '../components/Layout';
import AccordionItem from '../components/AccordionItem';
import CatalogSource from '../components/CatalogSource';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { fetchCourseById, type Course } from '../lib/dataService';
import { useCatalog, useCatalogData, catalogLink } from '../contexts/CatalogContext';

import { useSavedCourses } from '../lib/useSavedCourses';

const syllabusFields: Array<[keyof Course, string]> = [
  ['lingua', 'Lingua di insegnamento'], ['ssd', 'Settore scientifico disciplinare'], ['frequenza', 'Frequenza'], ['durata', 'Durata'],
  ['obiettiviFormativi', 'Obiettivi formativi'], ['contenuti', 'Contenuti'], ['prerequisiti', 'Prerequisiti'],
  ['metodiDidattici', 'Metodi didattici'], ['verificaApprendimento', 'Verifica dell’apprendimento'],
  ['programmaEsteso', 'Programma esteso'], ['testi', 'Testi di riferimento'], ['obiettiviAgenda2030', 'Agenda 2030'], ['altro', 'Altre informazioni'],
];

export default function CourseDetail() {
  const [params] = useSearchParams();
  return params.has('program') ? <SchoolCourseDetail /> : <SchoolSubjectResolver subject="course" fallback={<LegacyCourseDetail />} />;
}

function LegacyCourseDetail() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { planYear } = useCatalog();
  const { data: course, loading, error, reload } = useCatalogData(() => fetchCourseById(id, planYear), [id, planYear], null as Course | null);
  const saved = useSavedCourses();
  const isSaved = saved.isSaved(course?.id || id);
  return <Layout><div className="flex flex-col gap-8 md:gap-12">
      <header>{!loading && !error && course ? <>
        <p className="mb-3 text-sm text-text">{course.programCode} · {course.officialCode}</p>
        <div className="flex items-start gap-3"><h1 className="min-w-0 flex-1 text-3xl sm:text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-ink text-pretty">{course.name}</h1><button type="button" aria-label={isSaved ? 'Rimuovi dai salvati' : 'Salva corso'} aria-pressed={isSaved} disabled={saved.unavailable || saved.isPending(course.id)} aria-busy={saved.isPending(course.id)} onClick={() => saved.toggle(course.id)} className="shrink-0 size-11 rounded-full border border-outline-variant flex items-center justify-center"><Icon name="bookmark" size={20} filled={isSaved} /></button></div>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-text">{[course.credits ? `${course.credits} CFU` : 'CFU non pubblicati', course.yearLevel ? `${course.yearLevel}° anno` : '', course.academicYear, course.semester || 'Semestre non pubblicato'].filter(Boolean).map(item => <span key={item} className="rounded-full border border-outline-variant bg-card-base px-3 py-1">{item}</span>)}</div>
        <div className="mt-5 flex flex-col gap-2 text-sm text-text">{course.professorNames?.length ? course.professorNames.map((name, index) => course.professorRealIds?.[index] ? <Link key={course.professorRealIds[index]} state={{ from: location.pathname + location.search }} to={catalogLink(`/professors/${course.professorRealIds[index]}`, planYear)} className="self-start font-semibold text-ink underline underline-offset-4">{name}</Link> : <span key={name}>{name}</span>) : <p>Docente non pubblicato per questo anno di attività.</p>}</div>
      </> : <h1 className="text-3xl font-semibold">{!loading && !error ? 'Corso non presente nel piano selezionato' : 'Dettagli del corso'}</h1>}</header>
      <PlanYearSelect />
      {saved.error && <CatalogError message={saved.error} retry={saved.retry} />}
      {loading ? <CatalogLoading /> : error ? <CatalogError message={error} retry={reload} /> : !course ?
      <Link className="self-start underline" to={catalogLink('/courses', planYear)}>Torna ai corsi</Link> : <>
      <CatalogSource record={course} />
      {course.offeringNotes.length > 0 && <aside aria-label="Stato delle informazioni" className="rounded-xl bg-card-base border border-border-card p-5 text-sm text-text leading-relaxed">{course.offeringNotes.map(note => <p key={note}>{note}</p>)}</aside>}
      <section><h2 className="text-2xl font-semibold text-ink mb-4">Nel piano di studi</h2><ul className="flex flex-col gap-3">{course.requirementGroups.map(group => <li key={group.id} className="rounded-xl border border-border-card p-4 text-sm text-text"><p className="font-semibold text-ink">{group.label}</p>{group.kind === 'choice' && group.credits != null && <p className="mt-2">Alternativa nel gruppo: scegli attività per un totale di {group.credits} CFU.</p>}</li>)}</ul><Link className="inline-block mt-5 underline underline-offset-4 text-sm font-semibold" to={catalogLink(`/programs/${course.programCode}`, planYear)}>Consulta il piano completo</Link></section>
      <section><h2 className="text-2xl font-semibold text-ink mb-5">Informazioni ufficiali</h2><div className="max-w-4xl flex flex-col gap-3">{syllabusFields.map(([field, title]) => <AccordionItem key={field} title={title}><p className="whitespace-pre-line break-words">{typeof course[field] === 'string' && course[field] ? String(course[field]) : 'Non pubblicato dalla fonte ufficiale per questo anno di attività.'}</p></AccordionItem>)}</div></section>
      <Link to={catalogLink(`/materials?course=${course.id}`, planYear)} className="self-start inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 text-sm font-semibold">Materiali del corso</Link>
      <CommunityReviews key={course.id} subject="course" subjectId={course.id} />
      </>}
    </div></Layout>;
}
