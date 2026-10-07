import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import AdminAccessLink from '../components/AdminAccessLink';
import FilterSelect from '../components/FilterSelect';
import BottomSheet from '../components/BottomSheet';
import { fetchUserReviews } from '../lib/dataService';
import { reviewActivitySummary } from '../lib/reviewActivitySummary';
import { getLocalProfile } from '../lib/localProfile';
import { useStudentProfile } from '../lib/useStudentProfile';
import { useSavedCourses } from '../lib/useSavedCourses';
import { supabase } from '../lib/supabase';
import { AuthRequestTimeout } from '../lib/authFlow';
import { useAuthAction } from '../lib/useAuthAction';

const FACULTIES = [
  'Scuola di Studi Umanistici e della Formazione',
  'Facoltà di Economia',
  'Facoltà di Giurisprudenza',
  'Facoltà di Scienze Politiche',
  'Facoltà di Ingegneria',
  'Facoltà di Scienze Matematiche, Fisiche e Naturali',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 22 }, (_, i) => String(currentYear - i));
const pillClass = 'inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 bg-card-base rounded-full border border-outline-variant shadow-card hover:bg-surface-container transition-colors duration-150 text-ink';
const inputClass = 'w-full bg-canvas border border-outline-variant rounded-xl px-4 py-3 text-base text-ink';

