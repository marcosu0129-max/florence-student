import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { authErrorMessage, authPageUrl, authRequest, cleanAuthCallbackPath, completeAuthCallback, parseAuthCallback, recordPasswordRecovery, safeAuthReturnTo } from '../lib/authFlow';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { planYear } = useCatalog();
  const [error, setError] = useState('');
  const initialUrl = useMemo(() => new URL(window.location.href), []);
  const details = useMemo(() => parseAuthCallback(initialUrl), [initialUrl]);
  const returnTo = safeAuthReturnTo(initialUrl.searchParams.get('next'), catalogLink('/profile', planYear));

  useEffect(() => {
    // Remove one-use credentials before rendering links or making further requests.
    window.history.replaceState(window.history.state, '', cleanAuthCallbackPath(initialUrl));
    if (!isSupabaseConfigured) { setError('Il servizio account non è configurato. Puoi continuare a consultare i corsi.'); return; }
    if (details.kind === 'error') { setError('Il collegamento non è valido, è scaduto oppure l’accesso è stato annullato. Richiedi una nuova email o riprova ad accedere.'); return; }
    if (details.kind === 'legacy') { setError('Questo collegamento usa un formato precedente. Richiedi un nuovo link di conferma o recupero da questo browser.'); return; }
    if (details.kind === 'missing') { setError('Nessun collegamento da verificare. Un accesso già attivo non conferma una nuova email o una richiesta di recupero.'); return; }
    let active = true;
    authRequest(completeAuthCallback(supabase.auth, details)).then(({ session, recovery }) => {
      if (!active) return;
      if (recovery) recordPasswordRecovery(session);
      navigate(recovery ? authPageUrl('/reset-password', returnTo, planYear) : returnTo, { replace: true });
    }).catch(requestError => { if (active) setError(authErrorMessage(requestError)); });
    return () => { active = false; };
  }, [details, initialUrl, navigate, planYear, returnTo]);

  return (
    <main className="min-h-dvh bg-canvas flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-card-base rounded-xl p-6 sm:p-8 shadow-card text-center" aria-busy={!error}>
        <div className="mb-4 flex justify-center"><Icon name={error ? 'error_outline' : 'lock'} size={32} className="text-ink" /></div>
        <h1 className="font-h1-editorial text-3xl text-ink mb-4 text-balance">{error ? 'Accesso non completato' : 'Verifica in corso'}</h1>
        {error ? <p role="alert" className="text-sm text-text leading-relaxed mb-6">{error}</p> : <p role="status" className="text-sm text-text leading-relaxed mb-6">Stiamo verificando il collegamento al tuo account…</p>}
        <Link to={authPageUrl('/login', returnTo, planYear)} replace className="inline-flex min-h-11 items-center justify-center bg-ink text-canvas font-semibold px-6 py-3 rounded-full hover:bg-ink-soft transition-colors duration-150">{error ? 'Torna all’accesso' : 'Annulla e torna all’accesso'}</Link>
        {error && <div className="mt-3 flex flex-col"><Link to={authPageUrl('/login', returnTo, planYear, 'recover')} replace className="inline-flex min-h-11 items-center justify-center text-sm text-text underline underline-offset-4">Richiedi un nuovo link di recupero</Link><Link to={authPageUrl('/login', returnTo, planYear, 'verify')} replace className="inline-flex min-h-11 items-center justify-center text-sm text-text underline underline-offset-4">Reinvia email di conferma</Link></div>}
        <Link to={catalogLink('/', planYear)} className="flex min-h-11 items-center justify-center mt-3 text-sm text-text underline underline-offset-4">Continua senza account</Link>
      </section>
    </main>
  );
}
