import { createReturnState } from '../lib/navigation';
import { useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import FilterSelect from '../components/FilterSelect';
import SchoolOfferingCard from '../components/SchoolOfferingCard';
import SearchBar from '../components/SearchBar';
import { PlanYearSelect, CatalogLoading, CatalogError } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { useSavedCourses } from '../lib/useSavedCourses';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { useSchoolCourseStats } from '../lib/useSchoolCourseStats';
import { schoolLink } from '../lib/schoolLinks';

export default function Courses() {
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const [params, setParams] = useSearchParams();
  const { planYear, programKey: selectedProgram } = useCatalog();
  const programKey = params.get('program') || selectedProgram || 'B385';
  const cohortYear = Number(planYear.slice(0, 4));
  const context = { programKey, cohortYear };
  const index = useSchoolData('school-index', retry => schoolCatalog.index({ retry }));
  const plan = useSchoolData(`courses:${programKey}:${cohortYear}`, retry => schoolCatalog.cohort(context, { retry }));
  const saved = useSavedCourses();
  const courseStats = useSchoolCourseStats(plan.data?.offerings);
  const query = params.get('q') || '';
  const curriculum = params.get('curriculum') || '';
  const level = params.get('level') || '';
  const semester = params.get('semester') || '';
  const requirement = params.get('requirement') || '';
  const teachingYear = params.get('academicYear') || '';
  const change = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); next.set('year', planYear); if (key === 'program') ['curriculum','level','semester','requirement','academicYear'].forEach(filter => next.delete(filter)); setParams(next, { replace: true, state: location.state }); };
  const filtered = useMemo(() => plan.data?.offerings.filter(offering => {
    const q = query.trim().toLocaleLowerCase('it');
    const names = offering.assignments.map(assignment => plan.data!.professor_profiles.find(profile => profile.id === assignment.professor_id && profile.profile_year === assignment.profile_year)?.name || '');
    const text = [offering.name, offering.official_code, ...names].join(' ').toLocaleLowerCase('it');
    return (!q || text.includes(q)) && (!curriculum || offering.curriculum_code === curriculum) && (!level || String(offering.year_level) === level) && (!semester || offering.semester === semester) && (!teachingYear || String(offering.academic_year_start) === teachingYear) && (!requirement || (requirement === 'required' ? offering.is_required === true : requirement === 'choice' ? offering.is_required === false : offering.is_required === null));
  }) || [], [plan.data, query, curriculum, level, semester, requirement, teachingYear]);
  const semesters = [...new Set(plan.data?.offerings.map(item => item.semester).filter((value): value is string => Boolean(value)))];
  const levels = [...new Set(plan.data?.offerings.map(item => item.year_level))].sort((a, b) => a - b);
  const clear = () => setParams({ program: programKey, year: planYear }, { replace: true, state: location.state });
  return <Layout catalogNotice={false}><div className="flex flex-col gap-6">
    <header><h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight text-balance">Insegnamenti</h1><p className="mt-3 text-sm text-text text-pretty">{plan.data?.program.name || 'Esplora gli insegnamenti della scuola'}</p></header>
    <PlanYearSelect />
    <Link state={returnState} to={`/search?year=${encodeURIComponent(planYear)}`} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Cerca in tutta la scuola</Link>
    {index.error ? <CatalogError message={index.error} retry={index.reload} /> : <div className="max-w-2xl"><FilterSelect label="Corso di laurea" value={index.data ? schoolCatalog.resolveProgram(index.data, programKey)?.program_key || programKey : programKey} disabled={!index.data} onValueChange={value => change('program', value)} options={index.data?.programs.map(item => ({ value: item.program_key, label: `${item.name} · ${item.degree_classes.join(' / ')}` })) || [{ value: programKey, label: 'Caricamento…' }]} /></div>}
    {saved.error && <div role="alert" className="text-sm text-error">{saved.error} <button onClick={saved.retry} className="min-h-11 underline">Riprova</button></div>}
    <SearchBar value={query} onChange={text => change('q', text)} onSubmit={text => change('q', text)} placeholder="Cerca nome, codice o docente…" />
    {plan.data && <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <FilterSelect label="Percorso" value={curriculum} onValueChange={value => change('curriculum', value)} options={[{ label: 'Tutti i percorsi', value: '' }, ...plan.data.curricula.map(item => ({ label: item.name || item.code, value: item.code }))]} />
      <FilterSelect label="Anno nel piano" value={level} onValueChange={value => change('level', value)} options={[{ label: 'Tutti gli anni', value: '' }, ...levels.map(value => ({ label: `${value}° anno`, value: String(value) }))]} />
      <FilterSelect label="Periodo" value={semester} onValueChange={value => change('semester', value)} options={[{ label: 'Tutti i periodi', value: '' }, ...semesters.map(value => ({ label: value, value }))]} />
      <FilterSelect label="Scelta" value={requirement} onValueChange={value => change('requirement', value)} options={[{ label: 'Tutte le attività', value: '' }, { label: 'Obbligatorie', value: 'required' }, { label: 'Nei gruppi a scelta', value: 'choice' }, { label: 'Regola da verificare', value: 'unknown' }]} />
      <FilterSelect label="Anno di insegnamento" value={teachingYear} onValueChange={value => change('academicYear', value)} options={[{ label: 'Tutti gli anni di insegnamento', value: '' }, ...[...new Set(plan.data.offerings.map(item => item.academic_year_start))].sort().map(value => ({ value: String(value), label: `${value}/${value + 1}` }))]} />
    </div>}
    {plan.loading ? <CatalogLoading /> : plan.error ? <CatalogError message={plan.error} retry={plan.reload} /> : plan.data && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-text tabular-nums">{filtered.length} insegnamenti e varianti nel piano</p><button type="button" onClick={clear} className="min-h-11 text-sm underline underline-offset-4">Azzera filtri</button></div>
      <p className="text-xs text-text leading-relaxed">Ogni scheda mantiene il percorso e l’anno di insegnamento. Per i vincoli di scelta, consulta il <Link state={returnState} to={schoolLink(`/programs/${programKey}`, context)} className="underline">piano completo</Link>.</p>
      {!filtered.length ? <p className="rounded-xl border border-outline-variant p-6 text-text">Nessuna attività corrisponde ai filtri.</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(offering => <SchoolOfferingCard key={offering.id} offering={offering} stats={courseStats.get(offering.course_id)} cohort={plan.data!} saved={saved} />)}</div>}
    </>}
  </div></Layout>;
}
