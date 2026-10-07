import { createReturnState } from '../lib/navigation';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import AccordionItem from '../components/AccordionItem';
import SchoolCommunityReviews from '../components/SchoolCommunityReviews';
import { CatalogError, CatalogLoading, PlanYearSelect } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog, type SchoolOfferingDetail } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { useSavedCourses } from '../lib/useSavedCourses';
import { offeringLink, officialLink, schoolLink } from '../lib/schoolLinks';
import { earliestSourceDate } from '../lib/catalogProvenance';

const syllabusLabels: Record<string, string> = { lingua: 'Lingua di insegnamento', ssd: 'Settore scientifico disciplinare', frequenza: 'Frequenza', durata: 'Durata', obiettivi_formativi: 'Obiettivi formativi', contenuti: 'Contenuti', prerequisiti: 'Prerequisiti', metodi_didattici: 'Metodi didattici', verifica_apprendimento: 'Verifica dell’apprendimento', programma_esteso: 'Programma esteso', testi: 'Testi di riferimento', agenda_2030: 'Agenda 2030', altro: 'Altre informazioni', exam_type: 'Tipo di esame', assessment_type: 'Valutazione', teaching_method_code: 'Modalità didattica' };
function OfficialSyllabus({ values }: { values: Record<string, string | null> }) {
  return <div className="flex flex-col gap-3">{Object.entries(syllabusLabels).map(([field, title]) => <AccordionItem key={field} title={title}><p>{values[field] || 'Non pubblicato dalla fonte ufficiale per questo anno di insegnamento.'}</p></AccordionItem>)}</div>;
}

