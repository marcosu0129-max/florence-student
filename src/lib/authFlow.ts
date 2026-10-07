import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

const LOCAL_ORIGIN = 'https://florence.invalid';
const AUTH_PATH = /^\/(?:login|reset-password|auth)(?:\/|$)/;
const RECOVERY_KEY = 'florence:password-recovery';
export const RECOVERY_LIFETIME_MS = 15 * 60 * 1000;
export const EMAIL_COOLDOWN_SECONDS = 60;
type AuthClient = SupabaseClient['auth'];
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function safeAuthReturnTo(value: unknown, fallback = '/profile'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, LOCAL_ORIGIN);
    const decodedPath = decodeURIComponent(url.pathname);
    if (url.origin !== LOCAL_ORIGIN || decodedPath.startsWith('//') || decodedPath.includes('\\') || AUTH_PATH.test(decodedPath)) return fallback;
    for (const key of ['code', 'access_token', 'refresh_token', 'token_hash', 'token']) url.searchParams.delete(key);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

export function authPageUrl(path: '/login' | '/reset-password', returnTo: string, year: string, mode?: string): string {
  const query = new URLSearchParams({ next: safeAuthReturnTo(returnTo), year });
  if (mode) query.set('mode', mode);
  return `${path}?${query}`;
}

export function authCallbackUrl(origin: string, returnTo: string, year: string): string {
  const url = new URL('/auth/callback', origin);
  url.searchParams.set('next', safeAuthReturnTo(returnTo));
  url.searchParams.set('year', year);
  return url.toString();
}

export class AuthRequestTimeout extends Error {
  constructor() { super('Auth request timeout'); this.name = 'AuthRequestTimeout'; }
}

export async function authRequest<T>(request: PromiseLike<T>, timeoutMs = 15000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => reject(new AuthRequestTimeout()), timeoutMs);
    })]);
  } finally { clearTimeout(timeout); }
}

export function createAuthActionGate() {
  let locked = false;
  return {
    start<T>(action: () => PromiseLike<T>, settled: () => void): Promise<T> | null {
      if (locked) return null;
      locked = true;
      const request = Promise.resolve().then(action);
      const release = () => { locked = false; settled(); };
      request.then(release, release);
      return request;
    },
  };
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthRequestTimeout) return 'Esito non confermato: la richiesta sta impiegando troppo tempo. Controlla email e account. Non inviare una seconda richiesta mentre la prima è ancora in corso.';
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = typeof error === 'object' && error && 'message' in error ? String(error.message).toLowerCase() : '';
  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'Email o password non corretti. Riprova.';
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'Conferma il tuo indirizzo tramite l’email ricevuta. Puoi richiedere un nuovo link qui sotto.';
  if (code === 'user_already_exists' || message.includes('already registered')) return 'Questo indirizzo è già registrato. Accedi o recupera la password.';
  if (code === 'email_address_not_authorized' || message.includes('email address not authorized') || message.includes('not authorized to send emails')) return 'Il servizio email non può inviare a questo indirizzo. È necessaria una configurazione del servizio da parte di Florence Student. Puoi continuare senza account.';
  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit')) return 'Il servizio ha raggiunto il limite di invio email. Attendi prima di riprovare: richieste ripetute non accelerano la consegna. Se hai già confermato l’account, accedi.';
  if (message.includes('error sending confirmation email') || message.includes('error sending recovery email') || message.includes('smtp')) return 'Il servizio non è riuscito a inviare l’email. Riprova più tardi. Se il problema continua, serve una verifica del servizio email da parte di Florence Student.';
  if (code === 'signup_disabled' || code === 'email_provider_disabled') return 'Le nuove registrazioni via email non sono disponibili al momento. Puoi continuare a consultare i corsi senza account.';
  if (code.includes('rate_limit') || message.includes('rate limit') || message.includes('too many')) return 'Troppe richieste. Attendi qualche minuto prima di riprovare.';
  if (code === 'same_password' || message.includes('same password')) return 'Scegli una password diversa da quella attuale.';
  if (code === 'weak_password' || message.includes('weak password')) return 'Questa password non soddisfa i requisiti del servizio. Scegli una password più lunga, con lettere, numeri e simboli.';
  if (code === 'otp_expired' || code === 'flow_state_expired' || code === 'flow_state_not_found' || message.includes('expired') || message.includes('invalid token')) return 'Il link non è valido o è scaduto. Richiedi una nuova email.';
  if (code === 'pkce_verifier_not_found' || message.includes('code verifier') || message.includes('pkce')) return 'Apri il link nello stesso browser da cui hai fatto la richiesta. Se hai appena confermato l’email, puoi tornare all’accesso. Per recuperare la password, richiedi un nuovo link da questo dispositivo.';
  if (code === 'reauthentication_needed' || code === 'reauthentication_not_valid') return 'Per aggiornare la password serve una verifica recente. Richiedi un nuovo link di recupero.';
  if (message.includes('fetch') || message.includes('network') || message.includes('abort')) return 'Connessione non riuscita. Controlla la rete e riprova.';
  return 'Richiesta non riuscita. Controlla la connessione e riprova. Se il problema continua, contattaci.';
}

