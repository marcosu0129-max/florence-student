import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { authPageUrl } from '../lib/authFlow';
import { fetchNotifications, markNotificationsRead, notificationDestination, type StudentNotification } from '../lib/notificationsApi';
import { useAccountSession } from '../lib/useAccountSession';

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-container disabled:opacity-60';
const dateFormat = new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short' });

export default function Notifications() {
  const { planYear } = useCatalog();
  const location = useLocation();
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const userId = session?.user.id;
  const userRef = useRef(userId);
  userRef.current = userId;
  const mounted = useRef(true);
  const generation = useRef(0);
  const markBusy = useRef(false);
  const moreBusy = useRef(false);
  const [ownerId, setOwnerId] = useState<string | undefined>();
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [moreError, setMoreError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [marking, setMarking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
  const [message, setMessage] = useState('');
  const visibleItems = ownerId === userId ? items : [];
  const unreadCount = visibleItems.filter(item => !item.readAt).length;
  const fetching = loading || (!!userId && ownerId !== userId);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const current = ++generation.current;
    setItems([]); setOwnerId(userId); setHasMore(false); setNextOffset(0); setError(''); setMoreError(''); setActionError(null); setMessage('');
    setLoadingMore(false); moreBusy.current = false;
    if (checking || !userId) { setLoading(false); return; }
    setLoading(true);
    fetchNotifications().then(page => {
      if (!mounted.current || current !== generation.current || userRef.current !== userId) return;
      setItems(page.items); setHasMore(page.hasMore); setNextOffset(page.items.length);
    }).catch(reason => {
      if (mounted.current && current === generation.current && userRef.current === userId) setError(reason instanceof Error ? reason.message : 'Impossibile caricare le notifiche. Riprova.');
    }).finally(() => { if (mounted.current && current === generation.current) setLoading(false); });
    return () => { generation.current += 1; };
  }, [userId, checking, attempt]);

  async function loadMore() {
    if (moreBusy.current || markBusy.current || fetching || !hasMore || !userId) return;
    moreBusy.current = true; setLoadingMore(true); setMoreError('');
    const current = generation.current;
    try {
      const page = await fetchNotifications(nextOffset);
      if (!mounted.current || current !== generation.current || userRef.current !== userId) return;
      setItems(previous => { const known = new Set(previous.map(item => item.id)); return [...previous, ...page.items.filter(item => !known.has(item.id))]; });
      setHasMore(page.hasMore);
      setNextOffset(nextOffset + page.items.length);
    } catch (reason) {
      if (mounted.current && current === generation.current && userRef.current === userId) setMoreError(reason instanceof Error ? reason.message : 'Impossibile caricare altre notifiche. Riprova.');
    } finally {
      if (current === generation.current) { moreBusy.current = false; if (mounted.current) setLoadingMore(false); }
    }
  }

  async function markRead(id: string | null) {
    if (markBusy.current || moreBusy.current || fetching || !userId) return;
    const current = generation.current;
    const actionId = id || 'all';
    markBusy.current = true; setMarking(actionId); setActionError(null); setMessage('');
    try {
      const count = await markNotificationsRead(id ? [id] : null, userId);
      if (!mounted.current || current !== generation.current || userRef.current !== userId) return;
      const confirmedAt = new Date().toISOString();
      setItems(previous => previous.map(item => !item.readAt && (!id || item.id === id) ? { ...item, readAt: confirmedAt } : item));
      setMessage(count === 0 ? 'Le notifiche selezionate risultano già lette.' : count === 1 ? 'Notifica segnata come letta.' : `${count} notifiche segnate come lette.`);
    } catch (reason) {
      if (mounted.current && current === generation.current && userRef.current === userId) setActionError({ id: actionId, message: reason instanceof Error ? reason.message : 'Aggiornamento non riuscito. Riprova.' });
    } finally { markBusy.current = false; if (mounted.current) setMarking(null); }
  }

  return (
    <Layout showBack backTo={catalogLink('/profile', planYear)}>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-semibold text-ink text-balance">Notifiche</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text text-pretty">Gli aggiornamenti sui tuoi corsi salvati e sui contenuti che hai condiviso.</p>
        </header>
        {checking ? <p role="status" className="py-8 text-sm text-text">Verifica accesso…</p> : sessionError ? <section role="alert" className="rounded-2xl border border-outline-variant p-6"><p className="text-sm text-error">{sessionError}</p><button type="button" onClick={retrySession} className={`${buttonClass} mt-4`}>Riprova verifica</button></section> : !session ? <section aria-labelledby="notifications-signin" className="rounded-2xl border border-border-card bg-card-base p-6 sm:p-8"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-canvas"><Icon name="notifications" size={24} /></div><h2 id="notifications-signin" className="text-xl font-semibold text-ink text-balance">Le tue notifiche, nel tuo account</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-text text-pretty">Accedi per vedere gli aggiornamenti riservati a te.</p><Link to={authPageUrl('/login', location.pathname + location.search, planYear)} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas"><span className="min-w-0">Accedi alle notifiche</span><Icon name="arrow_forward" size={20} /></Link></section> : <>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setAttempt(value => value + 1)} disabled={fetching || loadingMore || !!marking} className={buttonClass}>Aggiorna</button>
            <button type="button" onClick={() => markRead(null)} disabled={fetching || loadingMore || !!marking || (!hasMore && unreadCount === 0)} className={buttonClass}>{marking === 'all' ? 'Aggiornamento…' : 'Segna tutte come lette'}</button>
            {!fetching && !error && visibleItems.length > 0 && <p className="text-sm text-text tabular-nums">{unreadCount} non lett{unreadCount === 1 ? 'a' : 'e'} in elenco</p>}
          </div>
          {message && <p role="status" className="text-sm text-text">{message}</p>}
          {actionError?.id === 'all' && <p role="alert" className="text-sm text-error">{actionError.message}</p>}
          {fetching ? <p role="status" className="py-8 text-sm text-text">Caricamento notifiche…</p> : error ? <section role="alert" className="rounded-2xl border border-outline-variant p-6"><p className="text-sm leading-relaxed text-error">{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)} className={`${buttonClass} mt-4`}>Riprova</button></section> : visibleItems.length === 0 ? <section aria-labelledby="notifications-empty" className="rounded-2xl border border-border-card bg-card-base p-6 sm:p-8"><div className="mb-5 flex size-12 items-center justify-center rounded-full bg-canvas"><Icon name="notifications_none" size={24} /></div><h2 id="notifications-empty" className="text-xl font-semibold text-ink text-balance">Nessuna notifica per ora</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-text text-pretty">Qui compariranno nuovi contenuti dei corsi che segui e gli esiti delle verifiche sui tuoi materiali e recensioni.</p><Link to={catalogLink('/profile/saved', planYear)} className={`${buttonClass} mt-6`}>Apri i corsi salvati<Icon name="arrow_forward" size={20} /></Link></section> : <ul className="flex flex-col gap-4" aria-label="Le tue notifiche">
            {visibleItems.map(item => <li key={item.id} className={`rounded-2xl border p-5 sm:p-6 ${item.readAt ? 'border-border-card bg-canvas' : 'border-outline-variant bg-card-base'}`}><article aria-labelledby={`notification-${item.id}`}>
              <div className="flex items-start gap-3"><div className="mt-0.5 shrink-0"><Icon name={item.entityType === 'resource' ? 'folder_open' : item.type === 'moderation' ? 'info' : 'notifications'} size={20} /></div><div className="min-w-0 flex-1"><h2 id={`notification-${item.id}`} className="text-base font-semibold text-ink text-balance" style={{ lineHeight: '24px' }}>{item.title || 'Aggiornamento'}</h2><p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-text text-pretty">{item.body}</p></div></div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text"><time dateTime={item.createdAt}>{dateFormat.format(new Date(item.createdAt))}</time><span className="rounded-full border border-outline-variant px-2.5 py-1">{item.readAt ? 'Letta' : 'Non letta'}</span></div>
              <div className="mt-4 flex flex-wrap items-center gap-3"><Link to={notificationDestination(item, planYear)} className={buttonClass}><span className="min-w-0">Apri aggiornamento</span><Icon name="arrow_forward" size={18} /></Link>{!item.readAt && <button type="button" onClick={() => markRead(item.id)} disabled={loadingMore || !!marking} className={buttonClass}>{marking === item.id ? 'Aggiornamento…' : 'Segna come letta'}</button>}</div>
              {actionError?.id === item.id && <p role="alert" className="mt-3 text-sm text-error">{actionError.message}</p>}
            </article></li>)}
          </ul>}
          {moreError && <p role="alert" className="text-sm text-error">{moreError}</p>}
          {hasMore && !fetching && !error && <button type="button" onClick={loadMore} disabled={loadingMore || !!marking} className={`${buttonClass} self-start`}>{loadingMore ? 'Caricamento…' : moreError ? 'Riprova caricamento' : 'Carica altre notifiche'}</button>}
        </>}
      </div>
    </Layout>
  );
}
