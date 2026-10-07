import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { useSavedCourses } from '../lib/useSavedCourses';
import { useSchoolData } from '../lib/useSchoolData';
import { schoolCatalog, type SchoolSearch } from '../lib/schoolCatalog';
import { schoolCommunityIdentity } from '../lib/schoolCommunityIdentity';
import { schoolLink } from '../lib/schoolLinks';

type SavedEntry = { key: string; storedIds: string[]; course: SchoolSearch['courses'][number] | null };

export default function SavedCourses() {
  const { planYear, programKey } = useCatalog();
  const saved = useSavedCourses();
  const state = useSchoolData(`saved:${saved.ownerKey}:${saved.savedIds.join('|')}`, async () => {
    const index = await schoolCatalog.index();
    const courses = await schoolCommunityIdentity.resolveCourses(saved.savedIds);
    const grouped = new Map<string, SavedEntry>();
    saved.savedIds.forEach((storedId, position) => {
      const course = courses[position];
      const key = course?.official_code || schoolCommunityIdentity.canonicalCourseKey(storedId);
      const previous = grouped.get(key);
      if (previous) previous.storedIds.push(storedId); else grouped.set(key, { key, storedIds: [storedId], course });
    });
    return { index, entries: [...grouped.values()] };
  });
  const entries = state.data?.entries.filter(entry => entry.storedIds.some(id => saved.savedIds.includes(id))) || [];
  const selectedProgram = state.data && programKey ? schoolCatalog.resolveProgram(state.data.index, programKey)?.program_key : undefined;
  const cohortYear = Number(planYear.slice(0, 4));
  return <Layout showBack backTo="/profile" catalogNotice={false}><div className="flex flex-col gap-6">
    <header><h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold text-ink">I miei corsi salvati</h1><p className="mt-4 text-sm text-text">{saved.cloud ? 'Salvati nel tuo account.' : 'Salvati su questo dispositivo.'} {saved.loading || state.loading ? 'Caricamento dei corsi…' : saved.error || state.error ? 'Elenco non disponibile. Riprova per verificare i corsi salvati.' : `${entries.length} ${entries.length === 1 ? 'preferito conservato' : 'preferiti conservati'}.`}</p><p className="mt-2 text-sm text-text">Ogni corso è salvato una sola volta. Scegli il corso di laurea e l’anno di ingresso per aprire la scheda corretta.</p></header>
    <PlanYearSelect />
    {saved.cloud && saved.localCount > 0 && <section className="rounded-xl border border-outline-variant bg-canvas-soft p-4"><p className="text-sm text-text">Su questo dispositivo sono conservati {saved.localCount} preferiti ospite. Puoi copiarli nel tuo account senza eliminare la copia locale.</p><button type="button" onClick={() => { void saved.importLocal(); }} disabled={saved.unavailable || saved.pendingIds.length > 0} className="mt-3 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-50">{saved.importing ? 'Sincronizzazione…' : 'Importa i preferiti locali'}</button></section>}
    {saved.importMessage && <p role="status" className="text-sm text-text">{saved.importMessage}</p>}
    {saved.error && <CatalogError message={saved.error} retry={saved.retry} />}
    {saved.loading || state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !entries.length ?
      <Link className="self-start underline underline-offset-4 text-sm" to="/programs">Esplora i corsi di laurea</Link> : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {entries.map((entry, position) => {
        const course = entry.course;
        const contexts = course ? [...new Map(course.contexts.map(context => [`${context.program_key}:${context.cohort_year}`, context])).values()] : [];
        const inCurrentPlan = contexts.some(context => context.cohort_year === cohortYear && (!selectedProgram || context.program_key === selectedProgram));
        return <article key={entry.key} className="flex flex-col gap-4 rounded-xl border border-border-card bg-card-base p-5 shadow-card">
          <div className="flex items-start gap-3"><div className="min-w-0 flex-1">{course && <p className="mb-2 text-xs text-text">{course.official_code}</p>}<h2 className="text-lg font-semibold leading-snug text-ink text-pretty">{course?.name || 'Corso salvato non ancora disponibile'}</h2></div><button type="button" onClick={() => { void saved.toggle(entry.storedIds[0]); }} disabled={saved.unavailable || saved.isPending(entry.storedIds[0])} aria-busy={saved.isPending(entry.storedIds[0])} aria-label={course ? `Rimuovi dai salvati: ${course.name}` : `Rimuovi il preferito non disponibile numero ${position + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-outline-variant text-text disabled:opacity-50"><Icon name="bookmark" size={20} filled /></button></div>
          {!course ? <p className="text-sm text-text">Questo preferito è conservato. La scheda non è ancora inclusa nel catalogo attuale.</p> : <>
            {!inCurrentPlan && <p className="text-sm text-text">Non presente nel piano selezionato ({planYear}). Il preferito resta salvato; puoi aprire uno dei piani disponibili.</p>}
            <ul className="flex flex-col gap-2">{contexts.map(context => {
              const program = state.data!.index.programs.find(program => program.program_key === context.program_key);
              return <li key={`${context.program_key}:${context.cohort_year}`}><Link to={schoolLink(`/courses/${course.id}`, { programKey: context.program_key, cohortYear: context.cohort_year })} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-outline-variant px-4 py-3 text-sm text-text hover:text-ink"><span className="min-w-0"><span className="block font-medium text-ink">{program?.name || context.program_key}</span><span className="mt-1 block text-xs">{context.program_key} · Ingresso {context.cohort_year}/{context.cohort_year + 1}</span></span><Icon name="chevron_right" size={20} /></Link></li>;
            })}</ul>
          </>}
        </article>;
      })}
    </div>}
  </div></Layout>;
}