export function isEmailUnconfirmed(error: unknown): boolean {
  return !!error && typeof error === 'object' && (('code' in error && error.code === 'email_not_confirmed') || ('message' in error && String(error.message).toLowerCase().includes('email not confirmed')));
}

export type CallbackInput =
  | { kind: 'code'; code: string }
  | { kind: 'otp'; tokenHash: string; type: 'email' | 'signup' | 'recovery' | 'email_change' }
  | { kind: 'error' | 'missing' | 'legacy' };

export function parseAuthCallback(url: URL): CallbackInput {
  const hash = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has('error') || url.searchParams.has('error_description') || hash.has('error') || hash.has('error_description')) return { kind: 'error' };
  const code = url.searchParams.get('code');
  if (code) return { kind: 'code', code };
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (tokenHash && (type === 'email' || type === 'signup' || type === 'recovery' || type === 'email_change')) return { kind: 'otp', tokenHash, type };
  if (hash.has('access_token') || hash.has('refresh_token')) return { kind: 'legacy' };
  return { kind: 'missing' };
}

export function cleanAuthCallbackPath(url: URL): string {
  const clean = new URL(url);
  for (const key of ['code', 'token_hash', 'token', 'type', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'error', 'error_code', 'error_description']) clean.searchParams.delete(key);
  clean.hash = '';
  return `${clean.pathname}${clean.search}`;
}

interface CallbackResult { session: Session; recovery: boolean; }
type CallbackAuth = Pick<AuthClient, 'exchangeCodeForSession' | 'verifyOtp' | 'onAuthStateChange'>;
const callbackRequests = new WeakMap<object, { key: string; request: Promise<CallbackResult> }>();

// Deduplicate React Strict Mode effects; a PKCE code can only be exchanged once.
export function completeAuthCallback(auth: CallbackAuth, input: CallbackInput): Promise<CallbackResult> {
  if (input.kind !== 'code' && input.kind !== 'otp') return Promise.reject(new Error('Missing supported callback credentials'));
  const key = input.kind === 'code' ? `code:${input.code}` : `${input.type}:${input.tokenHash}`;
  const existing = callbackRequests.get(auth);
  if (existing?.key === key) return existing.request;
  const request = (async () => {
    let recoveryUserId: string | undefined;
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      // Never infer recovery from ?next, ?mode, an existing session, or a token type supplied in a hash.
      if (event === 'PASSWORD_RECOVERY' && session) recoveryUserId = session.user.id;
    });
    try {
      const { data, error } = input.kind === 'code'
        ? await auth.exchangeCodeForSession(input.code)
        : await auth.verifyOtp({ token_hash: input.tokenHash, type: input.type });
      if (error) throw error;
      if (!data.session) throw new Error('No callback session');
      return { session: data.session, recovery: recoveryUserId === data.session.user.id || (input.kind === 'otp' && input.type === 'recovery') };
    } finally { subscription.unsubscribe(); }
  })();
  callbackRequests.set(auth, { key, request });
  return request;
}

