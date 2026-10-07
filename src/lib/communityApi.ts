import { isSupabaseConfigured, supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { profileChanges } from './profileChanges';

export function communityError(error: unknown): Error {
  const code = (error as { code?: string })?.code;
  const message = code === '28000' || code === 'PGRST301' ? 'Accedi di nuovo per continuare.'
    : code === '42501' ? 'Non hai il permesso di eseguire questa operazione.'
    : code === '23505' ? 'Hai già inserito questo contenuto. Puoi modificarlo dal tuo profilo.'
    : code === '22023' || code === '23514' ? 'Controlla i campi inseriti e riprova.'
    : code === 'PGRST202' || code === 'PGRST205' || code === '42P01' ? 'Il servizio account è in aggiornamento. I dati locali sono conservati; riprova tra poco.'
    : 'Connessione non riuscita. Controlla la rete e riprova.';
  return new Error(message);
}

/** Bound requests; never expose server errors, credentials or query details to the UI. */
export async function communityRequest<T>(request: (signal: AbortSignal) => PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  if (!isSupabaseConfigured) throw new Error('Servizio account non configurato. Puoi continuare a esplorare il catalogo.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const { data, error } = await request(controller.signal);
    if (error) throw communityError(error);
    return data as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('La richiesta sta impiegando troppo tempo. Riprova.');
    if (error instanceof TypeError) throw communityError(error);
    throw error;
  } finally { clearTimeout(timeout); }
}

export const communityRpc = <T>(name: string, params: Record<string, unknown> = {}) =>
  communityRequest<T>(signal => supabase.rpc(name, params).abortSignal(signal));

export interface AccountProfile {
  id: string; username: string; faculty: string; enrollment_year: number;
  anonymous_reviews: boolean; notify_reviews: boolean; notify_materials: boolean;
}
export const fetchAccountProfile = (userId: string) => communityWrite<AccountProfile>('ensure_my_profile', {}, userId);
export const saveAccountProfile = (profile: AccountProfile, previous: AccountProfile) => communityWrite<AccountProfile>(
  'patch_my_profile', { p_changes: profileChanges(previous, profile) }, profile.id);

export interface FavoriteRecord { course_id: string; plan_year: string | null; }
export const fetchAccountFavorites = () => communityRequest<FavoriteRecord[]>(signal =>
  supabase.from('user_favorites').select('course_id,plan_year').order('created_at', { ascending: false }).abortSignal(signal));
export const setAccountFavorite = (courseId: string, saved: boolean, planYear: string, userId: string) => communityWrite<boolean>('set_my_favorite', {
  p_course_id: courseId, p_saved: saved, p_plan_year: planYear || null,
}, userId);

type AccountWriteClient = Pick<SupabaseClient, 'rpc'> & { auth: Pick<SupabaseClient['auth'], 'getSession'> };

/** An injectable boundary lets tests exercise the real SDK request headers without a live account. */
export function createAccountWriter(client: AccountWriteClient, request: typeof communityRequest = communityRequest, sessionTimeoutMs = 12000) {
  async function requireAccountSession(expectedUserId: string) {
    if (typeof expectedUserId !== 'string' || !expectedUserId.trim()) throw new Error('Accedi per continuare.');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        client.auth.getSession(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Verifica dell’accesso non riuscita. Riprova.')), sessionTimeoutMs); }),
      ]);
      if (result.error || !result.data.session || !result.data.session.access_token) throw new Error('Accedi di nuovo per continuare.');
      if (result.data.session.user.id !== expectedUserId) throw new Error('L’account è cambiato. Riapri la pagina prima di salvare.');
      return result.data.session;
    } finally { if (timer) clearTimeout(timer); }
  }
  async function communityWrite<T>(name: string, params: Record<string, unknown>, expectedUserId: string): Promise<T> {
    const session = await requireAccountSession(expectedUserId);
    const authorization = `Bearer ${session.access_token}`;
    return request<T>(signal => client.rpc(name, params).setHeader('Authorization', authorization).abortSignal(signal));
  }
  return { requireAccountSession, communityWrite };
}

/** Pin every account mutation to the user who initiated it, even during token refresh/account changes. */
const accountWriter = createAccountWriter(supabase);
export const requireAccountSession = accountWriter.requireAccountSession;
export const communityWrite = accountWriter.communityWrite;
