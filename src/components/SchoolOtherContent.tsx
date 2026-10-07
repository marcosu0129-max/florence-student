import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { createReturnState } from '../lib/navigation';
import FilterSelect from './FilterSelect';
import { officialLink } from '../lib/schoolLinks';
import { otherLink, otherStatus, otherYear } from '../lib/schoolOtherPresentation';
import type { SchoolOtherActivity, SchoolOtherDocumentReference, SchoolOtherSourceEvidence } from '../lib/schoolOtherTypes';

export function OtherYearSelect() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const year = otherYear(params.get('edition'));
  return <div className="max-w-sm"><FilterSelect label="Anno accademico delle fonti" value={year ? String(year) : ''} onValueChange={value => { const next = new URLSearchParams(params); next.set('edition', value); setParams(next, { state: location.state }); }} options={[...(year === null ? [{value:'',label:'Anno non supportato'}] : []), {value:'2026',label:'2026/2027'}, {value:'2025',label:'2025/2026'}]} /></div>;
}
export function OtherStatuses({ admissions, teaching }: { admissions: string; teaching: string }) {
  return <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold text-ink">Ammissione / presenza nel registro</dt><dd className="mt-1 text-text text-pretty">{otherStatus(admissions)}</dd></div><div><dt className="font-semibold text-ink">Documentazione didattica</dt><dd className="mt-1 text-text text-pretty">{otherStatus(teaching)}</dd></div></dl>;
}
export function Evidence({ sources }: { sources: SchoolOtherSourceEvidence[] }) {
  return <div className="space-y-3">{sources.map((source, i) => {
    const href = officialLink(source.url);
    return <details key={`${source.source_id}:${i}`} className="rounded-xl border border-outline-variant p-4 text-sm min-w-0"><summary className="cursor-pointer min-h-11 py-3 font-medium break-words">Fonte {i + 1} · {href ? new URL(href).hostname : 'Indirizzo non disponibile'}</summary><dl className="space-y-2 mt-3 text-text break-words"><div><dt className="font-medium">Pagina ufficiale</dt><dd className="break-all">{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{href}<span className="sr-only"> (nuova scheda)</span></a> : source.url}</dd></div><div><dt>Ultima acquisizione</dt><dd>{source.checked_at ? new Date(source.checked_at).toLocaleString('it-IT') : 'Data non disponibile'}</dd></div><div><dt>Esito della verifica</dt><dd>{String(source.status)}</dd></div><div><dt>Riferimento della fonte</dt><dd className="break-all">{source.source_id || 'Non disponibile'}</dd></div><div><dt>Impronta del documento (SHA-256)</dt><dd className="break-all">{source.sha256 || 'Non disponibile'}</dd></div></dl></details>;
  })}</div>;
}
const docLabels: Record<string,string> = { factsheet:'Scheda del percorso', doctoral_teaching_calendar:'Calendario didattico del dottorato', teaching_plan:'Piano didattico', study_plan:'Piano di studi', faculty_board:'Collegio dei docenti', biennial_master_curriculum:'Piano biennale del master', course_module_descriptions_current_calendar_2026:'Descrizione dei moduli nel calendario 2026', dated_teaching_calendar:'Calendario didattico con date', study_plan_with_teaching_assignments:'Piano di studi e docenze', year_specific_public_study_plan:'Piano di studi annuale' };
export function OtherDocuments({ documents, year }: { documents: SchoolOtherDocumentReference[]; year: number | null }) {
  const location = useLocation();
  return <div className="space-y-4">{documents.map((doc, i) => <article key={`${doc.source_id}:${doc.role}:${i}`} className="rounded-xl border border-outline-variant p-4 min-w-0"><h3 className="font-semibold text-balance">{docLabels[doc.role] || 'Documento ufficiale'} · {i + 1}</h3>{doc.document_id && <Link to={otherLink(`/other-programs/documents/${doc.document_id}`,year)} state={createReturnState(location.pathname + location.search, location.state)} className="inline-flex min-h-11 items-center underline text-sm">Leggi pagine e tabelle</Link>}{doc.full_text && <details className="text-sm mb-3"><summary className="min-h-11 cursor-pointer py-3 font-medium">Leggi il testo acquisito</summary><p className="whitespace-pre-wrap break-words leading-relaxed text-text">{doc.full_text}</p></details>}<Evidence sources={[doc]} /></article>)}</div>;
}
export function OtherActivities({ activities, context }: { activities: SchoolOtherActivity[]; context: string }) {
  return <div className="space-y-3">{activities.map((activity,i) => <details key={`${context}:${activity.id}:${i}`} className="rounded-xl border border-outline-variant p-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold text-pretty"><span>{activity.name}</span><span className="block mt-1 font-normal text-text tabular-nums">{activity.credits === null ? 'CFU non indicati' : `${activity.credits} CFU`}{activity.official_code ? ` · ${activity.official_code}` : ''}</span></summary><div className="mt-4 space-y-3 text-sm text-text break-words">
    {typeof activity.date_text === 'string' && <p>{activity.date_text}</p>}{typeof activity.hours === 'number' && <p className="tabular-nums">{activity.hours} ore</p>}
    <p>{activity.teachers_raw ? `Nomi riportati nella fonte: ${activity.teachers_raw}` : 'Docenti non assegnati pubblicamente in questa scheda.'}</p>
    {typeof activity.description === 'string' && <p className="whitespace-pre-wrap leading-relaxed">{activity.description}</p>}
    {activity.modules?.length ? <div><h4 className="font-semibold text-ink">Moduli dell’attività</h4><p className="mt-1">I moduli fanno parte dell’attività; i loro crediti non vanno sommati una seconda volta.</p><ul className="mt-3 space-y-2">{activity.modules.map((module,j) => <li key={j}>{module.name} · {module.credits === null ? 'CFU non indicati' : `${module.credits} CFU`}</li>)}</ul></div> : null}
    <details><summary className="min-h-11 py-3 cursor-pointer">Riferimento e testo originale</summary><p className="break-all">Fonte: {activity.source_id}</p><StructuredText value={activity.evidence} /></details>
  </div></details>)}</div>;
}
/** Official extracted prose remains text; never inject HTML from a source. */
export function StructuredText({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') return <p className="whitespace-pre-wrap break-words leading-relaxed">{String(value)}</p>;
  if (Array.isArray(value)) return <div className="space-y-3">{value.map((item,i) => <StructuredText key={i} value={item} />)}</div>;
  return <dl className="space-y-3">{Object.entries(value).map(([key,item]) => <div key={key}><dt className="text-xs text-text break-words">{key.replaceAll('_',' ')}</dt><dd className="mt-1"><StructuredText value={item} /></dd></div>)}</dl>;
}

export function OriginalCheckNote({ text }: { text: string }) {
  return <details className="text-sm text-text"><summary className="cursor-pointer min-h-11 py-3">Nota di verifica originale</summary><p className="whitespace-pre-wrap break-words leading-relaxed" lang="en">{text}</p></details>;
}
