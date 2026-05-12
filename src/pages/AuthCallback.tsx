import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function getOAuthError(): string {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error') ||
    ''
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const providerError = useMemo(() => getOAuthError(), []);

  useEffect(() => {
    if (providerError) {
      setErrorMsg(providerError);
      setStatus('error');
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      if (!isMounted) return;
      setErrorMsg('Accesso non completato. Riprova o controlla le impostazioni Google/Supabase.');
      setStatus('error');
    }, 9000);

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) return;

      if (sessionError) {
        window.clearTimeout(timeoutId);
        setErrorMsg(sessionError.message);
        setStatus('error');
        return;
      }

      if (data.session) {
        window.clearTimeout(timeoutId);
        navigate('/profile', { replace: true });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted || !session) return;
      window.clearTimeout(timeoutId);
      navigate('/profile', { replace: true });
    });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate, providerError]);

  return (
    <div className="min-h-screen bg-surface-main flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-soft rounded-[28px] p-8 shadow-lg text-center">
        {status === 'checking' ? (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-surface-variant border-t-coral animate-spin mx-auto mb-4" />
            <h1 className="h-hero text-3xl text-text-primary mb-3">Accesso in corso</h1>
            <p className="t-body text-body-main text-text-muted">
              Stiamo completando il login con Google e preparando il tuo profilo.
            </p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[48px] text-danger">error</span>
            </div>
            <h1 className="h-hero text-3xl text-text-primary mb-3">Login non completato</h1>
            <div className="bg-error-container rounded-xl p-3 mb-5 text-left">
              <p className="t-body text-body-main text-on-error-container">{errorMsg}</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-coral text-white h-card font-semibold px-6 py-3 rounded-full hover:bg-danger transition-colors"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              Torna al login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
