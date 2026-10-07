import { communityRequest, communityWrite } from './communityApi';
import { supabase } from './supabase';

export interface StudentNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  courseId: string | null;
  entityType: string;
  entityId: string;
  readAt: string | null;
  createdAt: string;
}
export interface NotificationPage { items: StudentNotification[]; hasMore: boolean; }
interface NotificationsTransport {
  list: (offset: number, limit: number) => Promise<unknown>;
  markRead: (ids: string[] | null, expectedUserId: string) => Promise<unknown>;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const defaultTransport: NotificationsTransport = {
  // Ownership is enforced by RLS. The client neither supplies nor receives a recipient ID.
  list: (offset, limit) => communityRequest<unknown[]>(signal => supabase.from('notifications')
    .select('id,type,title,body,course_id,entity_type,entity_id,read_at,created_at')
    .order('created_at', { ascending: false }).order('id', { ascending: false })
    .range(offset, offset + limit - 1).abortSignal(signal)),
  markRead: (ids, expectedUserId) => communityWrite<number>('mark_notifications_read', { p_notification_ids: ids }, expectedUserId),
};

function parseNotification(value: unknown): StudentNotification {
  if (!value || typeof value !== 'object') throw new Error('Impossibile leggere le notifiche. Riprova.');
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || !UUID.test(row.id) || typeof row.type !== 'string' || typeof row.title !== 'string'
    || typeof row.body !== 'string' || typeof row.entity_type !== 'string' || typeof row.entity_id !== 'string' || !UUID.test(row.entity_id)
    || typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at))
    || (row.read_at !== null && (typeof row.read_at !== 'string' || !Number.isFinite(Date.parse(row.read_at))))
    || (row.course_id !== null && (typeof row.course_id !== 'string' || !UUID.test(row.course_id)))) {
    throw new Error('Impossibile leggere le notifiche. Riprova.');
  }
  return { id: row.id, type: row.type, title: row.title, body: row.body, courseId: row.course_id as string | null,
    entityType: row.entity_type, entityId: row.entity_id, readAt: row.read_at as string | null, createdAt: row.created_at };
}

export function createNotificationsApi(transport: NotificationsTransport = defaultTransport) {
  return {
    async list(offset = 0, pageSize = 30): Promise<NotificationPage> {
      if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('Pagina delle notifiche non valida.');
      const result = await transport.list(offset, pageSize + 1);
      if (!Array.isArray(result)) throw new Error('Impossibile leggere le notifiche. Riprova.');
      const rows = result.map(parseNotification);
      return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize };
    },
    async markRead(ids: string[] | null, expectedUserId: string): Promise<number> {
      if (typeof expectedUserId !== 'string' || !expectedUserId.trim()) throw new Error('Accedi di nuovo per aggiornare le notifiche.');
      if (ids !== null && (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !UUID.test(id)))) throw new Error('Selezione delle notifiche non valida.');
      if (ids?.length === 0) return 0;
      const result = await transport.markRead(ids === null ? null : [...new Set(ids)], expectedUserId);
      if (typeof result !== 'number' || !Number.isInteger(result) || result < 0) throw new Error('Esito non confermato. Aggiorna le notifiche prima di riprovare.');
      return result;
    },
  };
}

const notificationsApi = createNotificationsApi();
export const fetchNotifications = notificationsApi.list;
export const markNotificationsRead = notificationsApi.markRead;

export function notificationDestination(notification: StudentNotification, planYear: string): string {
  const params = new URLSearchParams({ year: planYear });
  let path = '/profile';
  if (notification.type === 'moderation') {
    path = notification.entityType === 'resource' ? '/materials' : '/my-reviews';
    if (notification.entityType === 'resource') params.set('mine', '1');
  } else if (notification.entityType === 'resource') {
    path = '/materials';
    if (notification.courseId) params.set('course', notification.courseId);
  } else if (notification.courseId) path = `/courses/${notification.courseId}`;
  return `${path}?${params}`;
}
