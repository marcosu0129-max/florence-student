import { useId } from 'react';
import { useCatalog } from '../contexts/CatalogContext';

export function PlanYearSelect() {
  const id = useId();
  const { years, planYear, setPlanYear } = useCatalog();
  if (!years.length) return null;
  const selectedIndex = Math.max(0, years.indexOf(planYear));
  return (
    <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <p id={`${id}-label`} className="text-sm font-medium leading-5 text-text">Piano di studi · anno di ingresso</p>
      <fieldset aria-labelledby={`${id}-label`} className="relative isolate flex max-w-full min-w-0 gap-1 rounded-full border border-outline-variant bg-canvas-soft p-1">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.5rem - ${(years.length - 1) * 0.25}rem) / ${years.length})`,
            transform: `translateX(calc(${selectedIndex * 100}% + ${selectedIndex * 0.25}rem))`,
          }}
        />
        {years.map(year => (
          <label key={year} className="relative z-10 min-w-0 flex-1 cursor-pointer rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
            <input
              type="radio"
              name={id}
              value={year}
              checked={planYear === year}
              onChange={() => setPlanYear(year)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-full px-4 py-3 text-sm font-medium leading-5 text-text tabular-nums transition-colors duration-200 ease-out motion-reduce:transition-none peer-checked:text-canvas">
              {year}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

export default function CatalogNotice() {
  const { status, retry } = useCatalog();
  if (status.loading && status.source === 'unavailable') return <p role="status" className="mb-6 text-sm text-text">Caricamento del catalogo ufficiale…</p>;
  const date = status.updatedAt ? new Date(status.updatedAt).toLocaleDateString('it-IT') : null;
  return (
    <aside aria-label="Stato dei dati" className="mb-6 flex flex-col gap-3 rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-ink">
          {status.source === 'cloud' ? 'Catalogo ufficiale UNIFI' : status.source === 'official-snapshot' ? 'Catalogo ufficiale · copia verificata' : 'Catalogo non disponibile'}
        </p>
        <p className="mt-1 text-text" role={status.error ? 'alert' : undefined}>
          {status.source === 'official-snapshot' ? 'Stai consultando dati acquisiti dalle fonti ufficiali.' : 'Prima fase: corso di laurea LM-92.'}
          {date ? ` Versione del catalogo: ${date}.` : ''}
          {status.cloudError ? ' Il collegamento al database non è disponibile.' : ''}
          {status.error ? ` ${status.error}` : ''}
        </p>
      </div>
      {(status.cloudError || status.error) && <button type="button" onClick={() => { void retry().catch(() => {}); }} disabled={status.loading} className="shrink-0 self-start rounded-full border border-outline-variant px-4 py-2 font-semibold text-ink disabled:opacity-50">{status.loading ? 'Connessione…' : 'Riprova connessione'}</button>}
    </aside>
  );
}

export function CatalogLoading() {
  return <p role="status" className="py-12 text-center text-text">Caricamento…</p>;
}

export function CatalogError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="rounded-xl border border-outline-variant p-6"><p className="text-text">{message}</p><button type="button" onClick={retry} className="mt-4 rounded-full bg-ink px-5 py-2 text-canvas">Riprova</button></div>;
}
