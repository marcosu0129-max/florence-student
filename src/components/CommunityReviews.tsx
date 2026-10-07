import type { SchoolContext } from '../lib/schoolCatalogTypes';
import { schoolLink } from '../lib/schoolLinks';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useAccountSession } from '../lib/useAccountSession';
import { readReviewCursorPage, type ReviewCursor, fetchReviewStats, reportReview, type ReviewStats, type ReviewSubject } from '../lib/reviewsApi';
import { createCommunityRequestScope } from '../lib/communityRequestScope';
import type { Review } from '../lib/communityStorage';
import ReviewCard from './ReviewCard';
import BottomSheet from './BottomSheet';
import { createReturnState } from '../lib/navigation';

// Retain navigation depth only, never review content or another account's data.
const rememberedPages = new Map<string, number>();
function rememberPages(key: string, pages: number) {
  rememberedPages.delete(key);
  rememberedPages.set(key, pages);
  if (rememberedPages.size > 100) rememberedPages.delete(rememberedPages.keys().next().value!);
}

export default function CommunityReviews({ subject, subjectId, schoolContext, profileYear, routeSubjectId }: { subject?: ReviewSubject; subjectId?: string; schoolContext?: SchoolContext; profileYear?: number; routeSubjectId?: string }) {
  const { planYear } = useCatalog();
  const location = useLocation();
  const navigationType = useNavigationType();
  const onward = createReturnState(location.pathname + location.search, location.state);
  const reviewLink = (route: string, year: string) => schoolContext ? schoolLink(route, { ...schoolContext, cohortYear: Number(year.slice(0, 4)) }, { profileYear }) : catalogLink(route, year);
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const viewKey = `${subject || 'all'}:${subjectId || ''}:${session?.user.id || 'guest'}`;
  const pageMemoryKey = `${location.pathname}${location.search}:${viewKey}`;
  const requests = useRef(createCommunityRequestScope()).current;
  const reportRequests = useRef(createCommunityRequestScope()).current;
  const scopeVersion = requests.update(viewKey, checking);
  const reportVersion = reportRequests.update(viewKey, checking || Boolean(sessionError));
  const identity = `${viewKey}:${scopeVersion}`;
  useEffect(() => () => { requests.dispose(); reportRequests.dispose(); }, [requests, reportRequests]);
  const [data, setData] = useState<{ identity: string; rows: Review[]; more: boolean; cursor: ReviewCursor | null; pages: number } | null>(null);
  const [stats, setStats] = useState<{ identity: string; value: ReviewStats | null } | null>(null);
  const [statsError, setStatsError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  const [report, setReport] = useState<Review | null>(null);
  const [reason, setReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reporting, setReporting] = useState(false);

  const [message, setMessage] = useState('');
  const refresh = () => { requests.invalidateReads(); setRetry(value => value + 1); };
  useEffect(() => { setReport(null); setReporting(false); setReportError(''); }, [reportVersion]);
  const rows = data?.identity === identity && !checking ? data.rows : [];
  useEffect(() => {
    if (checking) return;
    let active = true; const ticket = requests.beginRead(); const accepts = () => active && requests.acceptsRead(ticket);
    setError(''); setLoading(true); setData(null); setReport(null); setMessage('');
    setStats(null); setStatsError('');
    const pagesToRestore = navigationType === 'POP' || location.state?.restoreScroll ? rememberedPages.get(pageMemoryKey) || 1 : 1;
    (async () => {
      let cursor: ReviewCursor | null = null;
      let restored: Review[] = [];
      for (let pages = 1; pages <= pagesToRestore; pages++) {
        const page = await readReviewCursorPage({ subjectType: subject, subjectId, cursor });
        if (!accepts()) return;
        restored = [...restored, ...page.items.filter(item => !restored.some(row => row.id === item.id && row.subjectType === item.subjectType))];
        setData({ identity, rows: restored, more: page.hasMore, cursor: page.nextCursor, pages });
        rememberPages(pageMemoryKey, pages);
        if (!page.hasMore) break;
        cursor = page.nextCursor;
      }
    })().catch(reason => { if (accepts()) setError(reason.message); }).finally(() => { if (accepts()) setLoading(false); });
    if (subject && subjectId) fetchReviewStats(subject, subjectId).then(value => { if (active && requests.isCurrent(scopeVersion)) setStats({ identity, value }); }).catch(reason => { if (active && requests.isCurrent(scopeVersion)) setStatsError(reason.message); });
    return () => { active = false; };
  }, [identity, checking, retry, pageMemoryKey]);
  async function loadMore() {
    if (!data || !data.more || loading) return;
    const ticket = requests.beginOperation(true); if (!ticket) return;
    const owner = identity;
    setLoading(true); setError('');
    try {
      const page = await readReviewCursorPage({ subjectType: subject, subjectId, cursor: data.cursor });
      if (requests.acceptsOperation(ticket)) {
        rememberPages(pageMemoryKey, data.pages + 1);
        setData(previous => previous?.identity === owner ? { identity: owner, rows: [...previous.rows, ...page.items.filter(item => !previous.rows.some(row => row.id === item.id && row.subjectType === item.subjectType))], more: page.hasMore, cursor: page.nextCursor, pages: previous.pages + 1 } : previous);
      }
    } catch (reason) { if (requests.acceptsOperation(ticket)) setError(reason instanceof Error ? reason.message : 'Caricamento non riuscito.'); }
    finally { if (requests.finishOperation(ticket)) setLoading(false); }
  }
  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!report) return;
    if (reason.trim().length < 10) { setReportError('Descrivi il problema con almeno 10 caratteri.'); return; }
    const ticket = reportRequests.beginOperation(); if (!ticket) return;
    setReporting(true); setReportError('');
    try {
      await reportReview(report, reason, session?.user.id || '');
      if (reportRequests.acceptsOperation(ticket)) { setReport(null); setMessage('Segnalazione inviata al team di moderazione.'); }
    } catch (reason) { if (reportRequests.acceptsOperation(ticket)) setReportError(reason instanceof Error ? reason.message : 'Invio non riuscito.'); }
    finally { if (reportRequests.finishOperation(ticket)) setReporting(false); }
  }
  const summary = stats?.identity === identity ? stats.value : null;
  return <section className="space-y-5" aria-label="Recensioni della comunità">
    {subject && <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold text-ink text-balance">Valutazioni degli studenti</h2>{summary && <p className="mt-2 text-sm text-text tabular-nums">{Number(summary.rating).toFixed(1)} / 5 · {summary.review_count} {summary.review_count === 1 ? 'recensione' : 'recensioni'} · {subject === 'course' ? 'Didattica' : 'Media delle valutazioni'}</p>}</div><Link state={onward} to={reviewLink(`/${subject === 'course' ? 'courses' : 'professors'}/${routeSubjectId || subjectId}/review`, planYear)} className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 text-sm font-semibold">Scrivi una recensione</Link></div>}
    <p className="text-sm leading-relaxed text-text">Esperienze pubblicate dagli studenti, con il piano di riferimento indicato. Le bozze locali restano nella sezione “Le mie recensioni”.</p>
    {statsError && <p className="text-sm text-text">Statistiche non disponibili. <button type="button" className="min-h-11 underline underline-offset-4" onClick={refresh}>Riprova</button></p>}
    {message && <p role="status" className="rounded-xl border border-outline-variant p-4 text-sm">{message}</p>}
    {(error || sessionError) && <div role="alert" className="rounded-xl border border-outline-variant p-4 text-sm text-error"><p>{error || sessionError}</p><button type="button" disabled={loading} onClick={() => sessionError ? retrySession() : data ? void loadMore() : refresh()} className="mt-3 min-h-11 rounded-full border border-outline-variant px-4 text-ink disabled:opacity-50">Riprova</button></div>}
    {(loading || checking) && <p role="status" className="py-4 text-sm text-text">Caricamento recensioni…</p>}
    {!loading && !checking && !error && !rows.length && <p className="rounded-xl border border-outline-variant p-5 text-sm text-text">Non ci sono ancora recensioni pubblicate.</p>}
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">{rows.map(review => {
      const route = schoolContext && routeSubjectId ? `/${subject === 'professor' ? 'professors' : 'courses'}/${routeSubjectId}` : `/${review.subjectType === 'professor' ? 'professors' : 'courses'}/${review.subjectType === 'professor' ? review.professorId : review.courseId}`;
      return <li key={`${review.subjectType}:${review.id}`} className="min-w-0"><ReviewCard {...review} authorInitial={review.author.charAt(0).toUpperCase()} /><div className="mt-2 flex flex-wrap gap-4">{!subjectId && <Link to={catalogLink(route, review.planYear || planYear)} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">{review.subjectType === 'professor' ? 'Vai al docente' : 'Vai al corso'}</Link>}{review.isMine ? <Link state={onward} to={reviewLink(`${route}/review?review=${encodeURIComponent(review.id)}`, review.planYear || planYear)} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Modifica</Link> : session && !sessionError && <button type="button" onClick={() => { setReport(review); setReason(''); setReportError(''); setMessage(''); }} className="min-h-11 text-sm text-text underline underline-offset-4">Segnala</button>}</div></li>;
    })}</ul>
    {data?.identity === identity && data.more && <button type="button" disabled={loading || checking} onClick={loadMore} className="min-h-11 rounded-full border border-outline-variant px-5 text-sm font-semibold disabled:opacity-50">Carica altre recensioni</button>}
    <BottomSheet open={Boolean(report)} onClose={() => { if (!reportRequests.busy()) setReport(null); }} title="Segnala recensione" description="Descrivi il problema. La segnalazione sarà visibile solo al team di moderazione.">
      <form onSubmit={submitReport} className="space-y-4"><label htmlFor="review-report-reason" className="block text-sm font-semibold">Motivo della segnalazione</label><textarea id="review-report-reason" value={reason} onChange={event => setReason(event.target.value)} required minLength={10} maxLength={1000} disabled={reporting} aria-describedby="review-report-help" className="min-h-32 w-full rounded-xl border border-outline-variant bg-canvas p-4 text-ink" /><p id="review-report-help" className="text-xs text-text">Da 10 a 1000 caratteri. Non inserire dati personali di altre persone.</p>{reportError && <p role="alert" className="text-sm text-error">{reportError}</p>}<button type="submit" disabled={reporting} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-canvas disabled:opacity-50">{reporting ? 'Invio…' : 'Invia segnalazione'}</button></form>
    </BottomSheet>
  </section>;
}
