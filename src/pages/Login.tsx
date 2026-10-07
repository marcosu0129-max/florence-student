import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getAuthCallbackUrl, isSupabaseConfigured, loadAuthCapabilities, supabase } from '../lib/supabase';
import { useAccountSession } from '../lib/useAccountSession';
import { authErrorMessage, authPageUrl, EMAIL_COOLDOWN_SECONDS, isEmailUnconfirmed, safeAuthReturnTo } from '../lib/authFlow';
import { useAuthAction } from '../lib/useAuthAction';
import { authReturnNavigationState, createReturnState } from '../lib/navigation';

type AuthMode = 'login' | 'register' | 'recover' | 'verify';
type Field = 'password' | 'confirmPassword' | 'fullName' | 'email' | 'form';
const inputClass = 'block w-full px-4 py-3 bg-canvas border border-outline-variant rounded-xl text-base text-ink placeholder:text-text-faint';
const primaryClass = 'w-full min-h-11 flex items-center justify-center py-3 px-4 rounded-full font-semibold text-canvas bg-ink hover:bg-ink-soft transition-colors duration-150 disabled:opacity-60';

export default function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { planYear } = useCatalog();
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);
  const [providerError, setProviderError] = useState(false);
  const [providerAttempt, setProviderAttempt] = useState(0);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    setProviderError(false); setGoogleAvailable(null);
    loadAuthCapabilities().then(value => { if (active) setGoogleAvailable(value.google); })
      .catch(() => { if (active) setProviderError(true); });
    return () => { active = false; };
  }, [providerAttempt]);
  const rawMode = searchParams.get('mode');
  const mode: AuthMode = rawMode === 'register' || rawMode === 'recover' || rawMode === 'verify' ? rawMode : 'login';
  const stateFrom = location.state?.from;
  const returnTo = safeAuthReturnTo(searchParams.get('next') || (typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname ? `${stateFrom.pathname}${stateFrom.search || ''}` : null), catalogLink('/profile', planYear));
  const destinationState = authReturnNavigationState(returnTo, location.state);
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const { pending, run, isMounted } = useAuthAction();
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<Field>('form');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const cooldown = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  const isRecover = mode === 'recover';
  const isRegister = mode === 'register';
  const isVerify = mode === 'verify';
  const emailOnly = isRecover || isVerify;

  useEffect(() => {
    if (rawMode === 'password-reset') navigate(authPageUrl('/reset-password', returnTo, planYear), { replace: true });
  }, [rawMode, navigate, returnTo, planYear]);
  useEffect(() => {
    if (!retryAt || retryAt <= Date.now()) return;
    const timer = window.setInterval(() => { setClock(Date.now()); if (Date.now() >= retryAt) window.clearInterval(timer); }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function changeMode(next: AuthMode, clearFeedback = true) {
    const params = new URLSearchParams(searchParams);
    params.set('year', planYear);
    params.set('next', returnTo);
    if (next === 'login') params.delete('mode'); else params.set('mode', next);
    setSearchParams(params, { replace: true, state: destinationState ? createReturnState(returnTo, destinationState) : undefined });
    if (clearFeedback) { setError(''); setMessage(''); }
    setPassword(''); setConfirmPassword(''); setShowPassword(false);
  }
  function fail(text: string, field: Field = 'form') { if (isMounted()) { setError(text); setErrorField(field); } }
  function startCooldown() { const now = Date.now(); setClock(now); setRetryAt(now + EMAIL_COOLDOWN_SECONDS * 1000); }

  async function handleGoogleSignIn() {
    if (pending || !isSupabaseConfigured || googleAvailable !== true) return;
    setError(''); setMessage('');
    try {
      const result = await run('google', () => supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: getAuthCallbackUrl(returnTo, planYear), skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
      }));
      if (!result.accepted) return;
      const { data, error: requestError } = result.result;
      if (requestError) throw requestError;
      if (!data.url) throw new Error('No authorization URL');
      window.location.assign(data.url);
    } catch (requestError) { fail(authErrorMessage(requestError)); }
  }

  async function handleEmailAuth(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !isSupabaseConfigured || (emailOnly && cooldown > 0)) return;
    setError(''); setMessage('');
    if (!email.trim()) { fail('Inserisci il tuo indirizzo email.', 'email'); return; }
    if (isRegister && !fullName.trim()) { fail('Inserisci il tuo nome.', 'fullName'); return; }
    if (isRegister && password.length < 6) { fail('La password deve contenere almeno 6 caratteri.', 'password'); return; }
    if (isRegister && password !== confirmPassword) { fail('Le password non corrispondono.', 'confirmPassword'); return; }
    try {
      if (mode === 'login') {
        const result = await run('email', () => supabase.auth.signInWithPassword({ email: email.trim(), password }));
        if (!result.accepted) return;
        if (result.result.error) throw result.result.error;
        if (!result.result.data.session) throw new Error('No session');
        navigate(returnTo, { replace: true, state: destinationState });
      } else if (isRegister) {
        const result = await run('email', () => supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: getAuthCallbackUrl(returnTo, planYear), data: { username: fullName.trim() } } }));
        if (!result.accepted) return;
        if (result.result.error) throw result.result.error;
        if (result.result.data.session) { navigate(returnTo, { replace: true, state: destinationState }); return; }
        startCooldown(); changeMode('verify', false);
        setMessage('Se la registrazione richiede conferma, riceverai un’email. Apri il link più recente nello stesso browser per completarla. Se hai già un account, torna all’accesso.');
      } else if (isRecover) {
        const result = await run('email', () => supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthCallbackUrl(returnTo, planYear) }));
        if (!result.accepted) return;
        if (result.result.error) throw result.result.error;
        startCooldown();
        setMessage('Se l’indirizzo è registrato, riceverai un’email con il link per scegliere una nuova password. Apri il link più recente nello stesso browser da cui hai fatto la richiesta.');
      } else {
        const result = await run('email', () => supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: getAuthCallbackUrl(returnTo, planYear) } }));
        if (!result.accepted) return;
        if (result.result.error) throw result.result.error;
        startCooldown();
        setMessage('Se questo account deve ancora essere confermato, riceverai una nuova email. Controlla anche la cartella spam e apri il link più recente nello stesso browser.');
      }
    } catch (requestError) {
      if (!isMounted()) return;
      if (isEmailUnconfirmed(requestError)) changeMode('verify', false);
      fail(authErrorMessage(requestError));
    }
  }

  const title = isRegister ? 'Crea il tuo account' : isRecover ? 'Recupera la password' : isVerify ? 'Conferma la tua email' : 'Bentornato su Florence';
  const submitLabel = isRegister ? 'Crea account' : isRecover ? 'Invia link di recupero' : isVerify ? 'Reinvia email di conferma' : 'Accedi';

  return (
    <main className="min-h-dvh bg-canvas flex items-center justify-center px-4 py-8 md:p-6 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-[15%] left-[10%] md:left-[25%] -rotate-12 opacity-80 pointer-events-none hidden sm:block select-none"><span className="text-7xl">🎓</span></div>
      <div aria-hidden="true" className="absolute bottom-[20%] right-[8%] md:right-[20%] rotate-12 opacity-70 pointer-events-none hidden sm:block select-none"><span className="text-6xl">📝</span></div>
      <div className="w-full max-w-md relative z-10">
        <header className="mb-8 text-center">
          <h1 className="font-h1-editorial text-3xl sm:text-4xl text-ink mb-3 leading-tight text-balance">{title}</h1>
          <p className="text-text text-sm text-pretty">{isRecover ? 'Ti invieremo un link per reimpostare la password.' : isVerify ? 'Apri il link ricevuto via email. Se non è arrivato o è scaduto, richiedine uno nuovo.' : 'Puoi consultare i corsi anche senza un account.'}</p>
        </header>
        <div className="bg-card-base rounded-xl p-6 shadow-card relative">
          {!isSupabaseConfigured && <p role="alert" className="mb-5 text-sm text-error">Accesso non disponibile: il collegamento al servizio account non è configurato. Puoi continuare a consultare i corsi.</p>}
          {checking && <p role="status" className="mb-4 text-sm text-text">Verifica accesso…</p>}
          {sessionError && <div role="alert" className="mb-4 text-sm text-error">{sessionError}<button type="button" onClick={retrySession} className="ml-2 min-h-11 underline">Riprova verifica</button></div>}
          {session && <div className="mb-5 rounded-xl border border-outline-variant bg-canvas p-4 text-sm text-text"><p className="break-all">Sei già connesso{session.user.email ? ` come ${session.user.email}` : ''}.</p><Link to={returnTo} state={destinationState} replace className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">Continua alla pagina richiesta</Link></div>}
          <form onSubmit={handleEmailAuth} className="space-y-5" aria-busy={!!pending}>
            <fieldset disabled={!!pending || !isSupabaseConfigured} className="space-y-5 disabled:opacity-70">
              {isRegister && <div><label htmlFor="full-name" className="block text-sm font-semibold text-ink mb-2">Nome</label><input id="full-name" name="name" autoComplete="name" maxLength={60} required value={fullName} onChange={event => setFullName(event.target.value)} aria-invalid={!!error && errorField === 'fullName'} aria-describedby={error && errorField === 'fullName' ? 'auth-error' : undefined} className={inputClass} /></div>}
              <div><label htmlFor="email" className="block text-sm font-semibold text-ink mb-2">Email</label><input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error && errorField === 'email'} aria-describedby={error && errorField === 'email' ? 'auth-error' : undefined} className={inputClass} /></div>
              {!emailOnly && <div><label htmlFor="password" className="block text-sm font-semibold text-ink mb-2">Password</label><div className="relative"><input id="password" name="password" required minLength={isRegister ? 6 : undefined} type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!error && errorField === 'password'} aria-describedby={error && errorField === 'password' ? 'auth-error' : isRegister ? 'password-help' : undefined} className={`${inputClass} pr-14`} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-ink"><Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} /></button></div>{isRegister && <p id="password-help" className="text-xs text-text mt-2">Almeno 6 caratteri. Il servizio può richiedere una password più robusta.</p>}</div>}
              {isRegister && <div><label htmlFor="confirm-password" className="block text-sm font-semibold text-ink mb-2">Conferma password</label><input id="confirm-password" name="confirmPassword" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} aria-invalid={!!error && errorField === 'confirmPassword'} aria-describedby={error && errorField === 'confirmPassword' ? 'auth-error' : undefined} className={inputClass} /></div>}
              <button type="submit" disabled={emailOnly && cooldown > 0} className={primaryClass}>{pending === 'email' ? 'Richiesta in corso…' : emailOnly && cooldown > 0 ? `Riprova tra ${cooldown} s` : submitLabel}</button>
              {emailOnly && cooldown > 0 && <p className="text-xs text-text">Attendi prima di richiedere un’altra email.</p>}
            </fieldset>
            {error && <p id="auth-error" role="alert" className="text-sm text-error leading-relaxed">{error}</p>}
            {message && <p role="status" className="text-sm text-ink leading-relaxed">{message}</p>}
            {mode === 'login' && <button type="button" onClick={() => changeMode('recover')} disabled={!!pending} className="w-full min-h-11 text-sm text-text underline underline-offset-4 disabled:opacity-60">Hai dimenticato la password?</button>}
            {(mode === 'login' || isRegister) && googleAvailable === true && <><div className="flex items-center gap-4 text-sm text-text"><span className="flex-1 border-t border-outline-variant" />Oppure<span className="flex-1 border-t border-outline-variant" /></div><button type="button" onClick={handleGoogleSignIn} disabled={!!pending} className="w-full min-h-11 flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant rounded-full font-semibold text-ink bg-canvas hover:bg-surface-container transition-colors duration-150 disabled:opacity-60"><span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center font-bold leading-none">G</span><span className="min-w-0">{pending === 'google' ? 'Collegamento a Google…' : 'Continua con Google'}</span></button></>}
            {(mode === 'login' || isRegister) && googleAvailable === false && <p className="text-xs text-text">L’accesso con Google non è attivo. Usa email e password.</p>}
            {(mode === 'login' || isRegister) && providerError && <div className="text-xs text-text" role="status">Verifica dell’accesso con Google non riuscita. Puoi usare email e password.<button type="button" onClick={() => setProviderAttempt(value => value + 1)} className="block min-h-11 underline">Riprova verifica Google</button></div>}
          </form>
          <div className="mt-5 text-center"><button type="button" disabled={!!pending} onClick={() => changeMode(mode === 'login' ? 'register' : 'login')} className="min-h-11 text-sm font-semibold text-ink underline underline-offset-4 disabled:opacity-60">{mode === 'login' ? 'Non hai un account? Registrati' : isVerify ? 'Ho già confermato: accedi' : 'Torna all’accesso'}</button></div>
          {mode === 'login' && <div className="text-center"><button type="button" disabled={!!pending} onClick={() => changeMode('verify')} className="min-h-11 text-sm text-text underline underline-offset-4 disabled:opacity-60">Non hai ricevuto l’email di conferma?</button></div>}
          <div className="mt-2 text-center"><Link to={searchParams.has('next') ? returnTo : catalogLink('/', planYear)} state={searchParams.has('next') ? destinationState : undefined} className="inline-flex min-h-11 items-center gap-2 text-sm text-text hover:text-ink transition-colors duration-150"><Icon name="arrow_back" size={20} /><span className="min-w-0">Continua senza account</span></Link></div>
        </div>
      </div>
    </main>
  );
}
