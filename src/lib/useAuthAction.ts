import { useEffect, useRef, useState } from 'react';
import { authRequest, createAuthActionGate } from './authFlow';

export function useAuthAction() {
  const [pending, setPending] = useState<string | null>(null);
  const gate = useRef<ReturnType<typeof createAuthActionGate> | null>(null);
  if (!gate.current) gate.current = createAuthActionGate();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function run<T>(name: string, action: () => PromiseLike<T>): Promise<{ accepted: true; result: T } | { accepted: false }> {
    const request = gate.current!.start(action, () => { if (mounted.current) setPending(null); });
    if (!request) return { accepted: false };
    setPending(name);
    // A timeout does not cancel an auth request. Keep the guard until the actual request settles.
    const result = await authRequest(request);
    return mounted.current ? { accepted: true, result } : { accepted: false };
  }
  return { pending, run, isMounted: () => mounted.current };
}
