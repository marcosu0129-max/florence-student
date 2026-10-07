import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getSavedCourseIds } from './communityStorage';
import { useAccountSession } from './useAccountSession';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCommunityIdentity } from './schoolCommunityIdentity';
import { fetchSchoolAccountFavorites, invalidateSchoolAccountFavorites, schoolFavoriteActions } from './schoolSavedCourses';

const CLOUD_EVENT = 'florence:account-favorites-change';
export function useSavedCourses() {
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const userId = session?.user.id || null;
  const ownerKey = userId || 'guest';
  const { planYear } = useCatalog();
  const currentAccount = useRef({ userId, checking, version: 0 });
  if (currentAccount.current.userId !== userId || currentAccount.current.checking !== checking) {
    currentAccount.current = { userId, checking, version: currentAccount.current.version + 1 };
  }
  useSyncExternalStore(schoolCommunityIdentity.subscribe, schoolCommunityIdentity.getRevision, schoolCommunityIdentity.getRevision);
  const [localIds, setLocalIds] = useState(getSavedCourseIds);
  const [remote, setRemote] = useState<{ userId: string; ids: string[] } | null>(null);
  const [readState, setReadState] = useState<{ owner: string; loading: boolean; error: string | null }>({ owner: '', loading: false, error: null });
  const [message, setMessage] = useState<{ owner: string; error: string | null }>({ owner: '', error: null });
  const [revision, setRevision] = useState(0);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const busy = useRef(new Map<number, { owner: string; id: string }>());
  const sequence = useRef(0);
  const [pending, setPending] = useState<Array<{ owner: string; id: string }>>([]);
  const importBusy = useRef(new Set<string>());
  const [importState, setImportState] = useState({ owner: '', loading: false, message: '' });
  const retry = useCallback(() => { schoolCommunityIdentity.invalidate(); setRevision(value => value + 1); }, []);
  const reread = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const update = () => { setLocalIds(getSavedCourseIds()); reread(); };
    window.addEventListener('storage', update);
    window.addEventListener('florence:saved-courses-change', update);
    window.addEventListener(CLOUD_EVENT, reread);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('florence:saved-courses-change', update); window.removeEventListener(CLOUD_EVENT, reread); };
  }, [reread]);
  useEffect(() => {
    let active = true;
    setIdentityLoading(true);
    schoolCommunityIdentity.readyCatalog().then(() => { if (active) setIdentityError(null); })
      .catch(reason => { if (active) setIdentityError(reason instanceof Error ? reason.message : 'Catalogo non disponibile. Riprova.'); })
      .finally(() => { if (active) setIdentityLoading(false); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    if (checking) return;
    let active = true;
    if (!userId) { setRemote(null); return; }
    setReadState({ owner: userId, loading: true, error: null });
    fetchSchoolAccountFavorites(userId).then(async rows => {
      // Resolve cloud IDs before enabling buttons; exported source IDs can differ from retained business IDs.
      await schoolCommunityIdentity.resolveCourses(rows.map(row => row.course_id));
      if (active && currentAccount.current.userId === userId && !currentAccount.current.checking) setRemote({ userId, ids: [...new Set(rows.map(row => row.course_id))] });
    }).catch(reason => { if (active) setReadState({ owner: userId, loading: false, error: reason instanceof Error ? reason.message : 'Preferiti non disponibili. Riprova.' }); })
      .finally(() => { if (active) setReadState(previous => previous.owner === userId ? { ...previous, loading: false } : previous); });
    return () => { active = false; };
  }, [checking, userId, revision]);
  const loading = checking || Boolean(userId && (readState.owner !== userId || readState.loading));
  const importing = importState.owner === ownerKey && importState.loading;
  const savedIds = checking ? [] : userId ? remote?.userId === userId ? remote.ids : [] : localIds;
  const key = schoolCommunityIdentity.canonicalCourseKey;
  const isSaved = (id: string) => savedIds.some(saved => key(saved) === key(id));
  const pendingIds = pending.filter(item => item.owner === ownerKey).map(item => item.id);
  const isPending = (id: string) => pendingIds.some(pendingId => key(pendingId) === key(id));
  const isCurrent = (owner: string | null, version: number) => currentAccount.current.userId === owner && !currentAccount.current.checking && currentAccount.current.version === version;

  async function toggle(id: string) {
    if (checking || sessionError || loading || identityLoading || importing
      || [...busy.current.values()].some(item => item.owner === ownerKey && key(item.id) === key(id))) return null;
    const owner = userId;
    const version = currentAccount.current.version;
    if (owner && remote?.userId !== owner) { setMessage({ owner: ownerKey, error: 'Carica i corsi salvati prima di modificarli.' }); return null; }
    const request = ++sequence.current;
    busy.current.set(request, { owner: ownerKey, id }); setPending([...busy.current.values()]); setMessage({ owner: ownerKey, error: null });
    try {
      const result = await schoolFavoriteActions.toggle(id, savedIds, { owner, planYear, isCurrent: () => isCurrent(owner, version) });
      if (!result || !isCurrent(owner, version)) return null;
      if (owner) {
        setRemote(previous => ({ userId: owner, ids: result.saved ? [...new Set([...(previous?.userId === owner ? previous.ids : []), result.courseId])]
          : (previous?.userId === owner ? previous.ids : []).filter(saved => !result.removedIds.includes(saved)) }));
      } else setLocalIds(getSavedCourseIds());
      return result.saved;
    } catch (reason) { if (isCurrent(owner, version)) setMessage({ owner: ownerKey, error: reason instanceof Error ? reason.message : 'Salvataggio non riuscito. Riprova.' }); return null; }
    finally {
      busy.current.delete(request); setPending([...busy.current.values()]);
      // Removal can commit some aliases before a later request fails. Reconcile that partial result too.
      if (owner) { invalidateSchoolAccountFavorites(owner); window.dispatchEvent(new Event(CLOUD_EVENT)); }
    }
  }
  async function importLocal(): Promise<void> {
    if (!userId || checking || loading || identityLoading || sessionError || importBusy.current.has(ownerKey) || pendingIds.length) return;
    const owner = userId; const version = currentAccount.current.version;
    importBusy.current.add(ownerKey); setImportState({ owner: ownerKey, loading: true, message: '' });
    setMessage({ owner: ownerKey, error: null });
    try {
      const result = await schoolFavoriteActions.importLocal({ owner, planYear, isCurrent: () => isCurrent(owner, version) });
      if (isCurrent(owner, version)) setImportState({ owner: ownerKey, loading: false, message: [
        `${result.imported} corsi sincronizzati.`, result.notReady ? `${result.notReady} corsi non sono ancora pronti per l’account.` : '',
        result.missing ? `${result.missing} preferiti non sono ancora nel catalogo.` : '',
        result.unavailable ? `Verifica della connessione non riuscita per ${result.unavailable} corsi.` : '', result.error || '',
        'La copia locale è conservata. Puoi riprovare senza duplicati.',
      ].filter(Boolean).join(' ') });
    } finally {
      importBusy.current.delete(ownerKey);
      setImportState(previous => previous.owner === ownerKey ? { ...previous, loading: false } : previous);
      invalidateSchoolAccountFavorites(owner);
      window.dispatchEvent(new Event(CLOUD_EVENT));
    }
  }
  const error = (message.owner === ownerKey ? message.error : null) || (readState.owner === userId ? readState.error : null) || identityError || sessionError;
  return { savedIds, isSaved, toggle, error, clearError: useCallback(() => setMessage({ owner: ownerKey, error: null }), [ownerKey]), loading,
    pendingIds, isPending, unavailable: checking || loading || identityLoading || importing || Boolean(sessionError) || Boolean(userId && (remote?.userId !== userId || readState.error)),
    retry: sessionError ? retrySession : retry, cloud: Boolean(userId), ownerKey, importLocal, importing,
    importMessage: importState.owner === ownerKey ? importState.message : '', localCount: new Set(localIds.map(key)).size };
}
