import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import BottomSheet from '../components/BottomSheet';
import { CatalogError } from '../components/CatalogNotice';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useAccountSession } from '../lib/useAccountSession';
import { authPageUrl } from '../lib/authFlow';
import { downloadMaterial, fetchAdminRole, materialSize, materialStatus, moderateMaterial, type ModerationReport, type MaterialRecord, type ModerationSubject } from '../lib/materialsApi';

import { createCommunityRequestScope } from '../lib/communityRequestScope';
import { mergeMaterialRows } from '../lib/materialPagination';
import { fetchMaterialPage, fetchModerationPage, fetchHiddenReviewPage, type HiddenReviewRecord, type ReviewSubject, type ListingPage, type ModerationQueueKind } from '../lib/materialListingApi';

const emptyPage = <T,>(): ListingPage<T> => ({ items: [], hasMore: false, nextCursor: null });

type Decision = { id: string; subject: ModerationSubject; status: 'published' | 'rejected' | 'hidden'; title: string };
type ListingKind = ModerationQueueKind | ReviewSubject | 'published';
export default function Admin() {
  const { planYear } = useCatalog();
  const location = useLocation();
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const userId = session?.user.id || '';
  const requests = useRef(createCommunityRequestScope()).current;
  const scopeVersion = requests.update(userId, checking || Boolean(sessionError));
  const [adminUser, setAdminUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedUser, setCheckedUser] = useState('');
  const [resourcePages, setResourcePages] = useState({ pending: emptyPage<MaterialRecord>(), reconsider: emptyPage<MaterialRecord>() });
  const [reportPage, setReportPage] = useState(emptyPage<ModerationReport>);
  const [hiddenReviews, setHiddenReviews] = useState({ course: emptyPage<HiddenReviewRecord>(), professor: emptyPage<HiddenReviewRecord>() });
  const [published, setPublished] = useState(emptyPage<MaterialRecord>);
  const queue = { resources: [...resourcePages.pending.items, ...resourcePages.reconsider.items], reports: reportPage.items };
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [actionError, setActionError] = useState('');
  const [listingErrors, setListingErrors] = useState<Partial<Record<ListingKind, string>>>({});
  const [busy, setBusy] = useState(false);

  const isAdmin = Boolean(userId && adminUser === userId);
  const retry = () => { requests.invalidateReads(); setBusy(false); setRevision(value => value + 1); };
  useEffect(() => () => requests.dispose(), [requests]);
  useEffect(() => { setBusy(false); setMessage(''); }, [scopeVersion]);

  useEffect(() => {
    setDecision(null); setResourcePages({ pending: emptyPage(), reconsider: emptyPage() }); setReportPage(emptyPage()); setPublished(emptyPage()); setHiddenReviews({ course: emptyPage(), professor: emptyPage() }); setAdminUser(''); setCheckedUser(''); setActionError(''); setListingErrors({});
    if (checking || !userId || sessionError) { setLoading(false); return; }
    let active = true; const ticket = requests.beginRead(); const accepts = () => active && requests.acceptsRead(ticket); setBusy(false); setLoading(true); setError('');
    (async () => {
      const allowed = await fetchAdminRole();
      if (!accepts()) return;
      setCheckedUser(userId);
      if (!allowed) return;
      setAdminUser(userId);
      const [pending, reconsider, reports, materials, courses, professors] = await Promise.all([fetchModerationPage('pending'), fetchModerationPage('reconsider'), fetchModerationPage('reports'), fetchMaterialPage(), fetchHiddenReviewPage('course'), fetchHiddenReviewPage('professor')]);
      if (accepts()) { setResourcePages({ pending, reconsider }); setReportPage(reports); setPublished(materials); setHiddenReviews({ course: courses, professor: professors }); }
    })().catch(reason => { if (accepts()) setError(reason instanceof Error ? reason.message : 'Impossibile caricare la moderazione.'); })
      .finally(() => { if (accepts()) setLoading(false); });
    return () => { active = false; };
  }, [checking, userId, sessionError, revision, scopeVersion]);

  function choose(next: Decision) { setDecision(next); setNote(''); setActionError(''); setMessage(''); }
  async function confirm() {
    if (!decision) return;
    const ticket = requests.beginOperation(); if (!ticket) return;
    const owner = userId; setBusy(true); setActionError('');
    try {
      await moderateMaterial(decision.subject, decision.id, decision.status, note, owner);
      if (requests.acceptsOperation(ticket)) { setDecision(null); setMessage('Decisione salvata. L’autore riceverà una notifica quando lo stato cambia.'); retry(); }
    } catch (reason) { if (requests.acceptsOperation(ticket)) setActionError(reason instanceof Error ? reason.message : 'Operazione non riuscita. Riprova.'); }
    finally { if (requests.finishOperation(ticket)) setBusy(false); }
  }

  async function download(item: MaterialRecord) {
    const ticket = requests.beginOperation(); if (!ticket) return;
    const owner = userId; setBusy(true); setActionError('');
    try { await downloadMaterial(item, owner); }
    catch (reason) { if (requests.acceptsOperation(ticket)) setActionError(reason instanceof Error ? reason.message : 'Download non riuscito.'); }
    finally { if (requests.finishOperation(ticket)) setBusy(false); }
  }

  async function loadMorePublished() {
    if (!published.hasMore) return;
    const ticket = requests.beginOperation(true); if (!ticket) return;
    setBusy(true); setListingErrors(previous => ({ ...previous, ['published']: undefined }));
    try {
      const page = await fetchMaterialPage({}, published.nextCursor);
      if (requests.acceptsOperation(ticket)) setPublished(current => ({ ...page, items: mergeMaterialRows(current.items, page.items) }));
    } catch (reason) { if (requests.acceptsOperation(ticket)) setListingErrors(previous => ({ ...previous, ['published']: reason instanceof Error ? reason.message : 'Impossibile caricare altri materiali.' })); }
    finally { if (requests.finishOperation(ticket)) setBusy(false); }
  }

  async function loadMoreQueue(kind: ModerationQueueKind) {
    const ticket = requests.beginOperation(true); if (!ticket) return;
    setBusy(true); setListingErrors(previous => ({ ...previous, [kind]: undefined }));
    try {
      if (kind === 'reports') {
        const page = await fetchModerationPage(kind, reportPage.nextCursor);
        if (requests.acceptsOperation(ticket)) setReportPage(current => ({ ...page, items: mergeMaterialRows(current.items, page.items) }));
      } else {
        const page = await fetchModerationPage(kind, resourcePages[kind].nextCursor);
        if (requests.acceptsOperation(ticket)) setResourcePages(current => ({ ...current, [kind]: { ...page, items: mergeMaterialRows(current[kind].items, page.items) } }));
      }
    } catch (reason) { if (requests.acceptsOperation(ticket)) setListingErrors(previous => ({ ...previous, [kind]: reason instanceof Error ? reason.message : 'Impossibile caricare altri elementi. Riprova.' })); }
    finally { if (requests.finishOperation(ticket)) setBusy(false); }
  }

  async function loadMoreHidden(subject: ReviewSubject) {
    const current = hiddenReviews[subject];
    if (!current.hasMore) return;
    const ticket = requests.beginOperation(true); if (!ticket) return;
    setBusy(true); setListingErrors(previous => ({ ...previous, [subject]: undefined }));
    try {
      const page = await fetchHiddenReviewPage(subject, current.nextCursor);
      if (requests.acceptsOperation(ticket)) setHiddenReviews(previous => ({ ...previous, [subject]: { ...page, items: mergeMaterialRows(previous[subject].items, page.items) } }));
    } catch (reason) { if (requests.acceptsOperation(ticket)) setListingErrors(previous => ({ ...previous, [subject]: reason instanceof Error ? reason.message : 'Impossibile caricare altre recensioni. Riprova.' })); }
    finally { if (requests.finishOperation(ticket)) setBusy(false); }
  }

  function listingError(kind: ListingKind) {
    return listingErrors[kind] && <p id={`listing-error-${kind}`} role="alert" className="mt-4 rounded-xl border border-error/30 p-4 text-sm leading-relaxed text-error">{listingErrors[kind]} Usa il pulsante qui sotto per riprovare.</p>;
  }

  function hiddenReviewList(subject: ReviewSubject) {
    const page = hiddenReviews[subject];
    const title = subject === 'course' ? 'Recensioni dei corsi nascoste' : 'Recensioni dei docenti nascoste';
    return <section key={subject} aria-labelledby={`hidden-${subject}-heading`}>
      <h2 id={`hidden-${subject}-heading`} className="mb-4 text-xl font-semibold text-balance">{title}</h2>
      <p className="mb-4 text-sm leading-relaxed text-text text-pretty">Le recensioni restano private finché un moderatore non ne conferma la ripubblicazione.</p>
      {!page.items.length ? <p className="rounded-xl border border-outline-variant p-5 text-sm text-text">Non ci sono recensioni nascoste da riesaminare.</p> : <ul className="grid gap-4 md:grid-cols-2">{page.items.map(item => <li key={item.id} className="min-w-0 rounded-2xl border border-border-card bg-card-base p-5">
        <h3 className="break-words text-lg font-semibold text-balance">{item.subject_name}</h3>
        {item.plan_year && <p className="mt-2 text-xs text-text">Piano {item.plan_year}</p>}
        <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-text">{item.verbal_review}</p>
        {item.moderation_note && <p className="mt-4 rounded-xl bg-canvas p-3 text-sm text-text break-words">Nota di moderazione: {item.moderation_note}</p>}
        <button type="button" disabled={busy} onClick={() => choose({ id: item.id, subject: subject === 'course' ? 'course_review' : 'professor_review', status: 'published', title: item.subject_name })} className="mt-5 min-h-11 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">Ripubblica recensione</button>
      </li>)}</ul>}
      {listingError(subject)}
      {page.hasMore && <button type="button" aria-describedby={listingErrors[subject] ? `listing-error-${subject}` : undefined} disabled={busy} onClick={() => void loadMoreHidden(subject)} className="mt-4 min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold disabled:opacity-60">{subject === 'course' ? 'Carica altre recensioni dei corsi nascoste' : 'Carica altre recensioni dei docenti nascoste'}</button>}
    </section>;
  }

  function queueNext(kind: ModerationQueueKind, label: string) {
    const page = kind === 'reports' ? reportPage : resourcePages[kind];
    return page.hasMore && <>{listingError(kind)}<button type="button" aria-describedby={listingErrors[kind] ? `listing-error-${kind}` : undefined} disabled={busy} onClick={() => void loadMoreQueue(kind)} className="mt-4 min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold disabled:opacity-60">{label}</button></>;
  }

  function resourceList(items: MaterialRecord[], empty: string) {
    if (!items.length) return <p className="rounded-xl border border-outline-variant p-5 text-sm text-text">{empty}</p>;
    return <ul className="grid gap-4 md:grid-cols-2">{items.map(item => <li key={item.id} className="min-w-0 rounded-2xl border border-border-card bg-card-base p-5">
      <p className="text-xs leading-relaxed text-text">{item.file_type.toUpperCase()} · {materialSize(item.file_size)} · {materialStatus(item.status)}</p>
      <h3 className="mt-3 break-words text-lg font-semibold text-balance">{item.title}</h3><p className="mt-2 text-sm text-text">{item.course_name} · {item.uploader}{item.plan_year ? ` · ${item.plan_year}` : ''}</p>
      {item.description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-text">{item.description}</p>}{item.moderation_note && <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-text">Nota: {item.moderation_note}</p>}
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void download(item)} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Scarica per verificare</button>
        {item.status !== 'published' && <button type="button" disabled={busy} onClick={() => choose({ id: item.id, subject: 'resource', status: 'published', title: item.title })} className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-60">{item.status === 'pending' ? 'Approva' : 'Ripubblica'}</button>}
        {item.status === 'pending' && <button type="button" disabled={busy} onClick={() => choose({ id: item.id, subject: 'resource', status: 'rejected', title: item.title })} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Non approvare</button>}
        {item.status === 'published' && <button type="button" disabled={busy} onClick={() => choose({ id: item.id, subject: 'resource', status: 'hidden', title: item.title })} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Nascondi materiale</button>}
      </div>
    </li>)}</ul>;
  }

  return <Layout showBack backTo="/profile"><div className="flex flex-col gap-6">
    <header><h1 className="text-3xl font-semibold text-balance sm:text-4xl lg:text-6xl">Moderazione</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-text text-pretty">Verifica i materiali, le segnalazioni e le recensioni nascoste da riesaminare.</p></header>
    {checking || loading ? <p role="status" className="py-10 text-center text-text">Verifica dei permessi e caricamento…</p> : sessionError ? <CatalogError message={sessionError} retry={retrySession} /> : !session ? <section className="rounded-2xl border border-outline-variant bg-card-base p-6"><h2 className="text-xl font-semibold text-balance">Accedi con un account autorizzato</h2><p className="mt-3 text-sm text-text">Questa area è riservata ai moderatori del progetto.</p><Link to={authPageUrl('/login', location.pathname + location.search, planYear)} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas">Accedi</Link></section> : error ? <CatalogError message={error} retry={retry} /> : !isAdmin && checkedUser === userId ? <section className="rounded-2xl border border-outline-variant bg-card-base p-6"><h2 className="text-xl font-semibold text-balance">Area riservata</h2><p className="mt-3 text-sm leading-relaxed text-text">Questo account non dispone dei permessi di moderazione.</p><Link to={catalogLink('/profile', planYear)} className="mt-6 inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold">Torna al profilo</Link></section> : isAdmin && <>
      {message && <p role="status" className="rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm text-text">{message}</p>}
      {actionError && !decision && <p role="alert" className="rounded-xl border border-error/30 p-4 text-sm text-error">{actionError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text tabular-nums">{queue.resources.length} {queue.resources.length === 1 ? 'materiale caricato' : 'materiali caricati'} da verificare o riesaminare · {queue.reports.length} {queue.reports.length === 1 ? 'segnalazione caricata' : 'segnalazioni caricate'}</p><button type="button" onClick={retry} disabled={busy} className="min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold disabled:opacity-60">Aggiorna elenco</button></div>
      <section><h2 className="mb-4 text-xl font-semibold text-balance">Materiali in attesa</h2>{resourceList(resourcePages.pending.items, 'Non ci sono materiali in attesa.')}{queueNext('pending', 'Carica altri materiali in attesa')}</section>
      <section><h2 className="mb-4 text-xl font-semibold text-balance">Materiali pubblicati</h2>{resourceList(published.items, 'Non ci sono materiali pubblicati.')}{listingError('published')}{published.hasMore && <button type="button" aria-describedby={listingErrors.published ? 'listing-error-published' : undefined} disabled={busy} onClick={() => void loadMorePublished()} className="mt-4 min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold disabled:opacity-60">Carica altri materiali pubblicati</button>}</section>
      <section><h2 className="mb-4 text-xl font-semibold text-balance">Materiali nascosti o non approvati</h2><p className="mb-4 text-sm leading-relaxed text-text">Puoi riesaminare e ripubblicare un materiale se il file è ancora disponibile.</p>{resourceList(resourcePages.reconsider.items, 'Non ci sono materiali da riesaminare.')}{queueNext('reconsider', 'Carica altri materiali da riesaminare')}</section>
      <section><h2 className="mb-4 text-xl font-semibold text-balance">Recensioni segnalate</h2>{!queue.reports.length ? <p className="rounded-xl border border-outline-variant p-5 text-sm text-text">Non ci sono segnalazioni aperte.</p> : <ul className="space-y-4">{queue.reports.map(item => <li key={item.id} className="rounded-2xl border border-border-card bg-card-base p-5"><p className="text-xs text-text">{item.subject_type === 'course' ? 'Recensione corso' : 'Recensione docente'}</p><h3 className="mt-2 break-words text-lg font-semibold text-balance">{item.subject_name || 'Contenuto segnalato'}</h3><p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-text">{item.verbal_review || 'Il contenuto non è più disponibile.'}</p><div className="mt-4 rounded-xl bg-canvas p-4"><p className="text-xs font-semibold text-ink">Motivo della segnalazione</p><p className="mt-2 whitespace-pre-line break-words text-sm text-text">{item.reason}</p></div>{item.verbal_review && <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => choose({ id: item.review_id, subject: item.subject_type === 'course' ? 'course_review' : 'professor_review', status: 'published', title: item.subject_name || 'Recensione' })} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Mantieni pubblicata e chiudi</button><button type="button" disabled={busy} onClick={() => choose({ id: item.review_id, subject: item.subject_type === 'course' ? 'course_review' : 'professor_review', status: 'hidden', title: item.subject_name || 'Recensione' })} className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-60">Nascondi recensione</button></div>}</li>)}</ul>}{queueNext('reports', 'Carica altre segnalazioni')}</section>
      {(['course', 'professor'] as const).map(hiddenReviewList)}
      <p className="text-sm text-text">Le code di verifica sono ordinate dalla richiesta più vecchia. Ogni elenco carica le proprie pagine; aggiorna per includere gli ultimi cambiamenti.</p>
    </>}
    <BottomSheet open={Boolean(decision)} onClose={() => { if (!busy) setDecision(null); }} role="alertdialog" title={decision?.status === 'published' ? 'Confermare la pubblicazione?' : decision?.status === 'hidden' ? 'Nascondere il contenuto?' : 'Non approvare il materiale?'} description="La decisione viene salvata e applicata al contenuto selezionato.">
      {decision && <><p className="mb-5 break-words text-sm font-semibold">{decision.title}</p><label htmlFor="moderation-note" className="mb-2 block text-sm font-semibold">Nota per l’autore <span className="font-normal">(facoltativa)</span></label><textarea id="moderation-note" rows={3} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} disabled={busy} className="w-full rounded-xl border border-outline-variant bg-canvas p-4 text-base text-ink" />{actionError && <p role="alert" className="mt-4 text-sm text-error">{actionError}</p>}<div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => setDecision(null)} className="min-h-11 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">Annulla</button><button type="button" disabled={busy} onClick={() => void confirm()} className="min-h-11 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{busy ? 'Salvataggio…' : 'Conferma decisione'}</button></div></>}
    </BottomSheet>
  </div></Layout>;
}
