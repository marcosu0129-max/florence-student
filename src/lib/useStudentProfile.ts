import { useCallback, useEffect, useRef, useState } from 'react';
import { createProfileRequestScope } from './profileRequestScope';
import { useAccountSession } from './useAccountSession';
import { fetchAccountProfile, saveAccountProfile, type AccountProfile } from './communityApi';
import { DEFAULT_PROFILE, getLocalPreferences, getLocalProfile, saveLocalPreferences, saveLocalProfile, type LocalProfile } from './localProfile';

export function useStudentProfile() {
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const userId = session?.user.id || null;
  const scope = useRef(createProfileRequestScope()).current;
  const version = scope.update(userId, checking);
  const [local, setLocal] = useState(getLocalProfile);
  const [localPrefs, setLocalPrefs] = useState(getLocalPreferences);
  const [remote, setRemote] = useState<{ userId: string; version: number; value: AccountProfile } | null>(null);
  const [failure, setFailure] = useState({ version: -1, message: '' });
  const setError = (message: string) => setFailure({ version, message });
  const error = failure.version === version ? failure.message : '';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const syncLocal = () => { setLocal(getLocalProfile()); setLocalPrefs(getLocalPreferences()); };
    window.addEventListener('storage', syncLocal);
    return () => window.removeEventListener('storage', syncLocal);
  }, []);
  useEffect(() => {
    if (checking) return;
    let active = true;
    setError('');
    if (!userId) { setRemote(null); setLoading(false); setLocal(getLocalProfile()); setLocalPrefs(getLocalPreferences()); return; }
    const ticket = scope.beginRead();
    setLoading(true);
    fetchAccountProfile(userId).then(value => { if (active && scope.acceptsRead(ticket)) setRemote({ userId, version, value }); })
      .catch(reason => { if (active && scope.acceptsRead(ticket)) setError(reason instanceof Error ? reason.message : 'Profilo non disponibile. Riprova.'); })
      .finally(() => { if (active && scope.acceptsRead(ticket)) setLoading(false); });
    return () => { active = false; };
  }, [checking, userId, revision, version, scope]);
  const account = remote?.userId === userId && remote.version === version ? remote.value : null;
  const profile: LocalProfile = userId ? account ? { name: account.username, faculty: account.faculty, year: String(account.enrollment_year) } : DEFAULT_PROFILE : local;
  const preferences = userId ? { anonymousReviews: account?.anonymous_reviews ?? true, notifyReviews: account?.notify_reviews ?? true, notifyMaterials: account?.notify_materials ?? true }
    : { ...localPrefs, notifyReviews: false, notifyMaterials: false };

  async function save(next: LocalProfile, nextPrefs = preferences): Promise<void> {
    if (busy.current) throw new Error('Salvataggio già in corso.');
    if (checking || loading || sessionError) throw new Error('Attendi la verifica dell’accesso e riprova.');
    if (!next.name.trim() || next.name.trim().length > 60 || !/^\d{4}$/.test(next.year)) throw new Error('Controlla il nome e l’anno di immatricolazione.');
    if (userId && !account) throw new Error('Il profilo non è ancora disponibile. Riprova il caricamento.');
    const owner = userId;
    const started = scope.capture();
    scope.invalidateReads();
    busy.current = true; setSaving(true); setError('');
    try {
      if (owner && account) {
        const value = await saveAccountProfile({ ...account, username: next.name, faculty: next.faculty, enrollment_year: Number(next.year), anonymous_reviews: nextPrefs.anonymousReviews, notify_reviews: nextPrefs.notifyReviews, notify_materials: nextPrefs.notifyMaterials }, account);
        if (!scope.isCurrent(started)) throw new Error('L’account è cambiato. Riapri il profilo.');
        scope.invalidateReads();
        setLoading(false);
        setRemote({ userId: owner, version: started, value });
      } else {
        saveLocalProfile(next); saveLocalPreferences({ anonymousReviews: nextPrefs.anonymousReviews });
        setLocal(getLocalProfile()); setLocalPrefs(getLocalPreferences());
      }
    } finally { busy.current = false; setSaving(false); }
  }
  return { version, profile, preferences, save, session, checking, loading: checking || loading, saving, error: error || sessionError, retry: sessionError ? retrySession : retry, cloud: Boolean(userId), ready: !checking && !loading && !sessionError && (!userId || Boolean(account)) };
}
