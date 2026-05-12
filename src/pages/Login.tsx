import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const authRedirectTo = `${window.location.origin}/auth/callback`;

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authRedirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError(oauthError.message || 'Accesso con Google non disponibile.');
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message || 'Credenziali non valide. Riprova.');
        setLoading(false);
      }
    } else {
      if (password !== confirmPassword) {
        setError('Le password non corrispondono.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('La password deve essere di almeno 6 caratteri.');
        setLoading(false);
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: authRedirectTo, data: { username: fullName || email.split('@')[0] } },
      });
      if (signUpError) {
        setError(signUpError.message || 'Errore durante la registrazione. Riprova.');
        setLoading(false);
      } else {
        alert('Controlla la tua casella email per confermare la registrazione.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Floating 3D Decorative Objects */}
      <div className="absolute top-[15%] left-[10%] md:left-[25%] -rotate-12 opacity-80 pointer-events-none hidden sm:block select-none">
        <span className="text-7xl" style={{ filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.12))' }}>&#127891;</span>
      </div>
      <div className="absolute bottom-[20%] right-[8%] md:right-[20%] rotate-12 opacity-70 pointer-events-none hidden sm:block select-none">
        <span className="text-6xl" style={{ filter: 'drop-shadow(0 20px 32px rgba(0,0,0,0.12))' }}>&#128221;</span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] relative z-20">
        {/* Header */}
        <div className="mb-10 text-center relative">
          <h1 className="font-h1-editorial text-h1-editorial text-ink mb-2 -rotate-1">Bentornato<br/>su Florence</h1>
          <p className="font-body-main text-body-main text-text-muted mt-4">Accedi per continuare la tua esperienza.</p>
        </div>

        {/* Login Card */}
        <div className="bg-card-base rounded-xl p-card-padding shadow-card rotate-1 hover:-translate-y-[2px] transition-transform duration-300 relative">
          <form onSubmit={handleEmailAuth} className="space-y-6">
            {/* Email */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-muted text-[20px]">mail</span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3 bg-canvas border border-outline-variant rounded-full font-body-main text-body-main text-ink placeholder:text-text-faint focus:ring-2 focus:ring-ink focus:border-ink transition-colors shadow-sm"
                  id="email"
                  name="email"
                  placeholder="Email universitaria"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-text-muted text-[20px]">lock</span>
                </div>
                <input
                  className="block w-full pl-11 pr-4 py-3 bg-canvas border border-outline-variant rounded-full font-body-main text-body-main text-ink placeholder:text-text-faint focus:ring-2 focus:ring-ink focus:border-ink transition-colors shadow-sm"
                  id="password"
                  name="password"
                  placeholder="Password"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mt-2 text-right">
                <button type="button" className="font-nav-link text-caption text-text-muted hover:text-ink transition-colors">
                  Hai dimenticato la password?
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-[16px] p-4">
                <p className="text-[13px] text-error font-semibold text-center">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm font-card-title text-card-title text-canvas bg-ink hover:bg-ink-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                    {mode === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...'}
                  </span>
                ) : mode === 'login' ? 'Accedi' : 'Registrati'}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant" />
                </div>
                <div className="relative bg-card-base px-4 font-caption text-caption text-text-muted uppercase tracking-wider">
                  Oppure
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center py-3 px-4 border border-outline-variant rounded-full shadow-sm font-card-title text-card-title text-ink bg-canvas hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors disabled:opacity-50"
              >
                <img
                  alt="Google logo"
                  className="w-5 h-5 mr-3"
                  src="https://lh3.googleusercontent.com/a-/AAuE7mDfdsjf_placeholder"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="w-5 h-5 rounded-full bg-white border border-[#4285F4]/20 flex items-center justify-center text-[14px] font-bold text-[#4285F4] mr-3">G</span>
                {mode === 'login' ? 'Continua con Google' : 'Registrati con Google'}
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-8 text-center">
            <p className="font-body-main text-body-main text-text-muted">
              {mode === 'login' ? 'Non hai un account?' : 'Hai gia un account?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setEmail(''); setPassword(''); setConfirmPassword(''); setFullName(''); }}
                className="font-nav-link text-nav-link text-ink hover:underline decoration-2 underline-offset-4 font-semibold"
              >
                {mode === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </p>
          </div>

          {/* Demo Mode */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] font-card-title font-medium text-text-secondary hover:text-ink transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              Modalita demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