export default function Profile() {
  const navigate = useNavigate();
  const { planYear } = useCatalog();
  const [searchParams, setSearchParams] = useSearchParams();
  const account = useStudentProfile();
  const { session, checking, profile } = account;
  const showProfile = account.ready && !account.error;
  const ownerKey = session?.user.id || 'guest';
  const ownerRef = useRef(account.version); ownerRef.current = account.version;
  const [draftOwner, setDraftOwner] = useState(ownerKey);
  const saved = useSavedCourses();
  const [draft, setDraft] = useState(profile);
  const [reviewStats, setReviewStats] = useState<{ version: number; summary: ReturnType<typeof reviewActivitySummary> } | null>(null);
  const activity = !checking && reviewStats?.version === account.version ? reviewStats.summary : null;
  const reviewCount = activity ? session ? activity.account : activity.localDrafts : null;
  const [activityError, setActivityError] = useState('');
  const [activityRetry, setActivityRetry] = useState(0);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const logoutAction = useAuthAction();
  const loggingOut = Boolean(logoutAction.pending);

  useEffect(() => {
    if (checking) return;
    let active = true;
    setActivityError('');
    setReviewStats(null);
    const timeout = window.setTimeout(() => {
      if (active) setActivityError('Il caricamento delle recensioni sta impiegando troppo tempo. Riprova.');
    }, 10000);
    fetchUserReviews().then((reviews) => {
      if (!active) return;
      window.clearTimeout(timeout);
      setActivityError('');
      setReviewStats({ version: account.version, summary: reviewActivitySummary(reviews) });
    }).catch(() => {
      if (!active) return;
      window.clearTimeout(timeout);
      setActivityError('Non è stato possibile caricare le recensioni.');
    });
    return () => { active = false; window.clearTimeout(timeout); };
  }, [activityRetry, account.version, checking]);

  useEffect(() => {
    setEditSheetOpen(false); setSaveError(''); setMessage(''); setLogoutError('');
  }, [account.version]);

  useEffect(() => {
    if (searchParams.get('edit') !== '1' || !account.ready) return;
    setDraft(profile);
    setDraftOwner(ownerKey);
    setEditSheetOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, account.ready, profile]);

  function openEditor() {
    setDraft(profile);
    setDraftOwner(ownerKey);
    setSaveError('');
    setMessage('');
    setEditSheetOpen(true);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (draftOwner !== ownerKey || !account.ready) { setSaveError('L’account è cambiato. Riapri il profilo.'); return; }
    const owner = account.version;
    if (!draft.name.trim()) { setSaveError('Inserisci un nome.'); return; }
    try {
      const next = { ...draft, name: draft.name.trim() };
      await account.save(next);
      if (ownerRef.current !== owner) return;
      setEditSheetOpen(false);
      setMessage(account.cloud ? 'Profilo sincronizzato con il tuo account.' : 'Profilo salvato su questo dispositivo.');
    } catch (reason) { if (ownerRef.current === owner) setSaveError(reason instanceof Error ? reason.message : 'Salvataggio non riuscito. Riprova.'); }
  }

  async function logout() {
    if (loggingOut) return;
    setLogoutError('');
    try {
      await logoutAction.run('logout', async () => {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (!logoutAction.isMounted()) return;
        if (error) { setLogoutError('Uscita non riuscita. Controlla la connessione e riprova.'); return; }
        // Handle the real completion even if the feedback deadline has elapsed.
        navigate(catalogLink('/login', planYear), { replace: true });
      });
    } catch (reason) {
      if (logoutAction.isMounted()) setLogoutError(reason instanceof AuthRequestTimeout
        ? 'Uscita non ancora confermata. Il servizio sta impiegando più tempo del previsto: la richiesta è ancora in corso. Attendi l’esito prima di lasciare il dispositivo.'
        : 'Uscita non riuscita. Controlla la connessione e riprova.');
    }
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 md:gap-12">
        <section className="flex flex-col items-center text-center">
          <div className="size-20 rounded-full bg-surface-container flex items-center justify-center mb-4 shadow-card" aria-hidden="true">
            {showProfile ? <span className="text-4xl font-black text-ink">{profile.name.charAt(0).toUpperCase()}</span> : <Icon name="person" size={32} />}
          </div>
          <h1 className="font-h1-editorial text-3xl sm:text-4xl md:text-5xl text-ink leading-tight mb-2 break-words max-w-full text-balance">{showProfile ? profile.name : 'Il tuo profilo'}</h1>
          {showProfile && <>
            <p className="font-body-main text-text mb-1 text-pretty">{profile.faculty}</p>
            <p className="font-body-main text-text mb-3">Iscritto {profile.year}</p>
          </>}
          <p className="text-sm text-text mb-5">{account.loading ? 'Caricamento del profilo…' : !showProfile ? 'I dati del profilo non sono disponibili. Riprova il caricamento.' : account.cloud ? 'Profilo e preferenze sincronizzati con il tuo account.' : 'Profilo ospite salvato su questo dispositivo. Accedi per sincronizzarlo.'}</p>
          <button onClick={openEditor} disabled={!account.ready} className="min-h-11 px-6 py-2.5 bg-ink text-canvas text-sm font-semibold rounded-full hover:bg-ink-soft transition-colors duration-150 shadow-card disabled:opacity-50">Modifica profilo</button>
          {account.error && <div role="alert" className="mt-3 text-sm text-error">{account.error}<button type="button" onClick={account.retry} className="min-h-11 px-3 underline">Riprova profilo</button></div>}
          <p role="status" className="mt-3 min-h-5 text-sm text-text">{message}</p>
        </section>

        <section aria-label="La tua attività" className="grid grid-cols-2 gap-4 sm:gap-6">
          <Link to={catalogLink('/profile/saved', planYear)} className="bg-card-base border border-border-card rounded-xl p-5 text-center shadow-card hover:bg-surface-container transition-colors duration-150">
            <div className="font-data-display text-4xl sm:text-5xl tabular-nums text-ink leading-none mb-2">{saved.loading || saved.error ? '—' : saved.savedIds.length}</div>
            <p className="font-body-main text-text">{saved.savedIds.length === 1 ? 'Corso salvato' : 'Corsi salvati'}</p>
          </Link>
          <Link to={catalogLink('/my-reviews', planYear)} className="bg-card-base border border-border-card rounded-xl p-5 text-center shadow-card hover:bg-surface-container transition-colors duration-150">
            <div className="font-data-display text-4xl sm:text-5xl tabular-nums text-ink leading-none mb-2">{reviewCount ?? '—'}</div>
            <p className="font-body-main text-text">{checking ? 'Recensioni e bozze' : session ? (reviewCount === 1 ? 'Recensione nell’account' : 'Recensioni nell’account') : (reviewCount === 1 ? 'Bozza privata' : 'Bozze private')}</p>
            {!checking && !session && <p className="mt-2 text-xs leading-relaxed text-text">Solo su questo dispositivo · {reviewCount === 1 ? 'non pubblicata' : 'non pubblicate'}</p>}
            {session && activity && <div className="mt-2 space-y-1 text-xs leading-relaxed text-text">
              <p>{activity.published} {activity.published === 1 ? 'pubblicata' : 'pubblicate'}{activity.hidden > 0 ? ` · ${activity.hidden} ${activity.hidden === 1 ? 'nascosta' : 'nascoste'}` : ''}{activity.other > 0 ? ` · ${activity.other} con stato da verificare` : ''}</p>
              {activity.localDrafts > 0 && <p>{activity.localDrafts} {activity.localDrafts === 1 ? 'bozza privata' : 'bozze private'} su questo dispositivo · {activity.localDrafts === 1 ? 'non pubblicata' : 'non pubblicate'}</p>}
            </div>}
            {reviewCount === null && !activityError && <span className="text-xs text-text" role="status">Caricamento…</span>}
          </Link>
        </section>
        {saved.error && <div role="alert" className="text-sm text-error">{saved.error} <button type="button" onClick={saved.retry} disabled={saved.loading} className="underline min-h-11 px-2 disabled:opacity-50">Riprova corsi salvati</button></div>}
        {activityError && <div role="alert" className="text-sm text-error">{activityError} <button type="button" onClick={() => setActivityRetry((v) => v + 1)} className="underline min-h-11 px-2">Riprova recensioni</button></div>}

        <section className="flex flex-col gap-8 text-center">
          <div>
            <h2 className="font-h2-section text-xl text-ink mb-4 text-balance">Comunità</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={catalogLink('/notifications', planYear)} className={pillClass}><Icon name="notifications" size={20} /><span className="min-w-0 text-left">Notifiche</span></Link>
              <Link to={catalogLink('/materials', planYear)} className={pillClass}><Icon name="folder_open" size={20} /><span className="min-w-0 text-left">Centro materiali</span></Link>
            </div>
          </div>
          <div>
            <h2 className="font-h2-section text-xl text-ink mb-4 text-balance">Impostazioni</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={catalogLink('/profile/settings', planYear)} className={pillClass}><Icon name="tune" size={20} /><span className="min-w-0 text-left">Preferenze</span></Link>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-text text-sm">Lingua: Italiano</span>
              <AdminAccessLink userId={session?.user.id} checking={checking} className={pillClass} />
            </div>
          </div>
          <div>
            <h2 className="font-h2-section text-xl text-ink mb-4 text-balance">Info</h2>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to={catalogLink('/profile/about', planYear)} className={pillClass}><Icon name="info" size={20} /><span className="min-w-0 text-left">Chi siamo</span></Link>
              <button onClick={() => setPrivacyOpen(true)} className={pillClass}><Icon name="shield" size={20} /><span className="min-w-0 text-left">Dati e privacy</span></button>
              <a href="https://instagram.com/sumarcoooo" target="_blank" rel="noopener noreferrer" className={pillClass}><Icon name="open_in_new" size={20} /><span className="min-w-0 text-left">Contattaci<span className="sr-only"> (nuova scheda)</span></span></a>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {checking ? <p role="status" className="text-sm text-text text-center">Verifica accesso…</p> : session ? <>
            <p className="text-sm text-text text-center break-all">Accesso effettuato: {session.user.email || 'account collegato'}</p>
            <button onClick={logout} disabled={loggingOut} className={`${pillClass} py-4 disabled:opacity-60`}><Icon name="logout" size={20} /><span className="min-w-0 text-left">{loggingOut ? 'Uscita in corso…' : 'Esci su questo dispositivo'}</span></button>
          </> : <Link to={catalogLink('/login', planYear)} className={pillClass}>Accedi / Registrati</Link>}
          {logoutError && <p role="alert" className="text-error text-sm">{logoutError}</p>}
        </div>
      </div>

      <BottomSheet open={editSheetOpen && draftOwner === ownerKey && !checking} onClose={() => { if (!account.saving) setEditSheetOpen(false); }} title="Modifica profilo">
        <form onSubmit={saveProfile} className="flex flex-col gap-5">
          <p className="text-sm text-text">{account.cloud ? 'Le modifiche saranno salvate nel tuo account.' : 'Queste informazioni restano in questo browser.'}</p>
          {account.cloud && <button type="button" disabled={account.saving} onClick={() => setDraft(getLocalProfile())} className="min-h-11 self-start text-sm underline">Usa il profilo ospite di questo dispositivo</button>}
          <div><label htmlFor="profile-name" className="block text-sm font-semibold text-ink mb-2">Nome</label><input id="profile-name" name="name" autoComplete="nickname" disabled={account.saving} required maxLength={60} value={draft.name} onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setSaveError(''); }} aria-invalid={!!saveError} aria-describedby={saveError ? 'profile-save-error' : undefined} className={inputClass} /></div>
          <FilterSelect label="Scuola / facoltà" value={draft.faculty} disabled={account.saving} onValueChange={faculty => setDraft({ ...draft, faculty })} options={Array.from(new Set([draft.faculty, ...FACULTIES])).map(value => ({ value, label: value }))} />
          <FilterSelect label="Anno di immatricolazione" value={draft.year} disabled={account.saving} onValueChange={year => setDraft({ ...draft, year })} options={Array.from(new Set([draft.year, ...YEARS])).sort().reverse().map(value => ({ value, label: value }))} />
          {saveError && <p id="profile-save-error" role="alert" className="text-error text-sm">{saveError}</p>}
          <div className="flex gap-3"><button type="button" disabled={account.saving} onClick={() => setEditSheetOpen(false)} className={`${pillClass} flex-1 disabled:opacity-50`}>Annulla</button><button type="submit" disabled={account.saving} className="flex-1 min-h-11 bg-ink text-canvas font-semibold py-3 rounded-full hover:bg-ink-soft transition-colors duration-150 disabled:opacity-50">{account.saving ? 'Salvataggio…' : 'Salva'}</button></div>
        </form>
      </BottomSheet>
      <BottomSheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Dati e privacy">
        <div className="space-y-4 text-text text-sm leading-relaxed">
          <p>Quando accedi, profilo, preferenze e corsi salvati sono associati al tuo account. Gli altri studenti non possono leggere il tuo profilo privato o i tuoi preferiti.</p>
          <p>Il profilo ospite, i preferiti e le prove di recensione locali restano su questo dispositivo. Non vengono pubblicati automaticamente. Cancellare i dati del sito nel browser elimina solo questa copia locale.</p>
          <button onClick={() => setPrivacyOpen(false)} className={`${pillClass} w-full`}>Ho capito</button>
        </div>
      </BottomSheet>
    </Layout>
  );
}
