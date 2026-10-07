import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { authErrorMessage, authPageUrl, authRequest, clearPasswordRecovery, hasPasswordRecovery, safeAuthReturnTo } from '../lib/authFlow';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAccountSession } from '../lib/useAccountSession';
import { useAuthAction } from '../lib/useAuthAction';

const inputClass = 'block w-full px-4 py-3 bg-canvas border border-outline-variant rounded-xl text-base text-ink';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const { planYear } = useCatalog();
  const returnTo = safeAuthReturnTo(params.get('next'), catalogLink('/profile', planYear));
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const { pending, run, isMounted } = useAuthAction();
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<'password' | 'confirmation' | 'form'>('form');
  const [complete, setComplete] = useState(false);
  const authorized = hasPasswordRecovery(session);

  useEffect(() => {
    setVerifiedUserId(null);
    if (checking || !session || !authorized) { setVerifying(false); return; }
    let active = true;
    setVerifying(true); setError('');
    authRequest(supabase.auth.getUser()).then(({ data, error: requestError }) => {
      if (!active) return;
      if (requestError) throw requestError;
      if (!data.user || data.user.id !== session.user.id || !hasPasswordRecovery(session)) throw new Error('Recovery session changed');
      setVerifiedUserId(data.user.id);
    }).catch(requestError => { if (active) setError(authErrorMessage(requestError)); }).finally(() => { if (active) setVerifying(false); });
    return () => { active = false; };
  }, [checking, session?.user.id, authorized, attempt]);

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !session || verifiedUserId !== session.user.id || !hasPasswordRecovery(session)) return;
    setError(''); setErrorField('form');
    if (password.length < 6) { setError('La password deve contenere almeno 6 caratteri.'); setErrorField('password'); return; }
    if (password !== confirmation) { setError('Le password non corrispondono.'); setErrorField('confirmation'); return; }
    try {
      const result = await run('password', async () => {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user || data.user.id !== verifiedUserId || !hasPasswordRecovery(session)) throw new Error('Recovery session changed');
        return supabase.auth.updateUser({ password });
      });
      if (!result.accepted) return;
      if (result.result.error) throw result.result.error;
      clearPasswordRecovery(); setPassword(''); setConfirmation(''); setComplete(true);
    } catch (requestError) { if (isMounted()) setError(authErrorMessage(requestError)); }
  }

  const blocked = !isSupabaseConfigured || (!checking && !authorized);
  return (
    <main className="min-h-dvh bg-canvas flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-xl bg-card-base p-6 sm:p-8 shadow-card">
        <div className="mb-5 flex justify-center"><Icon name={complete ? 'verified' : 'lock'} size={32} /></div>
        <h1 className="font-h1-editorial text-3xl text-ink text-center mb-4 text-balance">{complete ? 'Password aggiornata' : 'Scegli una nuova password'}</h1>
        {complete ? <div className="text-center"><p role="status" className="text-sm leading-relaxed text-text mb-6">La nuova password è stata salvata. Il tuo account è connesso e puoi continuare.</p><Link to={returnTo} replace className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-canvas font-semibold">Continua</Link></div> : <>
          {checking || verifying ? <p role="status" className="mb-5 text-sm text-text">Verifica del link di recupero…</p> : null}
          {blocked && <p role="alert" className="mb-5 text-sm leading-relaxed text-error">{!isSupabaseConfigured ? 'Il servizio account non è configurato.' : 'Serve un link di recupero valido e recente. Essere già connessi non basta per completare questa procedura.'}</p>}
          {sessionError && <div role="alert" className="mb-4 text-sm text-error">{sessionError}<button type="button" onClick={retrySession} className="ml-2 min-h-11 underline">Riprova verifica</button></div>}
          {!blocked && !checking && authorized && <>
            <p className="mb-5 text-sm text-text break-all">{session?.user.email ? `Account: ${session.user.email}` : 'Account verificato tramite il link di recupero.'}</p>
            <form onSubmit={savePassword} className="space-y-5" aria-busy={!!pending || verifying}>
              <fieldset disabled={!!pending || verifying || !verifiedUserId} className="space-y-5 disabled:opacity-70">
                <div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-ink">Nuova password</label><div className="relative"><input id="new-password" name="newPassword" autoComplete="new-password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!error && errorField === 'password'} aria-describedby={error && errorField === 'password' ? 'reset-error' : 'reset-help'} className={`${inputClass} pr-14`} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center"><Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} /></button></div><p id="reset-help" className="mt-2 text-xs text-text">Almeno 6 caratteri. Il servizio può richiedere una password più robusta.</p></div>
                <div><label htmlFor="confirm-new-password" className="mb-2 block text-sm font-semibold text-ink">Conferma nuova password</label><input id="confirm-new-password" name="confirmPassword" autoComplete="new-password" type={showPassword ? 'text' : 'password'} required value={confirmation} onChange={event => setConfirmation(event.target.value)} aria-invalid={!!error && errorField === 'confirmation'} aria-describedby={error && errorField === 'confirmation' ? 'reset-error' : undefined} className={inputClass} /></div>
                <button type="submit" className="min-h-11 w-full rounded-full bg-ink px-5 py-3 font-semibold text-canvas transition-colors duration-150 hover:bg-ink-soft">{pending ? 'Salvataggio in corso…' : 'Salva nuova password'}</button>
              </fieldset>
            </form>
          </>}
          {error && <p id="reset-error" role="alert" className="mt-4 text-sm leading-relaxed text-error">{error}</p>}
          {authorized && !verifying && !verifiedUserId && !checking && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 min-h-11 text-sm text-ink underline">Riprova verifica del link</button>}
          <div className="mt-5 flex flex-col items-center gap-1"><Link to={authPageUrl('/login', returnTo, planYear, 'recover')} className="inline-flex min-h-11 items-center justify-center text-sm text-ink underline underline-offset-4">Richiedi un nuovo link di recupero</Link><Link to={authPageUrl('/login', returnTo, planYear)} className="inline-flex min-h-11 items-center justify-center text-sm text-text underline underline-offset-4">Torna all’accesso</Link></div>
        </>}
      </section>
    </main>
  );
}
