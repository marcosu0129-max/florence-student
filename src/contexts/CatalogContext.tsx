import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCatalogStatus, subscribeCatalogStatus, retryCatalog, getCatalogAcademicYears, getDefaultAcademicYear } from '../lib/catalog';
import { schoolCatalog } from '../lib/schoolCatalog';

// Supported admission cohorts in this release; the school manifest extends these after loading.
const SUPPORTED_PLAN_YEARS = ['2026/2027', '2025/2026'];

type CatalogContextValue = {
  planYear: string;
  programKey: string;
  setPlanYear: (year: string) => void;
  years: string[];
  revision: number;
  retry: () => Promise<void>;
  status: ReturnType<typeof getCatalogStatus>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function catalogLink(path: string, planYear: string, programKey?: string) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  if (planYear) params.set('year', planYear);
  if (programKey && !params.has('program')) params.set('program', programKey);
  return `${pathname}${params.size ? `?${params.toString()}` : ''}`;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const status = useSyncExternalStore(subscribeCatalogStatus, getCatalogStatus, getCatalogStatus);
  const [planYear, updatePlanYear] = useState(() => new URLSearchParams(location.search).get('year') || getDefaultAcademicYear() || SUPPORTED_PLAN_YEARS[0]);
  const [selectedProgram, updateProgram] = useState(() => new URLSearchParams(location.search).get('program') || '');
  const requestedProgram = new URLSearchParams(location.search).get('program');
  const programKey = requestedProgram || selectedProgram;
  useEffect(() => { if (requestedProgram) updateProgram(requestedProgram); }, [requestedProgram]);
  const [revision, setRevision] = useState(0);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    schoolCatalog.index().then(index => { if (active) setSchoolYears([...new Set(index.programs.flatMap(program => program.cohorts.map(cohort => cohort.plan_year)))].sort().reverse()); }).catch(() => { /* Individual catalog pages show retryable errors; account pages stay usable. */ });
    return () => { active = false; };
  }, [revision]);
  const legacyYears = getCatalogAcademicYears();
  const years = schoolYears.length ? schoolYears : legacyYears.length ? legacyYears : SUPPORTED_PLAN_YEARS;

  useEffect(() => {
    if (!years.length) return;
    const requested = new URLSearchParams(location.search).get('year');
    const nextYear = requested && years.includes(requested) ? requested : years.includes(planYear) ? planYear : years[0];
    if (nextYear !== planYear) updatePlanYear(nextYear);
    if (requested && requested !== nextYear) {
      const query = new URLSearchParams(location.search);
      query.set('year', nextYear);
      navigate({ pathname: location.pathname, search: `?${query}` }, { replace: true, state: location.state });
    }
  }, [location.pathname, location.search, location.state, years.join('|'), planYear, navigate]);

  const setPlanYear = useCallback((year: string) => {
    updatePlanYear(year);
    const query = new URLSearchParams(location.search);
    query.set('year', year);
    ['offering', 'academicYear', 'profileYear'].forEach(key => query.delete(key));
    navigate({ pathname: location.pathname, search: `?${query}` }, { replace: true, state: location.state });
  }, [location.pathname, location.search, location.state, navigate]);

  const retry = useCallback(async () => {
    try { await retryCatalog(); }
    finally { setRevision(value => value + 1); }
  }, []);

  return <CatalogContext.Provider value={{ planYear, programKey, setPlanYear, years, revision, retry, status }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('CatalogProvider mancante');
  return value;
}

export function useCatalogData<T>(loader: () => Promise<T>, dependencies: unknown[], initial: T) {
  const { revision, status } = useCatalog();
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loaderRef.current().then(result => {
      if (active) setData(result);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Impossibile caricare i dati.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [revision, attempt, status.source, status.updatedAt, ...dependencies]);

  return { data, loading, error, reload: () => setAttempt(value => value + 1) };
}