export default function SchoolCourseDetail() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const { planYear } = useCatalog();
  const context = { programKey: params.get('program') || 'B385', cohortYear: Number(planYear.slice(0, 4)), curriculumCode: params.get('curriculum') || undefined, academicYearStart: params.has('academicYear') ? Number(params.get('academicYear')) : undefined };
  const offeringId = params.get('offering');
  const state = useSchoolData(`course:${id}:${JSON.stringify(context)}:${offeringId}`, async retry => {
    const cohort = await schoolCatalog.cohort(context, { retry });
    const resolved = await schoolCatalog.resolveCourseRoute(id, context);
    const offering = offeringId ? resolved?.offerings.find(item => item.id === offeringId) : resolved?.offerings.length === 1 ? resolved.offerings[0] : null;
    const detail: SchoolOfferingDetail | null = offering ? await schoolCatalog.offeringDetail(offering.id, context, { retry }) : null;
    return { cohort, resolved, offering, detail };
  });
  const saved = useSavedCourses();
  const { cohort, resolved, offering, detail } = state.data || {};
  const source = officialLink(offering?.official_url);
  const observedAt = cohort && offering ? earliestSourceDate(cohort.sources, offering.source_urls) : null;
  const selectedContext = offering ? { ...context, curriculumCode: offering.curriculum_code, academicYearStart: offering.academic_year_start } : context;
  return <Layout catalogNotice={false} backTo={schoolLink('/courses', context)}><div className="flex flex-col gap-7">
    <header><p className="text-sm text-text mb-3">{cohort?.program.name || 'Insegnamento'}{offering ? ` · ${offering.official_code}` : ''}</p><h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-ink text-pretty">{offering?.name || resolved?.course.name || 'Dettagli dell’insegnamento'}</h1></header>
    <PlanYearSelect />
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !resolved ? <div className="space-y-4"><p className="text-text">Questo insegnamento non è presente nel piano selezionato.</p><Link to={schoolLink('/courses', context)} className="underline">Torna agli insegnamenti</Link></div> : !offering ? <section className="space-y-4"><h2 className="text-xl font-semibold">Scegli la versione dell’insegnamento</h2><p className="text-sm text-text">Seleziona il percorso e l’anno per consultare i docenti e il programma corretti.</p>{offeringId && <p role="alert" className="text-sm text-error">La versione indicata nel collegamento non appartiene a questo piano.</p>}<ul className="space-y-3">{resolved.offerings.map(item => <li key={item.id}><Link state={location.state} to={offeringLink(item)} className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-outline-variant p-4"><span>{item.curriculum_name || item.curriculum_code} · {item.academic_year} · {item.credits ?? '—'} CFU</span><Icon name="chevron_right" size={20} /></Link></li>)}</ul>{!resolved.offerings.length && <Link to={schoolLink('/courses', { programKey: context.programKey, cohortYear: context.cohortYear })} className="underline">Torna al piano senza filtri</Link>}</section> : <>
      <div className="flex flex-wrap gap-2 text-sm text-text">{[`${offering.credits ?? '—'} CFU`, `${offering.year_level}° anno`, `Insegnamento ${offering.academic_year}`, offering.semester || 'Periodo non pubblicato', offering.curriculum_name || offering.curriculum_code].map((text, index) => <span key={index} className="rounded-full border border-outline-variant px-3 py-2">{text}</span>)}</div>
      <div className="flex flex-wrap gap-3"><button type="button" aria-pressed={saved.isSaved(offering.course_id)} disabled={saved.unavailable || saved.isPending(offering.course_id)} onClick={() => saved.toggle(offering.course_id)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant px-5 text-sm disabled:opacity-50"><Icon name="bookmark" filled={saved.isSaved(offering.course_id)} />{saved.isPending(offering.course_id) ? 'Salvataggio…' : saved.isSaved(offering.course_id) ? 'Salvato' : 'Salva corso'}</button><Link state={returnState} to={schoolLink('/materials', selectedContext, { course: offering.course_id })} className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 text-sm">Materiali del corso</Link></div>
      {saved.error && <CatalogError message={saved.error} retry={saved.retry} />}
      <aside className="rounded-xl border border-outline-variant bg-card-base p-5 text-sm text-text leading-relaxed"><p>Piano di ingresso {planYear} · scheda per l’anno di insegnamento {offering.academic_year}.</p>{offering.status !== 'published' && <p className="mt-2">{offering.status === 'plan-only' ? 'Attività presente nel piano. La scheda didattica dettagliata non è ancora disponibile nelle fonti verificate.' : 'Attività prevista per un anno successivo. Le informazioni non ancora pubblicate restano indicate come mancanti.'}</p>}{source && <a className="inline-flex min-h-11 items-center gap-2 mt-2 underline" href={source} target="_blank" rel="noopener noreferrer">Scheda ufficiale UNIFI<Icon name="open_in_new" size={16} /><span className="sr-only"> (nuova scheda)</span></a>}<p className="mt-2 text-xs">{observedAt ? <>Fonti acquisite dal <time dateTime={observedAt}>{new Date(observedAt).toLocaleDateString('it-IT')}</time>. Le singole fonti possono avere date di acquisizione successive.</> : 'Data di acquisizione delle fonti non disponibile.'}</p></aside>
      <section className="space-y-3"><h2 className="text-2xl font-semibold">Docenti</h2>{offering.assignments.length ? <ul className="space-y-2">{offering.assignments.map((assignment, index) => { const profile = cohort!.professor_profiles.find(item => item.id === assignment.professor_id && item.profile_year === assignment.profile_year); return <li key={`${assignment.professor_id}:${assignment.profile_year}:${index}`}><Link className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" to={schoolLink(`/professors/${assignment.professor_id}`, selectedContext, { profileYear: assignment.profile_year })} state={returnState}>{profile?.name || 'Scheda docente'} · {assignment.profile_year}/{assignment.profile_year + 1}{assignment.section_code ? ` · ${assignment.section_code}` : ''}</Link></li>; })}</ul> : <p className="text-sm text-text">Docente non pubblicato per questo anno di insegnamento.</p>}</section>
      <Link state={returnState} className="self-start min-h-11 text-sm underline underline-offset-4" to={schoolLink(`/programs/${context.programKey}`, { programKey: context.programKey, cohortYear: context.cohortYear })}>Consulta le regole nel piano completo</Link>
      {detail && <section className="space-y-5 max-w-4xl"><h2 className="text-2xl font-semibold">Informazioni ufficiali</h2><OfficialSyllabus values={detail.syllabus} />
        {detail.syllabus_sections.length > 1 && <div className="space-y-3"><h3 className="text-xl font-semibold">Programmi delle unità didattiche</h3>{detail.syllabus_sections.map((section, index) => <AccordionItem key={index} title={`Programma ${index + 1}${section.teaching_unit_code ? ` · ${section.teaching_unit_code}` : ''}`}><OfficialSyllabus values={section} /></AccordionItem>)}</div>}
        {(['modules','sections'] as const).map(kind => detail[kind].length > 0 && <section key={kind} className="space-y-3"><h3 className="text-xl font-semibold">{kind === 'modules' ? 'Moduli dell’insegnamento' : 'Sezioni di insegnamento'}</h3><p className="text-sm text-text">{kind === 'modules' ? 'I crediti dei moduli fanno parte dell’insegnamento e non vanno aggiunti una seconda volta.' : 'Le sezioni possono dipendere dall’assegnazione prevista dal corso; non rappresentano una libera scelta del docente.'}</p><ul className="space-y-3">{detail[kind].map((part,index) => <li key={`${part.code}:${index}`} className="rounded-xl border border-outline-variant p-4 text-sm"><p className="font-semibold">{part.name}</p><p className="mt-2 text-text">{part.module_code ? `Modulo ${part.module_code} · ` : ''}{part.code} · {part.credits ?? '—'} CFU{part.semester ? ` · ${part.semester}` : ''}</p>{part.professor_ids.map(professorId => { const profile = detail.professor_profiles.find(item => item.id === professorId && item.profile_year === part.profile_year); return profile ? <Link state={returnState} key={professorId} className="inline-flex min-h-11 items-center underline mr-4" to={schoolLink(`/professors/${professorId}`, selectedContext, { profileYear: part.profile_year })}>{profile.name}</Link> : <p key={professorId} className="mt-2 text-text">Scheda docente non disponibile per questo anno.</p>; })}</li>)}</ul></section>)}
      </section>}
      <SchoolCommunityReviews subject="course" subjectId={offering.course_id} schoolContext={selectedContext} />
    </>}
  </div></Layout>;
}
