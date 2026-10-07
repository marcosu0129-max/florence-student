import { useRef, useState, type FormEvent } from 'react';
import type { Course } from '../lib/catalogTypes';
import FilterSelect from './FilterSelect';
import { schoolCommunityIdentity } from '../lib/schoolCommunityIdentity';
import { MATERIAL_ACCEPT, MaterialUploadError, materialSize, uploadMaterial, validateMaterialFile } from '../lib/materialsApi';

export default function MaterialUploadForm({ courses, planYear, userId, initialCourse, onComplete, onDraft, onClose, onBusyChange }: {
  courses: Array<Pick<Course, 'id' | 'name' | 'officialCode'>>; planYear: string; userId: string; initialCourse?: string; onComplete: () => void; onDraft: () => void; onClose: () => void; onBusyChange: (busy: boolean) => void;
}) {
  const [courseId, setCourseId] = useState(courses.some(course => course.id === initialCourse) ? initialCourse! : '');
  const [courseQuery, setCourseQuery] = useState('');
  const courseOptions = courses.filter(course => course.id === courseId || `${course.name} ${course.officialCode}`.toLocaleLowerCase('it').includes(courseQuery.trim().toLocaleLowerCase('it')));
  const shortlist = courseOptions.slice(0, 50);
  const selectedCourse = courses.find(course => course.id === courseId);
  if (selectedCourse && !shortlist.some(course => course.id === courseId)) shortlist.unshift(selectedCourse);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const locked = useRef(false);
  const inputClass = 'w-full min-w-0 rounded-xl border border-outline-variant bg-canvas px-4 py-3 text-base text-ink';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || hasDraft) return;
    if (!courses.some(course => course.id === courseId)) { setError('Scegli un corso nel piano selezionato.'); return; }
    if (!file) { setError('Scegli il file da caricare.'); return; }
    const invalid = validateMaterialFile(file);
    if (invalid) { setError(invalid); return; }
    locked.current = true; setBusy(true); onBusyChange(true); setError('');
    try {
      const confirmed = await schoolCommunityIdentity.requireCourse(courseId);
      await uploadMaterial({ courseId: confirmed.identity.communityId, title, description, planYear, file }, userId, setStage);
      onComplete();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Caricamento non riuscito. Riprova.');
      if (reason instanceof MaterialUploadError && (reason.reservation || reason.reservationUnconfirmed)) { setHasDraft(true); onDraft(); }
    } finally { locked.current = false; setBusy(false); onBusyChange(false); setStage(''); }
  }

  return <section aria-labelledby="material-upload-title" className="rounded-2xl border border-outline-variant bg-card-base p-5 sm:p-6">
    <h2 id="material-upload-title" className="text-xl font-semibold text-balance">Condividi un materiale</h2>
    <p className="mt-3 text-sm leading-relaxed text-text text-pretty">Piano {planYear}. Dopo il caricamento il materiale viene verificato prima della pubblicazione.</p>
    <form onSubmit={submit} aria-busy={busy} className="mt-6 space-y-5">
      <fieldset disabled={busy || hasDraft} className="min-w-0 space-y-5 disabled:opacity-70">
        <div className="space-y-3"><label htmlFor="material-course-search" className="block text-sm font-semibold">Cerca un corso nella scuola</label><input id="material-course-search" value={courseQuery} onChange={event => setCourseQuery(event.target.value)} className={inputClass} placeholder="Nome o codice dell’insegnamento" /><FilterSelect label="Corso" value={courseId} onValueChange={setCourseId} options={[{ value: '', label: 'Scegli un corso' }, ...shortlist.map(course => ({ value: course.id, label: `${course.officialCode} · ${course.name}` }))]} /><p className="text-xs text-text">{courseOptions.length > 50 ? 'Mostrati i primi 50 risultati. Scrivi un nome o codice per restringere la ricerca.' : `${courseOptions.length} ${courseOptions.length === 1 ? 'corso trovato' : 'corsi trovati'}.`}</p></div>
        <div><label htmlFor="material-title" className="mb-2 block text-sm font-semibold">Titolo</label><input id="material-title" required minLength={3} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className={inputClass} placeholder="Per esempio: appunti del primo modulo" /></div>
        <div><label htmlFor="material-description" className="mb-2 block text-sm font-semibold">Descrizione <span className="font-normal">(facoltativa)</span></label><textarea id="material-description" rows={3} maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} className={inputClass} /></div>
        <div><label htmlFor="material-file" className="mb-2 block text-sm font-semibold">File</label><input id="material-file" type="file" required accept={MATERIAL_ACCEPT} aria-describedby="material-file-help" onChange={event => { const chosen = event.target.files?.[0] || null; setFile(chosen); setError(chosen ? validateMaterialFile(chosen) || '' : ''); if (chosen && !title) setTitle(chosen.name.replace(/\.[^.]+$/, '').slice(0, 160)); }} className="block w-full min-w-0 rounded-xl border border-outline-variant bg-canvas p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-canvas" /><p id="material-file-help" className="mt-2 text-xs leading-relaxed text-text">PDF, Word, PowerPoint, TXT, JPG, PNG, MP3 o M4A. Massimo 20 MB.{file ? ` File selezionato: ${materialSize(file.size)}.` : ''}</p></div>
      </fieldset>
      {error && <p role="alert" className="rounded-xl border border-error/30 p-4 text-sm leading-relaxed text-error">{error}</p>}
      {stage && <p role="status" className="text-sm text-text">{stage}</p>}
      <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-full border border-outline-variant px-5 py-3 text-sm font-semibold disabled:opacity-60">{hasDraft ? 'Chiudi e gestisci la bozza' : 'Annulla'}</button>{!hasDraft && <button type="submit" disabled={busy || !courses.length} className="min-h-11 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{busy ? 'Caricamento…' : 'Carica e invia alla verifica'}</button>}</div>
    </form>
  </section>;
}
