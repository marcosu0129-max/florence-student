import { supabase } from './supabase';
import { communityError, communityRpc, communityWrite, requireAccountSession } from './communityApi';

export const MAX_MATERIAL_SIZE = 20 * 1024 * 1024;
export const MATERIAL_MIME_TYPES = [
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'image/jpeg', 'image/png', 'audio/mpeg', 'audio/mp4',
] as const;
export const MATERIAL_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp3,.m4a';
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', mp3: 'audio/mpeg', m4a: 'audio/mp4',
};
export interface MaterialRecord {
  id: string; course_id: string; course_name: string; uploader: string; title: string; description: string | null;
  file_type: string; mime_type: string | null; file_size: number | null; storage_bucket: string | null;
  storage_path: string | null; plan_year: string | null; status: string; moderation_note: string | null; created_at: string;
}
export interface UploadReservation { id: string; bucket: string; path: string; }
export interface MaterialInput { courseId: string; title: string; description: string; planYear: string; file: File; }
export interface ModerationReport { id: string; subject_type: 'course' | 'professor'; review_id: string; reason: string; status: string; created_at: string; verbal_review: string | null; subject_name: string | null; }
export interface AdminQueue { resources: MaterialRecord[]; reports: ModerationReport[]; }
export type ModerationSubject = 'course_review' | 'professor_review' | 'resource';

export function materialMimeType(file: Pick<File, 'type' | 'name'>): string {
  return file.type || MIME_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() || ''] || '';
}
export function validateMaterialFile(file: Pick<File, 'type' | 'name' | 'size'>): string | null {
  if (!Number.isInteger(file.size) || file.size < 1) return 'Scegli un file che non sia vuoto.';
  if (!file.name.trim() || ['.', '..'].includes(file.name)) return 'Scegli un file con un nome valido.';
  if (file.size > MAX_MATERIAL_SIZE) return 'Il file supera il limite di 20 MB.';
  if (file.name.length > 180) return 'Il nome del file è troppo lungo. Usa al massimo 180 caratteri.';
  if (!(MATERIAL_MIME_TYPES as readonly string[]).includes(materialMimeType(file))) return 'Questo formato non è supportato. Scegli uno dei formati indicati.';
  return null;
}
export function materialSize(bytes: number | null): string {
  if (!bytes || !Number.isFinite(bytes)) return 'Dimensione non disponibile';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
export const materialStatus = (status: string) => ({ draft: 'Caricamento da completare', pending: 'In attesa di approvazione', published: 'Pubblicato', rejected: 'Non approvato', hidden: 'Nascosto dalla moderazione', withdrawn: 'Ritirato', legacy: 'File precedente da verificare' }[status] || 'Stato da verificare');
export const fetchMaterials = (courseId: string | null, mine: boolean, offset = 0) => communityRpc<MaterialRecord[]>('list_resources', { p_course_id: courseId || null, p_mine: mine, p_limit: 100, p_offset: offset });
export const fetchAdminRole = () => communityRpc<boolean>('is_community_admin');
export const fetchAdminQueue = () => communityRpc<AdminQueue>('admin_queue', { p_kind: 'all', p_limit: 100 });

export class MaterialUploadError extends Error {
  constructor(message: string, public reservation: UploadReservation | null, public reservationUnconfirmed = false) { super(message); this.name = 'MaterialUploadError'; }
}

async function storageRequest<T>(request: PromiseLike<{ data: T | null; error: unknown }>, timeoutMs = 60000): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const { data, error } = await Promise.race([
      Promise.resolve(request),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('La richiesta non è ancora confermata. Controlla i tuoi materiali prima di riprovare.')), timeoutMs); }),
    ]);
    if (error) throw communityError(error);
    if (data === null) throw new Error('Il servizio non ha restituito il file richiesto. Riprova.');
    return data;
  } finally { if (timeout) clearTimeout(timeout); }
}

