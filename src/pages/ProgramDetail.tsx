import { createReturnState } from '../lib/navigation';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import FilterSelect from '../components/FilterSelect';
import SchoolPlan, { SchoolCoverageNotice } from '../components/SchoolPlan';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { degreeLabels, officialLink, schoolLink } from '../lib/schoolLinks';

export default function ProgramDetail() {
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const { code = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { planYear } = useCatalog();
  const cohortYear = Number(planYear.slice(0, 4));
  const context = { programKey: code, cohortYear };
  const { data: cohort, loading, error, reload } = useSchoolData(`plan:${code}:${cohortYear}`, retry => schoolCatalog.cohort(context, { retry }));
  const curriculum = params.get('curriculum') || '';
  const program = cohort?.program;
  const titleSize = (program?.name.length || 0) > 100 ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-3xl sm:text-4xl lg:text-5xl';
  const curriculumCodes = cohort ? [...new Set(cohort.requirements.map(rule => rule.curriculum_code))] : [];
  const official = officialLink(program?.official_website || program?.official_url);
  return <Layout catalogNotice={false}><div className="flex flex-col gap-8">
    <header>
      <p className="text-sm text-text mb-3">{program ? `${degreeLabels[program.degree_level]} · ${program.degree_classes.join(' / ')}` : 'Corso di laurea'}</p>
      <h1 className={`${titleSize} font-semibold leading-tight text-ink text-pretty`}>{program?.name || 'Piano di studi'}</h1>
      {program && <p className="mt-4 text-text leading-relaxed">{program.faculty}</p>}
      <div className="mt-6"><PlanYearSelect /></div>
    </header>
    {loading ? <CatalogLoading /> : error ? <CatalogError message={error} retry={reload} /> : cohort && program && <>
      <section aria-label="Sintesi del piano" className="rounded-xl border border-outline-variant bg-card-base p-5 sm:p-6">
        <dl className="grid grid-cols-3 gap-3 sm:gap-6">
          <div><dt className="text-xs sm:text-sm text-text">Durata</dt><dd className="text-2xl sm:text-4xl font-semibold tabular-nums mt-2">{program.duration_years} <span className="text-sm font-normal">anni</span></dd></div>
          <div><dt className="text-xs sm:text-sm text-text">CFU richiesti</dt><dd className="text-2xl sm:text-4xl font-semibold tabular-nums mt-2">{program.total_credits}</dd></div>
          <div><dt className="text-xs sm:text-sm text-text">Insegnamenti</dt><dd className="text-2xl sm:text-4xl font-semibold tabular-nums mt-2">{cohort.counts.courses}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-text">Codice ufficiale del piano {cohort.plan_year}: {cohort.official_degree_code}</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link state={returnState} to={schoolLink('/courses', context)} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-canvas">Esplora gli insegnamenti</Link>{official && <a href={official} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Sito ufficiale<span className="sr-only"> (nuova scheda)</span></a>}</div>
      </section>
      <SchoolCoverageNotice cohort={cohort} />
      {curriculumCodes.length > 1 && <div className="max-w-xl"><FilterSelect label="Percorso nel piano" value={curriculum} onValueChange={value => { const next = new URLSearchParams(params); if (value) next.set('curriculum', value); else next.delete('curriculum'); setParams(next, { replace: true, state: location.state }); }} options={[{ value: '', label: 'Tutti i percorsi' }, ...curriculumCodes.map(value => ({ value, label: cohort.curricula.find(item => item.code === value)?.name || value }))]} /></div>}
      <SchoolPlan cohort={cohort} curriculumCode={curriculum} />
      <p className="text-xs text-text">Fonti verificate il {new Date(cohort.generated_at).toLocaleDateString('it-IT')}. Ogni gruppo rimanda alla relativa pagina del piano ufficiale.</p>
    </>}
  </div></Layout>;
}
