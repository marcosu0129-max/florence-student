import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import FilterSelect from '../components/FilterSelect';
import SearchBar from '../components/SearchBar';
import SegmentedControl from '../components/SegmentedControl';
import BottomSheet from '../components/BottomSheet';
import MaterialUploadForm from '../components/MaterialUploadForm';
import { CatalogError, PlanYearSelect } from '../components/CatalogNotice';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { schoolCommunityIdentity } from '../lib/schoolCommunityIdentity';
import { useSchoolData } from '../lib/useSchoolData';
import { useAccountSession } from '../lib/useAccountSession';
import { authPageUrl } from '../lib/authFlow';
import { createCommunityRequestScope } from '../lib/communityRequestScope';
import { createProfileRequestScope } from '../lib/profileRequestScope';
import { mergeMaterialRows } from '../lib/materialPagination';
import { fetchMaterialPage, type ListingCursor } from '../lib/materialListingApi';
import { materialCourseChoices } from '../lib/materialCourseChoices';
import { downloadMaterial, finalizeMaterial, materialSize, materialStatus, withdrawMaterial, type MaterialRecord } from '../lib/materialsApi';

export default function Materials() {
  const { planYear } = useCatalog();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const mine = params.get('mine') === '1';
  const courseFilter = params.get('course') || '';
  const query = params.get('q') || '';
  const type = params.get('type') || '';
  const { session, checking, sessionError, retrySession } = useAccountSession();
  const userId = session?.user.id || '';
  const accountScope = useRef(createProfileRequestScope()).current;
  const accountVersion = accountScope.update(userId, checking || Boolean(sessionError));

  const { data: catalogue, loading: coursesLoading, error: coursesError, reload: reloadCourses } = useSchoolData('materials-school-search', retry => schoolCatalog.search({ retry }));
  const courses = useMemo(() => (catalogue?.courses || []).filter(course => course.contexts.some(context => context.cohort_year === Number(planYear.slice(0, 4)))).map(course => ({ id: course.id, name: course.name, officialCode: course.official_code })), [catalogue, planYear]);
  const courseScopeKey = `${userId}:${mine}:${courseFilter}:${planYear}`;
  const scopeKey = JSON.stringify([userId, mine, courseFilter, planYear, query.trim(), type]);
  const requests = useRef(createCommunityRequestScope()).current;
  const scopeVersion = requests.update(scopeKey, checking || Boolean(sessionError));
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; requests.dispose(); }; }, [requests]);
  const acceptsCallback = () => mounted.current && requests.isCurrent(scopeVersion);
  const [courseSearch, setCourseSearch] = useState({ key: '', query: '' });
  const courseQuery = courseSearch.key === courseScopeKey ? courseSearch.query : '';
  const searchCourses = (value: string) => setCourseSearch({ key: courseScopeKey, query: value });
  const [listing, setListing] = useState<{ key: string; items: MaterialRecord[]; nextCursor: ListingCursor | null }>({ key: '', items: [], nextCursor: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const [pagination, setPagination] = useState<{ key: string; cursor: ListingCursor | null }>({ key: '', cursor: null });
  const cursor = pagination.key === scopeKey ? pagination.cursor : null;
  const setCursor = (value: ListingCursor | null) => setPagination({ key: scopeKey, cursor: value });
  const [hasMore, setHasMore] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [action, setAction] = useState('');

  const [withdrawal, setWithdrawal] = useState<MaterialRecord | null>(null);
  const [actionError, setActionError] = useState('');
  const [refreshingDraft, setRefreshingDraft] = useState('');
  const changeParams = (patch: Record<string, string>) => {
    if (Object.hasOwn(patch, 'course')) searchCourses('');
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) { if (value) next.set(key, value); else next.delete(key); }
    next.set('year', planYear); setParams(next, { replace: true });
  };
  const refresh = () => { requests.invalidateReads(); setCursor(null); setRevision(value => value + 1); };

  useEffect(() => { setAction(''); setRefreshingDraft(''); setUploading(false); }, [scopeVersion]);
  // Upload completion changes filters; its confirmation belongs to the account, not that view.
  useEffect(() => { setMessage(''); }, [accountVersion]);
  useEffect(() => { setCursor(null); setCourseSearch({ key: courseScopeKey, query: '' }); setShowUpload(false); setActionError(''); setWithdrawal(null); }, [userId, mine, courseFilter, planYear]);
  useEffect(() => {
    if (checking || !userId || sessionError) return;
    let active = true; const ticket = requests.beginRead(); const accepts = () => active && requests.acceptsRead(ticket);
    setLoading(true); setError('');
    const timer = setTimeout(() => { void (async () => {
      const cloudId = courseFilter ? (await schoolCommunityIdentity.requireCourse(courseFilter)).identity.communityId : null;
      return fetchMaterialPage({ courseId: cloudId, mine, query, fileType: type, planYear: mine ? null : planYear }, cursor);
    })().then(page => {
      if (!accepts()) return;
      setListing(current => ({ key: scopeKey, items: mergeMaterialRows(cursor && current.key === scopeKey ? current.items : [], page.items), nextCursor: page.nextCursor }));
      setHasMore(page.hasMore);
    }).catch(reason => { if (accepts()) setError(reason instanceof Error ? reason.message : 'Impossibile caricare i materiali.'); })
      .finally(() => { if (accepts()) setLoading(false); }); }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [checking, userId, sessionError, courseFilter, mine, revision, cursor, scopeKey, scopeVersion]);
  const materials = listing.key === scopeKey ? listing.items : [];
  const visible = materials;
  const courseChoices = useMemo(() => materialCourseChoices(courses, courseQuery, courseFilter, materials[0]?.course_name || 'Corso del collegamento'), [courses, courseQuery, courseFilter, materials[0]?.course_name]);

  async function runAction(id: string, work: () => Promise<unknown>, success: string, reload = false) {
    const ticket = requests.beginOperation(); if (!ticket) return;
    setAction(id); setActionError(''); setMessage('');
    try { await work(); if (requests.acceptsOperation(ticket)) { setMessage(success); setWithdrawal(null); if (reload) refresh(); } }
    catch (reason) { if (requests.acceptsOperation(ticket)) setActionError(reason instanceof Error ? reason.message : 'Operazione non riuscita. Riprova.'); }
    finally { if (requests.finishOperation(ticket)) { setAction(''); setRefreshingDraft(''); } }
  }

  return <Layout showBack catalogNotice={false} backTo="/profile"><div className="flex flex-col gap-6">
    <header><h1 className="text-3xl font-semibold text-ink text-balance sm:text-4xl lg:text-6xl">Centro materiali</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-text text-pretty">Appunti e materiali condivisi dagli studenti, verificati prima della pubblicazione. I file sono disponibili agli utenti connessi.</p></header>
    {checking ? <p role="status" className="py-8 text-sm text-text">Verifica dell’accesso…</p> : sessionError ? <CatalogError message={sessionError} retry={retrySession} /> : !session ? <section className="rounded-2xl border border-outline-variant bg-card-base p-6"><h2 className="text-xl font-semibold text-balance">Accedi per consultare e condividere i materiali</h2><p className="mt-3 text-sm leading-relaxed text-text">Il catalogo dei corsi e le fonti ufficiali sono consultabili anche senza account.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas" to={authPageUrl('/login', location.pathname + location.search, planYear)}>Accedi</Link><Link className="inline-flex min-h-11 items-center px-3 text-sm underline underline-offset-4" to={catalogLink('/courses', planYear)}>Esplora i corsi</Link></div></section> : <>
      <fieldset disabled={uploading}><PlanYearSelect /></fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3"><SegmentedControl label="Materiali da visualizzare" value={mine ? 'mine' : 'published'} options={[{ value: 'published', label: 'Pubblicati' }, { value: 'mine', label: 'I miei materiali' }]} disabled={uploading} onValueChange={value => changeParams({ mine: value === 'mine' ? '1' : '' })} /><button type="button" onClick={() => { setMessage(''); setShowUpload(value => !value); }} disabled={uploading || coursesLoading || Boolean(coursesError)} aria-expanded={showUpload} className="min-h-11 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">{showUpload ? 'Chiudi modulo' : 'Condividi materiale'}</button></div>
      {coursesError && <CatalogError message={coursesError} retry={reloadCourses} />}
      {showUpload && <MaterialUploadForm key={`${scopeVersion}:${userId}:${planYear}`} courses={courses} userId={userId} planYear={planYear} initialCourse={courseFilter} onBusyChange={value => { if (acceptsCallback()) setUploading(value); }} onClose={() => { if (acceptsCallback()) setShowUpload(false); }} onComplete={() => { if (!acceptsCallback()) return; setShowUpload(false); setMessage('Materiale caricato e inviato alla moderazione. Lo trovi nei tuoi materiali.'); changeParams({ mine: '1', course: '', q: '', type: '' }); refresh(); }} onDraft={() => { if (!acceptsCallback()) return; setMessage('Caricamento non confermato. Controlla i tuoi materiali prima di inviare di nuovo: puoi confermare un file già caricato oppure ritirare una bozza. Se l’elenco è vuoto dopo averlo aggiornato, riprova il caricamento.'); changeParams({ mine: '1', course: '', q: '', type: '' }); refresh(); }} />}
      {message && <p role="status" className="rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm text-text">{message}</p>}
      {actionError && !withdrawal && <p role="alert" className="rounded-xl border border-error/30 p-4 text-sm text-error">{actionError}</p>}
      <fieldset disabled={uploading} className="space-y-4"><SearchBar placeholder="Cerca titolo, corso o autore…" value={query} onChange={value => changeParams({ q: value.slice(0, 200) })} onSubmit={value => changeParams({ q: value.slice(0, 200) })} />
      <p className="text-xs leading-relaxed text-text">La ricerca considera tutti i materiali della selezione, anche quelli non ancora caricati. Massimo 200 caratteri.</p>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-3">
          <label htmlFor="material-filter-course-search" className="block text-sm font-semibold">Cerca un corso nella scuola</label>
          <input id="material-filter-course-search" type="search" value={courseQuery} onChange={event => searchCourses(event.target.value)} disabled={coursesLoading || Boolean(coursesError)} aria-describedby="material-filter-course-help material-filter-course-results" placeholder="Nome o codice dell’insegnamento" className="w-full min-w-0 rounded-xl border border-outline-variant bg-canvas px-4 py-3 text-base text-ink disabled:opacity-60" />
          <p id="material-filter-course-help" className="text-xs leading-relaxed text-text">Cerca e scegli un corso per filtrare i materiali.</p>
          <FilterSelect label="Corso" value={courseFilter} disabled={uploading || coursesLoading} onValueChange={value => changeParams({ course: value })} options={courseChoices.options} />
          <p id="material-filter-course-results" role="status" className="text-xs leading-relaxed text-text tabular-nums">{coursesLoading ? 'Caricamento dei corsi…' : coursesError ? 'Elenco corsi non disponibile. Riprova il caricamento sopra.' : <>{courseChoices.matchCount === 0 ? 'Nessun corso trovato.' : courseChoices.shownMatchCount < courseChoices.matchCount ? `Mostrati ${courseChoices.shownMatchCount} di ${courseChoices.matchCount} corsi. Scrivi un nome o codice più preciso.` : `${courseChoices.matchCount} ${courseChoices.matchCount === 1 ? 'corso trovato' : 'corsi trovati'}.`}{courseChoices.selectionOutsideMatches && ' Il corso selezionato resta disponibile nell’elenco.'}</>}</p>
          {courseQuery && <button type="button" onClick={() => searchCourses('')} className="min-h-11 text-sm underline underline-offset-4">Azzera ricerca corsi</button>}
        </div>
        <FilterSelect label="Formato" value={type} onValueChange={value => changeParams({ type: value })} options={[{ value: '', label: 'Tutti i formati' }, { value: 'pdf', label: 'PDF' }, { value: 'doc', label: 'Documenti e slide' }, { value: 'image', label: 'Immagini' }, { value: 'audio', label: 'Audio' }]} />
      </div></fieldset>
      {mine && <p className="text-sm text-text">I tuoi caricamenti di tutti i piani, compresi quelli in attesa di approvazione. Puoi completare o ritirare una bozza.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-text tabular-nums">{loading ? visible.length ? 'Aggiornamento materiali… I risultati precedenti restano visibili.' : 'Caricamento materiali…' : `${visible.length} ${visible.length === 1 ? 'materiale caricato' : 'materiali caricati'}${hasMore && listing.key === scopeKey ? ' · altri disponibili' : ''}`}</p>
        <button type="button" disabled={loading || uploading || Boolean(action)} onClick={() => { setMessage(''); setActionError(''); refresh(); }} className="min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold disabled:opacity-60">Aggiorna elenco</button>
      </div>
      {error && <CatalogError message={error} retry={refresh} />}
      {loading && !visible.length ? null : !visible.length ? <section className="rounded-2xl border border-outline-variant p-6 text-center"><Icon name="folder_open" size={28} className="mx-auto" /><h2 className="mt-4 text-xl font-semibold text-balance">{error ? 'Materiali non disponibili' : 'Nessun materiale da mostrare'}</h2><p className="mt-3 text-sm leading-relaxed text-text">{error ? 'Riprova il caricamento per verificare i tuoi materiali.' : mine ? 'I file che condividi compariranno qui con il loro stato.' : 'Non sono presenti materiali pubblicati per questa selezione.'}</p>{(query || type || courseFilter) && <button type="button" onClick={() => changeParams({ q: '', type: '', course: '' })} className="mt-5 min-h-11 rounded-full border border-outline-variant px-5 py-2 text-sm font-semibold">Azzera filtri</button>}</section> : <ul aria-busy={loading} className="grid gap-4 md:grid-cols-2">{visible.map(item => <li key={item.id} className="flex min-w-0 flex-col rounded-2xl border border-border-card bg-card-base p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-text"><span className="rounded-full border border-outline-variant px-3 py-1 uppercase">{item.file_type}</span><span className="tabular-nums">{materialSize(item.file_size)}</span>{mine && <span className="rounded-full bg-canvas px-3 py-1 font-medium">{materialStatus(item.status)}</span>}</div>
        <h2 className="mt-4 break-words text-lg font-semibold text-balance">{item.title}</h2><Link to={catalogLink(`/courses/${item.course_id}`, item.plan_year || planYear)} className="mt-2 self-start text-sm text-text underline underline-offset-4">{item.course_name}</Link>{item.description && <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-text">{item.description}</p>}
        <p className="mt-4 text-xs leading-relaxed text-text">{item.uploader} · {new Date(item.created_at).toLocaleDateString('it-IT')}{item.plan_year ? ` · Piano ${item.plan_year}` : ''}</p>{item.moderation_note && <p className="mt-3 rounded-xl bg-canvas p-3 text-sm leading-relaxed text-text">Nota della moderazione: {item.moderation_note}</p>}
        <div className="mt-5 flex flex-wrap gap-2">{item.storage_path && !['withdrawn', 'draft', 'legacy'].includes(item.status) && <button type="button" disabled={Boolean(action)} onClick={() => void runAction(item.id, () => downloadMaterial(item, userId), 'Il file è stato preparato per il download.')} className="min-h-11 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-60">{action === item.id && refreshingDraft !== item.id ? 'Attendi…' : 'Scarica'}</button>}{mine && item.status === 'draft' && <button type="button" disabled={Boolean(action)} onClick={() => { setRefreshingDraft(item.id); void runAction(item.id, () => finalizeMaterial(item.id, userId), 'Caricamento confermato e inviato alla moderazione.', true); }} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Conferma caricamento</button>}{mine && item.status !== 'withdrawn' && <button type="button" disabled={Boolean(action)} onClick={() => { setActionError(''); setWithdrawal(item); }} className="min-h-11 rounded-full border border-outline-variant px-4 py-2 text-sm font-semibold disabled:opacity-60">Ritira</button>}</div>
      </li>)}</ul>}
      {listing.key === scopeKey && hasMore && <button type="button" onClick={() => { setCursor(listing.nextCursor); setRevision(value => value + 1); }} disabled={loading} className="min-h-11 self-center rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">{loading ? 'Caricamento…' : error ? 'Riprova caricamento' : 'Carica altri materiali'}</button>}
    </>}
    <BottomSheet open={Boolean(withdrawal)} onClose={() => { if (!action) setWithdrawal(null); }} role="alertdialog" title="Ritirare il materiale?" description="Il materiale non sarà più disponibile agli altri studenti. Il caricamento resterà nel tuo elenco con lo stato Ritirato.">{withdrawal && <><p className="mb-4 break-words text-sm font-semibold">{withdrawal.title}</p>{actionError && <p role="alert" className="mb-4 text-sm text-error">{actionError}</p>}<div className="flex flex-wrap gap-3"><button type="button" disabled={Boolean(action)} onClick={() => setWithdrawal(null)} className="min-h-11 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">Annulla</button><button type="button" disabled={Boolean(action)} onClick={() => void runAction(withdrawal.id, () => withdrawMaterial(withdrawal.id, userId), 'Materiale ritirato. Non è più disponibile agli altri studenti.', true)} className="min-h-11 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{action ? 'Ritiro…' : 'Ritira materiale'}</button></div></>}</BottomSheet>
  </div></Layout>;
}
