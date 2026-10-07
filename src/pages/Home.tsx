import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { createReturnState } from '../lib/navigation';
import Icon from '../components/Icon';
import Layout from '../components/Layout';
import FilterSelect from '../components/FilterSelect';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { degreeLabels, schoolLink } from '../lib/schoolLinks';

export default function Home() {
  const { planYear } = useCatalog();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const { data: index, loading, error, reload } = useSchoolData('school-index', retry => schoolCatalog.index({ retry }));
  const query = params.get('q') || '';
  const level = params.get('level') || '';
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.set('year', planYear);
    setParams(next, { replace: true, state: location.state });
  };
  const clear = () => {
    const next = new URLSearchParams(params);
    next.delete('q'); next.delete('level');
    setParams(next, { replace: true, state: location.state });
  };
  const cohortYear = Number(planYear.slice(0, 4));
  const programs = useMemo(() => index?.programs.filter(program => {
    const q = query.trim().toLocaleLowerCase('it');
    return (!level || program.degree_level === level) && (!q || [program.name, program.program_key, ...program.degree_classes].join(' ').toLocaleLowerCase('it').includes(q));
  }) || [], [index, query, level]);
  return <Layout catalogNotice={false}><div className="flex flex-col gap-8 sm:gap-10">
    <section className="flex flex-col items-center text-center py-6 md:py-12 gap-4">
      <p className="text-sm text-text">Università degli Studi di Firenze</p>
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-ink leading-tight uppercase text-balance">Trova il tuo percorso</h1>
      <p className="max-w-xl text-sm sm:text-base text-text text-pretty">Corsi di laurea della Scuola di Studi Umanistici e della Formazione. Esplora i piani di studi, gli insegnamenti e i docenti.</p>
      <div className="w-full max-w-xl mt-2">
        <label htmlFor="program-search" className="sr-only">Cerca un corso di laurea, codice o classe</label>
        <div className="program-search-field flex items-center gap-3 rounded-full border border-outline-variant bg-canvas px-4 sm:px-5">
          <Icon name="search" size={20} className="text-text" />
          <input id="program-search" type="search" value={query} onChange={event => change('q', event.target.value)} placeholder="Cerca un corso di laurea…" className="min-w-0 flex-1 bg-transparent py-4 text-base text-ink outline-none" />
        </div>
      </div>
      <Link state={returnState} to={catalogLink(`/search?q=${encodeURIComponent(query)}`,planYear)} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Cerca insegnamenti e docenti in tutta la scuola</Link>
    </section>
    <Link state={returnState} to={`/other-programs?edition=${cohortYear}`} className="flex items-center gap-4 rounded-xl border border-outline-variant bg-card-base p-5 hover:bg-surface-container"><div className="min-w-0 flex-1"><h2 className="font-semibold text-balance">Master, dottorati e altri percorsi</h2><p className="text-sm text-text mt-2 text-pretty">Esplora formazione post-laurea, abilitazione all’insegnamento e directory storica, con fonti e disponibilità distinte per anno.</p></div><Icon name="chevron_right" size={20} className="shrink-0 text-text" /></Link>
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <PlanYearSelect />
      <div className="w-full sm:max-w-xs"><FilterSelect label="Tipo di laurea" value={level} onValueChange={value => change('level', value)} options={[{ value: '', label: 'Tutti i corsi di laurea' }, ...Object.entries(degreeLabels).map(([value, label]) => ({ value, label }))]} /></div>
    </div>
    {loading ? <CatalogLoading /> : error ? <CatalogError message={error} retry={reload} /> : <section aria-label="Corsi di laurea">
      <div className="flex items-center justify-between gap-4 mb-4"><h2 className="text-lg font-semibold text-ink">Corsi di laurea</h2><p role="status" className="text-sm text-text tabular-nums">{programs.length} {programs.length === 1 ? 'risultato' : 'risultati'}</p></div>
      {!programs.length ? <div className="rounded-xl bg-card-base border border-outline-variant p-6"><p className="text-text">Nessun corso di laurea corrisponde alla ricerca.</p><button className="mt-4 min-h-11 underline text-ink" onClick={clear}>Azzera filtri</button></div>
        : <div className="grid gap-4 md:grid-cols-2">{programs.map(program => {
          const reference = program.cohorts.find(cohort => cohort.cohort_year === cohortYear);
          return <Link state={returnState} key={program.program_key} to={schoolLink(`/programs/${program.program_key}`, { programKey: program.program_key, cohortYear })} className="group flex items-center gap-4 rounded-xl border border-outline-variant bg-card-base p-5 hover:bg-surface-container transition-colors duration-150">
            <span className="flex-1 min-w-0"><span className="block text-xs text-text mb-2">{degreeLabels[program.degree_level]} · {program.degree_classes.join(' / ')}</span>
              <span className="block text-base font-semibold text-ink text-pretty">{program.name}</span>
              <span className="block mt-3 text-xs text-text tabular-nums">{program.duration_years} anni · {program.total_credits} CFU · {program.program_key}</span>
              <span className="block mt-1 text-xs text-text">{reference ? `Piano ${reference.plan_year}` : 'Piano per questo anno non disponibile'}</span>
            </span><Icon name="chevron_right" size={20} className="text-text" />
          </Link>;
        })}</div>}
      {index && <p className="mt-6 text-xs text-text leading-relaxed">Fonti ufficiali UNIFI · dati acquisiti il {new Date(index.generated_at).toLocaleDateString('it-IT')}. Le pagine dei singoli piani indicano le informazioni mancanti e le eventuali discrepanze tra fonti.</p>}
    </section>}
  </div></Layout>;
}
