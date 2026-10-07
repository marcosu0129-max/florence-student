import type { AccountProfile } from './communityApi';

export type ProfileChanges = Partial<Omit<AccountProfile, 'id'>>;
/** Send user edits, not stale values from a different session's last read. */
export function profileChanges(previous: AccountProfile, next: AccountProfile): ProfileChanges {
  if (previous.id !== next.id) throw new Error('L’account è cambiato. Riapri il profilo.');
  const changes: ProfileChanges = {};
  for (const key of ['username', 'faculty'] as const) {
    if (next[key].trim() !== previous[key].trim()) changes[key] = next[key].trim();
  }
  if (next.enrollment_year !== previous.enrollment_year) changes.enrollment_year = next.enrollment_year;
  for (const key of ['anonymous_reviews', 'notify_reviews', 'notify_materials'] as const) {
    if (next[key] !== previous[key]) changes[key] = next[key];
  }
  return changes;
}
