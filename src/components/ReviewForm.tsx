import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import StarRatingInput from './StarRatingInput';
import { getLocalPreferences } from '../lib/localProfile';
import { safeReturnPath, returnNavigationState } from '../lib/navigation';

export type RatingField = { key: string; label: string; icon: string; descriptions: string[] };
export type ReviewFormValues = { ratings: Record<string, number>; content: string; isAnonymous: boolean; storage: 'local' | 'cloud' };

type ReviewFormProps = {
  fields: RatingField[];
  backTo: string;
  savedTo: string;
  disabled?: boolean;
  cloudAvailable?: boolean;
  initial?: Omit<ReviewFormValues, 'storage'>;
  editing?: boolean;
  loginTo?: string;
  onLogin?: (values: Omit<ReviewFormValues, 'storage'>) => void;
  onSubmit: (values: ReviewFormValues) => Promise<{ success: boolean; error?: string }>;
};

export default function ReviewForm({ fields, backTo, savedTo, onSubmit, disabled = false, cloudAvailable = false, initial, editing = false, loginTo, onLogin }: ReviewFormProps) {
  const location = useLocation();
  const returnTo = safeReturnPath(location.state?.from) || backTo;
  const returnState = returnNavigationState(location.state);
  const returnIsList = /^\/(?:my-reviews|all-reviews)(?:\?|$)/.test(returnTo);
  const savedTarget = /^\/my-reviews(?:\?|$)/.test(returnTo) ? returnTo : savedTo;
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const savedRef = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const [ratings, setRatings] = useState<Record<string, number>>(initial?.ratings || {});
  const [content, setContent] = useState(initial?.content || '');
  const [storage, setStorage] = useState<'local' | 'cloud'>(cloudAvailable ? 'cloud' : 'local');
  const [isAnonymous, setIsAnonymous] = useState(() => initial?.isAnonymous ?? getLocalPreferences().anonymousReviews);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const validContent = content.trim().length >= 20 && content.length <= 5000;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (saved) savedRef.current?.focus(); }, [saved]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || saved || disabled) return;
    setAttempted(true);
    if (!validContent || fields.some(field => !ratings[field.key])) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setError('');
    try {
      const result = await onSubmit({ ratings, content: content.trim(), isAnonymous, storage });
      if (!mounted.current) return;
      if (!result.success) setError(result.error || 'Salvataggio non riuscito. Riprova.');
      else setSaved(true);
    } catch {
      if (mounted.current) setError('Salvataggio non riuscito. Il testo è conservato nel modulo; riprova.');
    } finally {
      busy.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }

  if (saved) return <section role="status" className="rounded-xl border border-outline-variant bg-card-base p-6">
    <h2 ref={savedRef} tabIndex={-1} className="text-xl font-semibold text-ink text-balance">{storage === 'cloud' ? editing ? 'Recensione aggiornata' : 'Recensione pubblicata' : 'Bozza salvata sul dispositivo'}</h2>
    <p className="mt-3 text-sm leading-relaxed text-text text-pretty">{storage === 'cloud' ? 'Il salvataggio sul tuo account è stato confermato. Le eventuali bozze locali restano conservate.' : 'È una bozza privata, visibile solo in questo browser. Puoi riaprirla dalle tue recensioni e scegliere di pubblicarla.'}</p>
    <div className="mt-6 flex flex-wrap gap-4"><Link to={savedTarget} state={savedTarget === returnTo ? returnState : { restoreScroll: true }} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas">Le mie recensioni</Link>{returnTo !== savedTarget && <Link to={returnTo} state={returnState} className="rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold text-ink">{returnIsList ? 'Torna all’elenco' : 'Torna alla scheda'}</Link>}</div>
  </section>;

  return <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={submitting || disabled} className="space-y-6">
    <aside className="rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm leading-relaxed text-text text-pretty">{storage === 'cloud' ? 'La recensione sarà associata al tuo account. Il nome pubblico dipende dalla scelta di anonimato qui sotto.' : 'La bozza sarà salvata solo su questo dispositivo.'}{!cloudAvailable && (onLogin ? <button type="button" className="mt-2 block min-h-11 font-semibold underline underline-offset-4" onClick={() => { try { onLogin({ ratings, content, isAnonymous }); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Impossibile conservare il testo. Riprova.'); } }}>Accedi per pubblicare · conserva il testo</button> : loginTo && <Link to={loginTo} className="mt-2 block font-semibold underline underline-offset-4">Accedi per pubblicare</Link>)}</aside>
    {cloudAvailable && !editing && <fieldset className="flex flex-wrap gap-4 rounded-xl border border-outline-variant p-4"><legend className="px-2 text-sm font-semibold text-ink">Dove salvare</legend>{([{ value: 'cloud', label: 'Pubblica nella comunità' }, { value: 'local', label: 'Conserva come bozza locale' }] as const).map(option => <label key={option.value} className="flex min-h-11 items-center gap-2 text-sm text-ink"><input type="radio" name={`${id}-storage`} value={option.value} checked={storage === option.value} onChange={() => setStorage(option.value)} disabled={submitting || disabled} className="size-4 accent-ink" />{option.label}</label>)}</fieldset>}

    <div className="space-y-3">{fields.map(field => <StarRatingInput key={field.key} label={field.label} icon={field.icon} descriptions={field.descriptions} value={ratings[field.key] || 0} onChange={value => setRatings(previous => ({ ...previous, [field.key]: value }))} disabled={submitting || disabled} error={attempted && !ratings[field.key] ? 'Seleziona una valutazione da 1 a 5.' : undefined} />)}</div>
    <div>
      <label htmlFor={`${id}-content`} className="mb-3 block text-base font-semibold text-ink">Descrizione dell’esperienza <span className="font-normal">(obbligatoria)</span></label>
      <textarea id={`${id}-content`} value={content} onChange={event => setContent(event.target.value)} disabled={submitting || disabled} rows={6} maxLength={5000} required aria-invalid={attempted && !validContent} aria-describedby={`${id}-content-help${attempted && !validContent ? ` ${id}-content-error` : ''}`} placeholder="Racconta la tua esperienza…" className="min-h-40 w-full resize-y rounded-xl border border-outline-variant bg-canvas p-4 text-base leading-relaxed text-ink placeholder:text-text-muted disabled:opacity-60" />
      <p id={`${id}-content-help`} className="mt-2 text-xs text-text tabular-nums">Almeno 20 caratteri, esclusi gli spazi iniziali e finali. {content.trim().length}/5000.</p>
      {attempted && !validContent && <p id={`${id}-content-error`} className="mt-2 text-sm text-error">Scrivi almeno 20 caratteri per descrivere la tua esperienza.</p>}
    </div>
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-text"><input type="checkbox" checked={isAnonymous} onChange={event => setIsAnonymous(event.target.checked)} disabled={submitting || disabled} className="mt-0.5 size-5 shrink-0 accent-ink" /><span>Mostra “Studente anonimo”. Se disattivato, una recensione pubblicata mostrerà il nome del tuo profilo.</span></label>
    {error && <p role="alert" className="rounded-xl border border-error/30 p-4 text-sm text-error">{error}</p>}
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <Link to={returnTo} state={returnState} className="rounded-full border border-outline-variant px-6 py-3 text-center text-sm font-semibold text-ink">Annulla</Link>
      <button type="submit" disabled={submitting || disabled} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-opacity duration-150 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Salvataggio…' : storage === 'cloud' ? editing ? 'Salva modifiche' : 'Pubblica recensione' : 'Salva bozza sul dispositivo'}</button>
    </div>
  </form>;
}
