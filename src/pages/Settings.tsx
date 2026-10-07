import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStudentProfile } from '../lib/useStudentProfile';
import { supabase } from '../lib/supabase';
import { useAuthAction } from '../lib/useAuthAction';
import { AuthRequestTimeout } from '../lib/authFlow';

export default function Settings() {
  const navigate = useNavigate();
  const { planYear } = useCatalog();
  const account = useStudentProfile();
  const { session, checking, profile, preferences } = account;
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const logoutAction = useAuthAction();
  const loggingOut = Boolean(logoutAction.pending);
  const versionRef = useRef(account.version); versionRef.current = account.version;
  useEffect(() => { setError(''); setMessage(''); }, [account.version]);

  async function changePreference(key: keyof typeof preferences, value: boolean) {
    const version = account.version;
    setError(''); setMessage('');
    try {
      await account.save(profile, { ...preferences, [key]: value });
      if (versionRef.current !== version) return;
      setMessage(account.cloud ? 'Preferenza sincronizzata con il tuo account.' : 'Preferenza salvata su questo dispositivo.');
    } catch (reason) { if (versionRef.current === version) setError(reason instanceof Error ? reason.message : 'Salvataggio non riuscito. Riprova.'); }
  }

  async function logout() {
    if (loggingOut) return;
    setError(''); setMessage('');
    try {
      await logoutAction.run('logout', async () => {
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (!logoutAction.isMounted()) return;
        if (signOutError) { setError('Uscita non riuscita. Controlla la connessione e riprova.'); return; }
        // Handle the real completion even after the feedback deadline elapsed.
        navigate(catalogLink('/login', planYear), { replace: true });
      });
    } catch (reason) {
      if (logoutAction.isMounted()) setError(reason instanceof AuthRequestTimeout
        ? 'Uscita non ancora confermata. Il servizio sta impiegando più tempo del previsto: la richiesta è ancora in corso. Attendi l’esito prima di lasciare il dispositivo.'
        : 'Uscita non riuscita. Controlla la connessione e riprova.');
    }
  }

  return (
    <Layout showBack backTo={catalogLink('/profile', planYear)}>
      <div className="flex flex-col gap-8">
        <h1 className="font-h1-editorial text-3xl sm:text-4xl md:text-5xl text-ink text-balance">Impostazioni</h1>
        <section aria-label="Profilo" className="bg-card-base rounded-xl p-6 shadow-card border border-border-card">
          <div className="flex items-center gap-4 mb-5">
            <div className="size-16 rounded-full bg-surface-container flex items-center justify-center shrink-0" aria-hidden="true"><span className="text-3xl font-bold text-ink">{profile.name.charAt(0).toUpperCase()}</span></div>
            <div className="min-w-0"><h2 className="font-card-title text-xl text-ink break-words text-balance">{profile.name}</h2><p className="text-text text-sm mt-1">{account.cloud ? 'Profilo sincronizzato con il tuo account' : 'Profilo su questo dispositivo'}</p></div>
          </div>
          <Link to={catalogLink('/profile?edit=1', planYear)} className="flex min-h-11 items-center justify-center w-full py-3 px-4 bg-ink text-canvas text-sm font-semibold rounded-full hover:bg-ink-soft transition-colors duration-150">Modifica profilo</Link>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-h2-section text-xl text-ink text-balance">Preferenze</h2>
          <label className="flex items-center justify-between gap-4 p-5 bg-card-base rounded-xl border border-border-card cursor-pointer">
            <span><span className="block font-semibold text-ink">Recensioni anonime per impostazione predefinita</span><span id="anonymous-help" className="block text-sm text-text mt-1 text-pretty">Valore iniziale per le nuove recensioni. Puoi cambiarlo prima di pubblicare.</span></span>
            <input type="checkbox" className="size-5 shrink-0 accent-ink" checked={preferences.anonymousReviews} disabled={!account.ready || account.saving} onChange={(e) => changePreference('anonymousReviews', e.target.checked)} aria-describedby="anonymous-help" />
          </label>
          <p role="status" className="min-h-5 text-sm text-text">{message}</p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-h2-section text-xl text-ink text-balance">Notifiche</h2>
          <p className="text-sm leading-relaxed text-text">Ricevi aggiornamenti in Florence Student sui corsi salvati. {account.cloud ? 'Le preferenze sono sincronizzate con il tuo account.' : 'Accedi per attivare le notifiche.'}</p>
          {([{ key: 'notifyReviews', title: 'Nuove recensioni', help: 'Quando viene pubblicata una recensione per un corso salvato.' }, { key: 'notifyMaterials', title: 'Nuovi materiali', help: 'Quando viene approvato un materiale per un corso salvato.' }] as const).map(item => <label key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-border-card bg-card-base p-5"><span className="min-w-0"><span className="block font-semibold text-ink">{item.title}</span><span id={`${item.key}-help`} className="mt-1 block text-sm text-text">{item.help}</span></span><input type="checkbox" className="size-5 shrink-0 accent-ink" aria-describedby={`${item.key}-help`} checked={preferences[item.key]} disabled={!account.cloud || !account.ready || account.saving} onChange={event => changePreference(item.key, event.target.checked)} /></label>)}
          {account.cloud && <Link to={catalogLink('/notifications', planYear)} className="self-start text-sm font-semibold underline underline-offset-4">Apri notifiche</Link>}

        </section>

        <Link to={catalogLink('/profile/about', planYear)} className="flex items-center justify-between gap-4 p-5 bg-card-base rounded-xl border border-border-card hover:bg-surface-container transition-colors duration-150"><span className="min-w-0 font-semibold text-ink">Info su Florence Student</span><Icon name="chevron_right" size={20} className="text-ink" /></Link>
        {checking ? <p role="status" className="text-sm text-text">Verifica accesso…</p> : session ? <button onClick={logout} disabled={loggingOut} className="min-h-11 py-4 px-5 bg-card-base text-ink font-semibold rounded-full border border-outline-variant hover:bg-surface-container transition-colors duration-150 disabled:opacity-60">{loggingOut ? 'Uscita in corso…' : 'Esci su questo dispositivo'}</button> : <Link to={catalogLink('/login', planYear)} className="min-h-11 py-4 px-5 bg-ink text-canvas text-center font-semibold rounded-full hover:bg-ink-soft transition-colors duration-150">Accedi / Registrati</Link>}
        {account.loading && <p role="status" className="text-sm text-text">Caricamento preferenze…</p>}{account.saving && <p role="status" className="text-sm text-text">Salvataggio preferenza…</p>}{(error || account.error) && <div role="alert" className="text-error text-sm"><p>{error || account.error}</p>{account.error && <button type="button" onClick={account.retry} className="mt-3 min-h-11 rounded-full border border-outline-variant px-4 font-semibold text-ink">Riprova caricamento</button>}</div>}
      </div>
    </Layout>
  );
}
