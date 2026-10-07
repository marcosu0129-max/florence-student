import { createReturnState } from '../lib/navigation';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import FilterSelect from '../components/FilterSelect';
import SearchBar from '../components/SearchBar';
import Icon from '../components/Icon';
import { PlanYearSelect, CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { schoolLink } from '../lib/schoolLinks';

export default function Professors() {
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const [params, setParams] = useSearchParams();
  const { planYear, programKey: selectedProgram } = useCatalog();
  const context = { programKey: params.get('program') || selectedProgram || 'B385', cohortYear: Number(planYear.slice(0,4)) };
  const index = useSchoolData('school-index', retry => schoolCatalog.index({ retry }));
  const plan = useSchoolData(`professors:${JSON.stringify(context)}`, retry => schoolCatalog.cohort(context, { retry }));
  const query = params.get('q') || '';
  const profileYear = params.get('profileYear') || '';
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key,value); else next.delete(key); next.set('year',planYear); if(key==='program') next.delete('profileYear'); setParams(next,{replace:true,state:location.state}); };
  const profiles = plan.data?.professor_profiles.filter(profile => (!profileYear || String(profile.profile_year) === profileYear) && [profile.name,profile.official_id,profile.department || ''].join(' ').toLocaleLowerCase('it').includes(query.trim().toLocaleLowerCase('it'))) || [];
  return <Layout catalogNotice={false}><div className="space-y-6">
    <header><h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-balance">Docenti</h1><p className="mt-3 text-sm text-text">{plan.data?.program.name || 'Schede annuali dei docenti UNIFI'}</p></header>
    <PlanYearSelect />
    <Link state={returnState} to={`/search?year=${encodeURIComponent(planYear)}`} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">Cerca in tutta la scuola</Link>
    {index.error ? <CatalogError message={index.error} retry={index.reload} /> : <div className="max-w-2xl"><FilterSelect label="Corso di laurea" value={index.data ? schoolCatalog.resolveProgram(index.data,context.programKey)?.program_key || context.programKey : context.programKey} disabled={!index.data} onValueChange={value => update('program',value)} options={index.data?.programs.map(program=>({value:program.program_key,label:program.name})) || [{value:context.programKey,label:'Caricamento…'}]} /></div>}
    <SearchBar value={query} onChange={value=>update('q',value)} onSubmit={value=>update('q',value)} placeholder="Cerca docente, codice o dipartimento…" />
    {plan.data && <div className="max-w-sm"><FilterSelect label="Anno della scheda docente" value={profileYear} onValueChange={value=>update('profileYear',value)} options={[{value:'',label:'Tutti gli anni disponibili'},...[...new Set(plan.data.professor_profiles.map(profile=>profile.profile_year))].sort().map(year=>({value:String(year),label:`${year}/${year+1}`}))]} /></div>}
    {plan.loading ? <CatalogLoading /> : plan.error ? <CatalogError message={plan.error} retry={plan.reload} /> : <>
      <p role="status" className="text-sm text-text tabular-nums">{profiles.length} {profiles.length === 1 ? 'scheda annuale' : 'schede annuali'} · le informazioni di anni diversi restano separate.</p>
      {!profiles.length ? <div className="rounded-xl border border-outline-variant p-5 text-sm text-text"><p>Nessun docente corrisponde alla ricerca.</p><button className="min-h-11 mt-3 underline" onClick={()=>setParams({program:context.programKey,year:planYear},{replace:true,state:location.state})}>Azzera filtri</button></div> : <div className="grid gap-4 md:grid-cols-2">{profiles.map(profile=><Link state={returnState} key={`${profile.id}:${profile.profile_year}`} to={schoolLink(`/professors/${profile.id}`,context,{profileYear:profile.profile_year})} className="flex items-center gap-4 rounded-xl border border-outline-variant bg-card-base p-5"><span className="min-w-0 flex-1"><span className="block font-semibold text-ink text-pretty">{profile.name}</span><span className="block mt-2 text-sm text-text">{profile.profile_year}/{profile.profile_year+1}</span>{profile.department && <span className="block mt-1 text-xs text-text text-pretty">{profile.department}</span>}</span><Icon name="chevron_right" size={20} /></Link>)}</div>}
    </>}
  </div></Layout>;
}
