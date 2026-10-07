import { createClient } from '@supabase/supabase-js';
import { authCallbackUrl, updatePasswordRecovery } from './authFlow';
import { createAuthCapabilitiesReader } from './authCapabilities';

// A single environment-based configuration is used by auth and catalog reads.
// Never fall back to an old project or embed credentials in application source.
const env: Partial<ImportMetaEnv> = import.meta.env ?? {};
const supabaseUrl = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
const supabaseAnonKey = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string'
  ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
  : typeof env.VITE_SUPABASE_ANON_KEY === 'string' ? env.VITE_SUPABASE_ANON_KEY.trim() : '';

function configurationError(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) return 'Connessione al database non configurata. È disponibile la copia ufficiale UNIFI salvata nel progetto.';
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
      return 'Indirizzo del database non valido. Verifica la configurazione del progetto.';
    }
  } catch { return 'Indirizzo del database non valido. Verifica la configurazione del progetto.'; }
  return null;
}

export const supabaseConfigurationError = configurationError();
export const isSupabaseConfigured = supabaseConfigurationError === null;
export const loadAuthCapabilities = createAuthCapabilitiesReader(supabaseUrl, supabaseAnonKey);

export const getAuthCallbackUrl = (returnTo?: string, year?: string) => returnTo && year
  ? authCallbackUrl(window.location.origin, returnTo, year)
  : `${window.location.origin}/auth/callback`;

// An inert client keeps existing imports compatible before configuration.
// Catalog requests check isSupabaseConfigured and never call this placeholder.
export const supabase = createClient(isSupabaseConfigured ? supabaseUrl : 'https://unconfigured.invalid', isSupabaseConfigured ? supabaseAnonKey : 'unconfigured-public-key', {
  auth: {
    autoRefreshToken: isSupabaseConfigured,
    // AuthCallback exchanges links explicitly so an old session cannot complete a new callback.
    detectSessionInUrl: false,
    flowType: 'pkce',
    persistSession: isSupabaseConfigured,
  },
});

if (isSupabaseConfigured && typeof window !== 'undefined') {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(updatePasswordRecovery);
  import.meta.hot?.dispose(() => subscription.unsubscribe());
}
