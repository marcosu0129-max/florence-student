import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { createReturnState } from '../lib/navigation';
import Layout from '../components/Layout';
import { CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { Evidence, OtherDocuments, OtherStatuses, OtherYearSelect, OriginalCheckNote } from '../components/SchoolOtherContent';
import { schoolOtherCatalog } from '../lib/schoolOtherCatalog';
import { useSchoolOtherData } from '../lib/useSchoolOtherData';
import { otherKindLabels, otherLink, otherStatus, otherYear, otherDirectoryHeading } from '../lib/schoolOtherPresentation';
import type { SchoolOtherDocumentReference } from '../lib/schoolOtherTypes';

export default function SchoolOtherDirectory() {
  const location = useLocation();
  const detailState = createReturnState(location.pathname + location.search, location.state);
  const {id=''}=useParams(); const [params]=useSearchParams(); const year=otherYear(params.get('edition'));
  const state=useSchoolOtherData(`other-directory:${id}`,async retry=>{
    const [detail,index]=await Promise.all([schoolOtherCatalog.directoryEntry(id,{retry}),schoolOtherCatalog.index({retry})]);
    return {detail,index};
  });
  const entry=state.data?.detail?.entry;
  const heading = entry ? otherDirectoryHeading(entry.name,entry.program_kind) : null;
  const check=entry?.year_checks.find(item=>item.academic_year_start===year);
  const candidate=state.data?.index.directory_entries.find(item=>item.directory_entry_index===entry?.possible_duplicate_of_directory_entry);
  const historical=entry?.historical_plan_evidence as SchoolOtherDocumentReference | undefined;
  return <Layout catalogNotice={false} backTo={otherLink('/other-programs',year)}><div className="space-y-7"><header className="space-y-3"><p className="text-sm text-text">Directory originale · {entry ? otherKindLabels[entry.program_kind] : 'Voce ufficiale'}</p><h1 className="text-2xl sm:text-4xl font-semibold text-balance break-words">{heading?.title || 'Voce della directory'}</h1>{!!heading?.metadata.length && <><div className="space-y-2 max-w-3xl text-sm leading-relaxed text-text">{heading.metadata.map((text,i)=><p key={i} className="text-pretty">{text}</p>)}</div><details className="text-sm text-text"><summary className="cursor-pointer min-h-11 py-3">Denominazione completa nella directory ufficiale</summary><p className="text-pretty leading-relaxed break-words">{entry?.name}</p></details></>}</header><OtherYearSelect />
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !entry ? <section><h2 className="text-xl font-semibold text-balance">Voce non trovata</h2><Link to={otherLink('/other-programs',year)} className="inline-flex min-h-11 items-center underline mt-3">Torna alla directory</Link></section> : <>
      <section className="rounded-xl border border-outline-variant bg-card-base p-5 space-y-4"><h2 className="text-lg font-semibold text-balance">{otherStatus(entry.resolution)}</h2>{check ? <OtherStatuses admissions={check.admissions_status} teaching={check.teaching_status} /> : <p className="text-sm text-text">Nessuna verifica disponibile per l’anno richiesto.</p>}{check && typeof check.reason==='string' && <OriginalCheckNote text={check.reason} />}</section>
      {entry.program_kind==='historical_degree' && <p className="text-sm text-text text-pretty">Questa voce documenta la storia dell’offerta. Non viene conteggiata come nuovo corso attivo. La didattica o gli esami destinati agli iscritti precedenti possono continuare anche in assenza di nuove ammissioni.</p>}
      {typeof entry.identity_resolution==='string' && <section className="space-y-3"><h2 className="text-xl font-semibold text-balance">Corrispondenza della denominazione</h2><p className="text-sm text-text">{typeof entry.possible_duplicate_of_directory_entry === 'number' ? 'La directory ripete un titolo e una classe simili senza un codice univoco. La voce rimane separata come possibile duplicato e non viene conteggiata come nuovo corso attivo.' : entry.resolution === 'related_title_requires_alias_confirmation' ? 'È stato individuato un titolo moderno correlato, ma la continuità o il cambio di denominazione non sono confermati dalle fonti. I percorsi e le relative attività restano separati.' : 'La corrispondenza della denominazione richiede una verifica. Consulta la nota originale.'}</p><OriginalCheckNote text={entry.identity_resolution} />{candidate && <Link to={otherLink(`/other-programs/directory/${candidate.id}`,year)} state={detailState} className="inline-flex min-h-11 items-center underline text-sm break-words">Confronta la voce simile: {candidate.name}</Link>}</section>}
      {!!entry.related_program_ids.length && <section className="space-y-3"><h2 className="text-xl font-semibold text-balance">Percorsi collegati</h2>{entry.resolution==='related_title_requires_alias_confirmation' && <p className="text-sm text-text">La somiglianza del titolo non conferma che si tratti dello stesso percorso.</p>}<ul className="space-y-2">{entry.related_program_ids.map(programId=><li key={programId}><Link to={otherLink(`/other-programs/${programId}`,year)} state={detailState} className="inline-flex min-h-11 items-center underline text-sm">{state.data?.index.programs.find(program=>program.id===programId)?.name || 'Consulta il percorso collegato'}</Link></li>)}</ul></section>}
      {historical && <section className="space-y-3"><h2 className="text-xl font-semibold text-balance">Documentazione storica</h2><p className="text-sm text-text">Il documento conserva il proprio periodo di riferimento e non descrive un nuovo ingresso nell’anno selezionato.</p><OtherDocuments documents={[historical]} year={year} /></section>}
      <section className="space-y-4"><h2 className="text-xl font-semibold text-balance">Fonti della directory</h2><Evidence sources={entry.source_evidence} /></section>
    </>}
  </div></Layout>;
}
