import { Link, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { CatalogError, CatalogLoading } from '../components/CatalogNotice';
import { schoolOtherCatalog } from '../lib/schoolOtherCatalog';
import { useSchoolOtherData } from '../lib/useSchoolOtherData';
import { otherLink, otherYear } from '../lib/schoolOtherPresentation';
import { officialLink } from '../lib/schoolLinks';

export default function SchoolOtherDocument() {
  const {id=''}=useParams(); const [params]=useSearchParams(); const year=otherYear(params.get('edition'));
  const state=useSchoolOtherData(`other-document:${id}`,retry=>schoolOtherCatalog.document(id,{retry}));
  const document=state.data?.document; const source=officialLink(document?.source_url);
  return <Layout catalogNotice={false} backTo={otherLink('/other-programs',year)}><div className="space-y-7"><header className="space-y-3"><p className="text-sm text-text">Altri percorsi · documentazione ufficiale</p><h1 className="text-3xl sm:text-4xl font-semibold text-balance">Pagine e tabelle della fonte</h1><p className="text-sm text-text text-pretty">Trascrizione del documento acquisito. La disposizione del PDF originale può essere più chiara delle tabelle estratte; consulta sempre l’originale per interpretare righe unite e calendari complessi.</p></header>
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !document ? <section><h2 className="text-xl font-semibold text-balance">Documento non trovato</h2><Link to={otherLink('/other-programs',year)} className="inline-flex min-h-11 items-center underline mt-3">Torna ai percorsi</Link></section> : <>
      {source && <a href={source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline text-sm">Apri il documento ufficiale<span className="sr-only"> (nuova scheda)</span></a>}
      <p className="text-sm text-text tabular-nums">{document.pages.length} pagine acquisite</p>
      {document.pages.map(page=><section key={page.page} className="rounded-xl border border-outline-variant p-4 sm:p-5 space-y-4 min-w-0"><h2 className="text-xl font-semibold text-balance">Pagina {page.page}</h2><details><summary className="min-h-11 py-3 cursor-pointer font-medium text-sm">Leggi il testo della pagina</summary><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text">{page.text || 'Nessun testo estraibile in questa pagina.'}</p></details>{page.tables.map((table,i)=><details key={i}><summary className="cursor-pointer min-h-11 py-3 text-sm font-medium">Tabella {i+1} · {table.length} righe</summary><div tabIndex={0} role="region" aria-label={`Tabella ${i+1} della pagina ${page.page}, scorrimento orizzontale`} className="overflow-x-auto max-w-full border border-outline-variant rounded-lg"><table className="text-xs text-text border-collapse w-full"><caption className="sr-only">Tabella originale {i+1}, pagina {page.page}</caption><tbody>{table.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c} className="p-3 border border-outline-variant min-w-32 align-top whitespace-pre-wrap break-words">{cell ?? '—'}</td>)}</tr>)}</tbody></table></div></details>)}</section>)}
      <details className="text-xs text-text"><summary className="min-h-11 py-3 cursor-pointer">Riferimento e verifica del documento</summary><p className="break-all">Fonte: {document.source_id}</p><p className="break-all mt-2">SHA-256: {document.source_sha256}</p></details>
    </>}
  </div></Layout>;
}
