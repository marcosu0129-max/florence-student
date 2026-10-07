import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import Layout from '../components/Layout';
import BottomSheet from '../components/BottomSheet';
import ReviewCard from '../components/ReviewCard';
import { fetchUserReviews, deleteDemoReview } from '../lib/dataService';
import { useAccountSession } from '../lib/useAccountSession';
import { reviewActivitySummary } from '../lib/reviewActivitySummary';
import { createCommunityRequestScope } from '../lib/communityRequestScope';
import { deleteCloudReview } from '../lib/reviewsApi';
import { useReviewList } from '../lib/useReviewList';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { createReturnState } from '../lib/navigation';
import { reviewKey } from '../lib/reviewIdentity';

export default function MyReviews() {
  const location = useLocation();
  const onward = createReturnState(location.pathname + location.search, location.state);
  const { planYear } = useCatalog();
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const ownerKey = session?.user.id || 'guest';
  const requests = useRef(createCommunityRequestScope()).current;
  const scopeVersion = requests.update(ownerKey, checking || Boolean(sessionError));
  useEffect(() => () => requests.dispose(), [requests]);
  const { reviews, setReviews, loading, error, reload } = useReviewList(fetchUserReviews, planYear, `${ownerKey}:${scopeVersion}`, !checking && !sessionError);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const activity = reviewActivitySummary(reviews);
  const pendingReview = reviews.find(review => reviewKey(review) === pendingDelete);

  useEffect(() => { setPendingDelete(null); setDeleteError(''); setMessage(''); setDeleting(false); }, [scopeVersion]);
  useEffect(() => { if (message) headingRef.current?.focus(); }, [message]);
  async function handleDelete() {
    if (!pendingReview) return;
    const ticket = requests.beginOperation(); if (!ticket) return;
    const owner = ownerKey;
    setDeleting(true);
    try {
      if (pendingReview.isDemo) deleteDemoReview(pendingReview.id, pendingReview.subjectType || 'course');
      else await deleteCloudReview(pendingReview, owner);
      if (!requests.acceptsOperation(ticket)) return;
      setReviews(current => current.filter(review => reviewKey(review) !== reviewKey(pendingReview)));
      setPendingDelete(null);
      setDeleteError('');
      setMessage(pendingReview.isDemo ? 'La bozza è stata eliminata da questo browser.' : 'La recensione è stata eliminata dal tuo account.');
    } catch (reason) {
      if (requests.acceptsOperation(ticket)) setDeleteError(reason instanceof Error ? reason.message : 'Eliminazione non riuscita. Riprova.');
    } finally { if (requests.finishOperation(ticket)) setDeleting(false); }
  }

  return <Layout showBack backTo={catalogLink('/profile', planYear)}>
    <div className="flex flex-col gap-6 pb-8">
      <header><h1 ref={headingRef} tabIndex={-1} className="text-3xl font-semibold text-ink text-balance sm:text-4xl">Le mie recensioni</h1><p className="mt-3 text-sm leading-relaxed text-text text-pretty">Gestisci le recensioni del tuo account e le bozze private di questo browser. Le bozze vengono pubblicate solo quando lo scegli nel modulo.</p>{!loading && <div className="mt-3 space-y-1 text-sm text-text tabular-nums">{session && <p>{error ? 'Conteggio delle recensioni nell’account non disponibile.' : <>{activity.account} recension{activity.account === 1 ? 'e' : 'i'} nell’account · {activity.published} {activity.published === 1 ? 'pubblicata' : 'pubblicate'} · {activity.hidden} {activity.hidden === 1 ? 'nascosta' : 'nascoste'}{activity.other > 0 ? ` · ${activity.other} con stato da verificare` : ''}</>}</p>}<p>{activity.localDrafts} {activity.localDrafts === 1 ? 'bozza privata' : 'bozze private'} in questo browser · {activity.localDrafts === 1 ? 'non pubblicata' : 'non pubblicate'}</p></div>}</header>
      {message && <p role="status" className="rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm text-text">{message}</p>}
      {sessionError && <div role="alert" className="text-sm text-error"><p>{sessionError}</p><button type="button" onClick={retrySession} className="min-h-11 underline">Riprova accesso</button></div>}
      {error && <div role="alert" className="rounded-xl border border-outline-variant bg-canvas-soft p-4"><p className="text-sm leading-relaxed text-text">{error}</p><button type="button" onClick={reload} disabled={loading} className="mt-3 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Riprova</button></div>}
      {loading ? <p role="status" className="py-12 text-center text-sm text-text">Caricamento recensioni…</p> : reviews.length === 0 ? <section className="rounded-xl border border-outline-variant p-6 text-center"><h2 className="text-xl font-semibold text-ink text-balance">{error ? 'Nessuna bozza locale disponibile' : session ? 'Nessuna recensione e nessuna bozza' : 'Nessuna bozza privata'}</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text text-pretty">{error ? 'Le recensioni online non sono verificabili al momento. Non ci sono bozze salvate in questo browser.' : session ? 'Non hai ancora recensioni nell’account o bozze private salvate in questo browser.' : 'Le bozze che prepari e salvi su questo dispositivo compariranno qui. Restano private finché scegli di pubblicarle.'}</p><Link to={catalogLink('/courses', planYear)} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas">Esplora i corsi</Link></section> : <ul className="flex flex-col gap-6">{reviews.map(review => {
        const isProfessor = review.subjectType === 'professor';
        const subjectId = isProfessor ? review.professorId : review.courseId;
        const isLocal = review.isDemo || review.id.startsWith('demo-');
        return <li key={reviewKey(review)} className="min-w-0"><ReviewCard {...review} authorInitial={review.author?.charAt(0).toUpperCase() || 'S'} /><div className="mt-2 flex flex-wrap gap-3">{subjectId && <Link state={onward} to={catalogLink(`/${isProfessor ? 'professors' : 'courses'}/${subjectId}`, review.planYear || planYear)} className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-ink">{isProfessor ? 'Vai al docente' : 'Vai al corso'}</Link>}{subjectId && <Link state={onward} to={catalogLink(`/${isProfessor ? 'professors' : 'courses'}/${subjectId}/review?${isLocal ? 'draft' : 'review'}=${encodeURIComponent(review.id)}`, review.planYear || planYear)} className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-ink">{isLocal ? 'Apri bozza / pubblica' : 'Modifica recensione'}</Link>}{(isLocal || review.isMine) && <button type="button" onClick={() => { setMessage(''); setDeleteError(''); setPendingDelete(reviewKey(review)); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold text-ink" aria-label={`Elimina ${isLocal ? 'la bozza' : 'la recensione'}${review.courseName ? `: ${review.courseName}` : ''}`}><Icon name="delete" size={18} />{isLocal ? 'Elimina bozza' : 'Elimina recensione'}</button>}</div>{review.status === 'hidden' && <p className="mt-3 text-xs leading-relaxed text-text">Recensione nascosta dalla moderazione. Una modifica non la rende automaticamente pubblica.</p>}</li>;
      })}</ul>}
    </div>
    <BottomSheet open={Boolean(pendingReview)} onClose={() => { if (!requests.busy()) { setPendingDelete(null); setDeleteError(''); } }} role="alertdialog" title={pendingReview?.isDemo ? 'Eliminare la bozza?' : 'Eliminare la recensione?'} description={pendingReview?.isDemo ? 'La bozza sarà rimossa da questo browser. Questa azione non può essere annullata.' : 'La recensione sarà rimossa dalla comunità e dal tuo account. Questa azione non può essere annullata.'}>
      {pendingReview?.courseName && <p className="mb-4 text-sm font-semibold text-ink">{pendingReview.courseName}</p>}
      {deleteError && <div className="mb-4"><p role="alert" className="text-sm text-error">{deleteError}</p><button type="button" disabled={deleting} onClick={() => { setPendingDelete(null); setDeleteError(''); reload(); }} className="mt-2 min-h-11 text-sm underline underline-offset-4">Aggiorna elenco</button></div>}
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setPendingDelete(null)} disabled={deleting} className="min-h-11 flex-1 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold text-ink">Annulla</button><button type="button" onClick={handleDelete} disabled={deleting} className="min-h-11 flex-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas">{deleting ? 'Eliminazione…' : 'Elimina'}</button></div>
    </BottomSheet>
  </Layout>;
}
