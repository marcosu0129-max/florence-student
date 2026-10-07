import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { createReturnState } from '../lib/navigation';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import FilterSelect from '../components/FilterSelect';
import { CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { OtherStatuses, OtherYearSelect } from '../components/SchoolOtherContent';
import { schoolOtherCatalog } from '../lib/schoolOtherCatalog';
import { useSchoolOtherData } from '../lib/useSchoolOtherData';
import { filterOtherPrograms, otherKindLabels, otherLink, otherStatus, otherYear } from '../lib/schoolOtherPresentation';

export default function SchoolOtherPrograms() {
  const location = useLocation();
  const detailState = createReturnState(location.pathname + location.search, location.state);
  const [params,setParams] = useSearchParams();
  const year = otherYear(params.get('edition'));
  const query = params.get('q') || '';
  const kind = params.get('kind') || '';
  const state = useSchoolOtherData('other-index', retry => schoolOtherCatalog.index({retry}));
  const programs = filterOtherPrograms(state.data?.programs || [],query,kind,year);
  const directoryQuery = params.get('directory') || '';
  const directory = state.data?.directory_entries.filter(entry => entry.name.toLocaleLowerCase('it').includes(directoryQuery.trim().toLocaleLowerCase('it'))) || [];
  const update = (key: string,value: string) => { const next = new URLSearchParams(params); value ? next.set(key,value) : next.delete(key); setParams(next,{replace:true}); };
  return <Layout catalogNotice={false} backTo="/"><div className="space-y-7">
    <header className="space-y-3"><p className="text-sm text-text">Scuola di Studi Umanistici e della Formazione · altri percorsi</p><h1 className="text-3xl sm:text-4xl font-semibold text-balance">Oltre i corsi di laurea</h1><p className="text-sm sm:text-base text-text max-w-3xl text-pretty">Master universitari, dottorati, perfezionamento, specializzazioni e formazione insegnanti. Comprende percorsi dei dipartimenti associati alla Scuola. La presenza nel catalogo non implica che le iscrizioni siano aperte nell’anno selezionato.</p></header>
    <div className="grid gap-4 md:grid-cols-2"><OtherYearSelect /><FilterSelect label="Tipo di percorso" value={kind} onValueChange={value=>update('kind',value)} options={[{value:'',label:'Tutti i percorsi'},...Object.entries(otherKindLabels).filter(([value])=>value!=='historical_degree').map(([value,label])=>({value,label})),...((!Object.hasOwn(otherKindLabels,kind) || kind === 'historical_degree') && kind ? [{value:kind,label:'Categoria non riconosciuta'}] : [])]} /></div>
    <div><label htmlFor="other-search" className="block text-sm text-text mb-2">Cerca un percorso o dipartimento</label><input id="other-search" type="search" value={query} onChange={e=>update('q',e.target.value)} className="w-full min-h-12 rounded-xl border border-outline-variant bg-canvas px-4 text-base" placeholder="Nome del percorso…" /></div>
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : <>
      <p role="status" className="text-sm text-text tabular-nums">{programs.length} {programs.length === 1 ? 'percorso' : 'percorsi'} · {year ? `${year}/${year+1}` : 'Anno non supportato'}</p>
      {!programs.length ? <section className="rounded-xl border border-outline-variant p-5"><h2 className="font-semibold text-balance">Nessun percorso trovato</h2><p className="text-text text-sm mt-2">Scegli un anno disponibile oppure modifica i filtri.</p><button className="min-h-11 underline mt-2" onClick={()=>setParams({edition:String(year || 2026)})}>Azzera filtri</button></section> : <div className="grid gap-4 lg:grid-cols-2">{programs.map(program => {
        const edition = program.editions.find(item=>item.academic_year_start===year)!;
        return <Link key={program.id} to={otherLink(`/other-programs/${program.id}`,year)} state={detailState} className="group flex gap-4 rounded-xl border border-outline-variant bg-card-base p-5 hover:bg-surface-container"><div className="min-w-0 flex-1 space-y-3"><p className="text-xs text-text">{otherKindLabels[program.program_kind]}{program.master_level ? ` · ${program.master_level}° livello` : ''}{program.department ? ` · ${program.department}` : ''}</p><h2 className="font-semibold text-base text-balance">{program.name}</h2><OtherStatuses admissions={edition.admissions_status} teaching={edition.teaching_status} />{edition.running_edition && <p className="text-xs text-text">Edizione in svolgimento: {edition.running_edition}</p>}</div><Icon name="chevron_right" size={20} className="self-center shrink-0 text-text" /></Link>;
      })}</div>}
      <section className="space-y-4 border-t border-outline-variant pt-7"><h2 className="text-2xl font-semibold text-balance">Directory storica e riferimenti originari</h2><p className="text-sm text-text text-pretty">Voci conservate dalla directory ufficiale, incluse denominazioni storiche e corrispondenze da confermare. Non sono ulteriori corsi attivi. Per i corsi ad esaurimento, l’assenza di nuovi ingressi non dimostra l’assenza di didattica per gli studenti già iscritti.</p><label className="block text-sm text-text" htmlFor="directory-search">Cerca nella directory</label><input id="directory-search" value={directoryQuery} onChange={e=>update('directory',e.target.value)} type="search" className="w-full min-h-12 rounded-xl border border-outline-variant bg-canvas px-4" /><p className="text-sm text-text tabular-nums" role="status">{directory.length} voci</p><div className="space-y-3">{directory.map(entry=><Link key={entry.id} to={otherLink(`/other-programs/directory/${entry.id}`,year)} state={detailState} className="flex items-center gap-4 border border-outline-variant rounded-xl p-4"><div className="min-w-0 flex-1"><p className="text-sm font-medium break-words">{entry.name}</p><p className="text-xs text-text mt-2">{otherKindLabels[entry.program_kind]} · {otherStatus(entry.resolution)}</p></div><Icon name="chevron_right" size={18} className="shrink-0" /></Link>)}</div>{!directory.length && <button className="min-h-11 underline text-sm" onClick={()=>update('directory','')}>Cancella ricerca nella directory</button>}</section>
      <p className="text-xs text-text">Versione del catalogo: {state.data && new Date(state.data.generated_at).toLocaleDateString('it-IT')}. Le schede distinguono dati pubblicati, informazioni mancanti e discrepanze nelle fonti.</p>
    </>}
  </div></Layout>;
}