export interface MaterialsTransport {
  assertAccount: (expectedUserId: string) => Promise<unknown>;
  write: (name: string, params: Record<string, unknown>, expectedUserId: string) => Promise<unknown>;
  upload: (reservation: UploadReservation, file: File, mimeType: string, expectedUserId: string) => Promise<unknown>;
}
const defaultTransport: MaterialsTransport = {
  assertAccount: requireAccountSession,
  write: communityWrite,
  upload: async (reservation, file, mimeType, userId) => {
    const session = await requireAccountSession(userId);
    return storageRequest(supabase.storage.from(reservation.bucket).upload(reservation.path, file, {
      upsert: false, contentType: mimeType, cacheControl: '0', headers: { Authorization: `Bearer ${session.access_token}` },
    }));
  },
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateIdentity(id: string, userId: string) {
  if (!userId) throw new Error('Accedi di nuovo per continuare.');
  if (!UUID.test(id)) throw new Error('Il contenuto selezionato non è valido. Aggiorna la pagina.');
}
function parseReservation(value: unknown, userId: string): UploadReservation {
  const row = value as Partial<UploadReservation> | null;
  if (!row || typeof row.id !== 'string' || !UUID.test(row.id) || row.bucket !== 'course-materials' || typeof row.path !== 'string'
    || !row.path.startsWith(`${userId}/${row.id}/`) || !/^[a-zA-Z0-9._-]+$/.test(row.path.slice(`${userId}/${row.id}/`.length))) {
    throw new Error('Esito del caricamento non confermato.');
  }
  return { id: row.id, bucket: row.bucket, path: row.path };
}

/** A small injectable boundary lets the actual multi-stage workflow run against isolated fixtures. */
export function createMaterialsApi(transport: MaterialsTransport = defaultTransport) {
  async function finalize(id: string, userId: string): Promise<string> {
    validateIdentity(id, userId); await transport.assertAccount(userId);
    const result = await transport.write('finalize_resource', { p_resource_id: id }, userId);
    if (result !== id) throw new Error('Esito non confermato. Controlla lo stato del materiale prima di riprovare.');
    return id;
  }
  return {
    finalize,
    async withdraw(id: string, userId: string): Promise<boolean> {
      validateIdentity(id, userId); await transport.assertAccount(userId);
      const result = await transport.write('withdraw_my_resource', { p_resource_id: id }, userId);
      if (result !== true) throw new Error('Il ritiro non è confermato. Aggiorna i tuoi materiali prima di riprovare.');
      return true;
    },
    async moderate(subject: ModerationSubject, id: string, status: 'published' | 'rejected' | 'hidden', note: string, userId: string): Promise<boolean> {
      validateIdentity(id, userId);
      if (!['course_review', 'professor_review', 'resource'].includes(subject) || !['published', 'rejected', 'hidden'].includes(status) || (subject !== 'resource' && status === 'rejected') || note.trim().length > 1000) throw new Error('Decisione di moderazione non valida.');
      await transport.assertAccount(userId);
      const result = await transport.write('moderate_content', { p_subject_type: subject, p_entity_id: id, p_status: status, p_note: note.trim() || null }, userId);
      if (result !== true) throw new Error('Decisione non confermata. Aggiorna l’elenco prima di riprovare.');
      return true;
    },
    async upload(input: MaterialInput, userId: string, onStage?: (message: string) => void): Promise<string> {
      const validation = validateMaterialFile(input.file);
      if (validation) throw new Error(validation);
      validateIdentity(input.courseId, userId);
      if (input.title.trim().length < 3 || input.title.trim().length > 160 || input.description.trim().length > 2000) throw new Error('Controlla il corso, il titolo e la descrizione.');
      let reservation: UploadReservation | null = null;
      let reservationAttempted = false;
      try {
        const mimeType = materialMimeType(input.file);
        await transport.assertAccount(userId);
        onStage?.('Preparazione del caricamento…');
        reservationAttempted = true;
        const result = await transport.write('reserve_resource', { p_course_id: input.courseId, p_title: input.title.trim(), p_filename: input.file.name, p_mime_type: mimeType, p_file_size: input.file.size, p_description: input.description.trim() || null, p_plan_year: input.planYear || null }, userId);
        reservation = parseReservation(result, userId);
        await transport.assertAccount(userId);
        onStage?.('Caricamento del file…');
        const file = input.file.type === mimeType ? input.file : new File([input.file], input.file.name, { type: mimeType });
        await transport.upload(reservation, file, mimeType, userId);
        onStage?.('Invio alla moderazione…');
        return await finalize(reservation.id, userId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Caricamento non riuscito. Riprova.';
        const recovery = reservation ? ' La bozza è disponibile in “I miei materiali”: puoi confermare il caricamento oppure ritirarla.'
          : reservationAttempted ? ' Prima di caricare di nuovo, controlla “I miei materiali”: una bozza potrebbe essere stata creata.' : '';
        throw new MaterialUploadError(message + recovery, reservation, reservationAttempted && !reservation);
      }
    },
  };
}
const materialsApi = createMaterialsApi();
export const uploadMaterial = materialsApi.upload;
export const finalizeMaterial = materialsApi.finalize;
export const withdrawMaterial = materialsApi.withdraw;
export const moderateMaterial = materialsApi.moderate;

export async function downloadMaterial(material: Pick<MaterialRecord, 'storage_bucket' | 'storage_path'>, userId: string): Promise<void> {
  if (!material.storage_bucket || !material.storage_path) throw new Error('Il file non è disponibile per il download.');
  await requireAccountSession(userId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const blob = await storageRequest(supabase.storage.from(material.storage_bucket).download(material.storage_path, {}, { signal: controller.signal, cache: 'no-store' }));
    await requireAccountSession(userId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = material.storage_path.split('/').pop() || 'materiale';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Il download sta impiegando troppo tempo. Riprova.');
    throw error;
  } finally { clearTimeout(timeout); }
}
