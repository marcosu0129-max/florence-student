import { useEffect, useRef, useState } from 'react';
import { createSchoolCatalogRequestScope } from './schoolCatalog';

/** Key the displayed data as well as the request, so a changed route never flashes the old plan. */
export function useSchoolData<T>(key: string, load: (retry: boolean) => Promise<T>) {
  const scope = useRef(createSchoolCatalogRequestScope());
  const loader = useRef(load); loader.current = load;
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${key}:${attempt}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null }>({ key: '', data: null, error: null });
  useEffect(() => {
    const current = scope.current;
    void current.run(() => loader.current(attempt > 0)).then(next => {
      if (next.status === 'ready') setResult({ key: requestKey, data: next.data, error: null });
      if (next.status === 'error') setResult({ key: requestKey, data: null, error: next.error.message });
    });
    return () => current.cancel();
  }, [requestKey]);
  const current = result.key === requestKey;
  return { data: current ? result.data : null, error: current ? result.error : null, loading: !current, reload: () => setAttempt(value => value + 1) };
}