function browserSessionStorage(): StorageLike | undefined {
  try { return typeof window === 'undefined' ? undefined : window.sessionStorage; } catch { return undefined; }
}
let inMemoryRecovery: { userId: string; sessionId: string; expiresAt: number } | null = null;

function recoverySessionId(session: Session): string | null {
  // This is a continuity hint, not token verification. getUser() validates the session before a password update.
  try {
    const encoded = session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims: unknown = JSON.parse(atob(encoded));
    if (claims && typeof claims === 'object' && 'session_id' in claims && typeof claims.session_id === 'string' && claims.session_id) return claims.session_id;
  } catch { /* Older tokens can still be tied to the SDK's sign-in timestamp. */ }
  return session.user.last_sign_in_at ? `signed-in:${session.user.last_sign_in_at}` : null;
}

export function clearPasswordRecovery(storage = browserSessionStorage()) {
  inMemoryRecovery = null;
  try { storage?.removeItem(RECOVERY_KEY); } catch { /* The in-memory grant is still cleared. */ }
}

export function recordPasswordRecovery(session: Session, storage = browserSessionStorage(), now = Date.now()) {
  const sessionId = recoverySessionId(session);
  if (!sessionId) { clearPasswordRecovery(storage); return; }
  inMemoryRecovery = { userId: session.user.id, sessionId, expiresAt: now + RECOVERY_LIFETIME_MS };
  try { storage?.setItem(RECOVERY_KEY, JSON.stringify(inMemoryRecovery)); } catch { /* Same-tab navigation remains available without storage. */ }
}

export function hasPasswordRecovery(session: Session | null | undefined, storage = browserSessionStorage(), now = Date.now()): boolean {
  if (!session) return false;
  let grant: unknown = inMemoryRecovery;
  try { const stored = storage?.getItem(RECOVERY_KEY); if (stored) grant = JSON.parse(stored); } catch { /* Fall back to the in-memory grant. */ }
  if (!grant || typeof grant !== 'object' || !('userId' in grant) || !('sessionId' in grant) || !('expiresAt' in grant)) return false;
  return grant.userId === session.user.id && grant.sessionId === recoverySessionId(session) && typeof grant.expiresAt === 'number' && grant.expiresAt > now && grant.expiresAt <= now + RECOVERY_LIFETIME_MS;
}

export function updatePasswordRecovery(event: AuthChangeEvent, session: Session | null) {
  if (event === 'PASSWORD_RECOVERY' && session) recordPasswordRecovery(session);
  else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' || (event === 'SIGNED_IN' && !hasPasswordRecovery(session))) clearPasswordRecovery();
}

export interface AccountSnapshot { session: Session | null; checking: boolean; sessionError: string; }
type SessionAuth = Pick<AuthClient, 'getSession' | 'onAuthStateChange'>;
export function observeAccountSession(auth: SessionAuth, receive: (snapshot: AccountSnapshot) => void, timeoutMs = 10000): () => void {
  let active = true;
  let revision = 0;
  const timeout = setTimeout(() => {
    if (active) receive({ session: null, checking: false, sessionError: 'Impossibile verificare l’accesso. Controlla la connessione e riprova.' });
  }, timeoutMs);
  const update = (session: Session | null) => {
    if (!active) return;
    clearTimeout(timeout);
    receive({ session, checking: false, sessionError: '' });
  };
  const { data: { subscription } } = auth.onAuthStateChange((_event, session) => { revision += 1; update(session); });
  const startRevision = revision;
  auth.getSession().then(({ data, error }) => {
    if (!active || revision !== startRevision) return;
    if (error) throw error;
    update(data.session);
  }).catch(() => {
    if (!active || revision !== startRevision) return;
    clearTimeout(timeout);
    receive({ session: null, checking: false, sessionError: 'Impossibile verificare l’accesso. Controlla la connessione e riprova.' });
  });
  return () => { active = false; clearTimeout(timeout); subscription.unsubscribe(); };
}
