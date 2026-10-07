import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { observeAccountSession, type AccountSnapshot } from './authFlow';

export function useAccountSession() {
  const [snapshot, setSnapshot] = useState<AccountSnapshot>({ session: null, checking: isSupabaseConfigured, sessionError: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    setSnapshot(previous => ({ ...previous, checking: true, sessionError: '' }));
    return observeAccountSession(supabase.auth, setSnapshot);
  }, [attempt]);

  return { ...snapshot, retrySession: () => setAttempt(value => value + 1) };
}
