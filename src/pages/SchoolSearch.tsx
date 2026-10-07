import { createReturnState } from '../lib/navigation';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import FilterSelect from '../components/FilterSelect';
import Icon from '../components/Icon';
import { PlanYearSelect, CatalogLoading, CatalogError } from '../components/CatalogNotice';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';

const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('it');
export default function SchoolSearch() {
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const [params, setParams] = useSearchParams();
  const { planYear } = useCatalog();
  const cohortYear = Number(planYear.slice(0,4));
  const query = params.get('q') || '';
  const subject = params.get('subject') || '';
  const programKey = params.get('program') || '';
  const state = useSchoolData('school-global-search', async retry => ({ index: await schoolCatalog.index({retry}), search: await schoolCatalog.search({retry}) }));
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const matches = (value: string) => terms.every(term => normalize(value).includes(term));
  const inScope = (context: { cohort_year: number; program_key: string }) => context.cohort_year === cohortYear && (!programKey || context.program_key === programKey);
  const courses = state.data && terms.length && subject !== 'professor' ? state.data.search.courses.filter(item => matches([item.name,item.official_code,...item.names].join(' '))).map(item => ({ ...item, contexts: item.contexts.filter(inScope), kind: 'course' as const, code: item.official_code })).filter(item => item.contexts.length) : [];
  const professors = state.data && terms.length && subject !== 'course' ? state.data.search.professors.filter(item => matches(`${item.name} ${item.official_id}`)).map(item => ({ ...item, contexts: item.contexts.filter(inScope), kind: 'professor' as const, code: item.official_id })).filter(item => item.contexts.length) : [];
  const items = [...courses,...professors];
  const pageCount = Math.max(1,Math.ceil(items.length/30));
  const requested = Number(params.get('page') || 1);
  const page = Number.isInteger(requested) ? Math.max(1,Math.min(pageCount,requested)) : 1;
  const change = (key: string,value: string) => { const next = new URLSearchParams(params); if(value) next.set(key,value); else next.delete(key); if(key!=='page') next.delete('page'); next.set('year',planYear); setParams(next,{replace:true,state:location.state}); };
  return <Layout catalogNotice={false} showBack backTo={catalogLink('/',planYear)}><div className="space-y-6">
    <header><h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-balance">Cerca nella scuola</h1><p className="mt-3 text-sm text-text">Insegnamenti e docenti di tutti i corsi di laurea, con i rispettivi piani e anni di attività.</p></header>
    <PlanYearSelect />
    <SearchBar value={query} onChange={value=>change('q',value)} onSubmit={value=>change('q',value)} placeholder="Cerca corso, codice o docente…" />
    <div className="grid gap-4 sm:grid-cols-2"><FilterSelect label="Cosa cerchi" value={subject} onValueChange={value=>change('subject',value)} options={[{value:'',label:'Insegnamenti e docenti'},{value:'course',label:'Insegnamenti'},{value:'professor',label:'Docenti'}]} /><FilterSelect label="Corso di laurea" value={programKey} onValueChange={value=>change('program',value)} options={[{value:'',label:'Tutta la scuola'},...(state.data?.index.programs.map(program=>({value:program.program_key,label:program.name})) || [])]} /></div>
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !terms.length ? <p className="rounded-xl border border-outline-variant bg-card-base p-6 text-sm text-text">Scrivi un nome o un codice per cercare in tutta la scuola.</p> : <>
      <p role="status" className="text-sm text-text tabular-nums">{items.length} {items.length === 1 ? 'risultato' : 'risultati'} nel piano {planYear}</p>
      {!items.length ? <div className="rounded-xl border border-outline-variant p-6 text-sm text-text"><p>Nessun risultato. Prova un altro nome, anno di ingresso o corso di laurea.</p><button className="min-h-11 mt-3 underline" onClick={()=>setParams({year:planYear},{replace:true,state:location.state})}>Azzera ricerca e filtri</button></div> : <div className="grid gap-4 md:grid-cols-2">{items.slice((page-1)*30,page*30).map(item=>{
        const keys = [...new Set(item.contexts.map(context=>context.program_key))];
        const names = keys.map(key=>state.data!.index.programs.find(program=>program.program_key===key)?.name || key);
        return <Link state={returnState} key={`${item.kind}:${item.id}`} to={catalogLink(`/${item.kind==='course'?'courses':'professors'}/${item.id}`,planYear,programKey || undefined)} className="flex items-center gap-4 rounded-xl border border-outline-variant bg-card-base p-5"><span className="min-w-0 flex-1"><span className="block text-xs text-text">{item.kind==='course'?'Insegnamento':'Docente'} · {item.code}</span><span className="block mt-2 font-semibold text-ink text-pretty">{item.name}</span><span className="block mt-3 text-xs text-text text-pretty">{names.slice(0,2).join(' · ')}{names.length>2?` · ${names.length === 3 ? 'e un altro corso di laurea' : `e altri ${names.length-2} corsi di laurea`}`:''}</span></span><Icon name="chevron_right" size={20} /></Link>;
      })}</div>}
      {pageCount>1 && <nav aria-label="Pagine dei risultati" className="flex items-center justify-between gap-3"><button disabled={page<=1} className="min-h-11 rounded-full border border-outline-variant px-4 text-sm disabled:opacity-40" onClick={()=>change('page',String(page-1))}>Precedente</button><span className="text-sm text-text tabular-nums">{page} / {pageCount}</span><button disabled={page>=pageCount} className="min-h-11 rounded-full border border-outline-variant px-4 text-sm disabled:opacity-40" onClick={()=>change('page',String(page+1))}>Successiva</button></nav>}
    </>}
  </div></Layout>;
}
