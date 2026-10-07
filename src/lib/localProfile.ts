export interface LocalProfile {
  name: string;
  faculty: string;
  year: string;
}

export interface LocalPreferences {
  anonymousReviews: boolean;
}

const PROFILE_KEY = 'florence:local-profile';
const PREFERENCES_KEY = 'florence:local-preferences';

export const DEFAULT_PROFILE: LocalProfile = {
  name: 'Studente',
  faculty: 'Scuola di Studi Umanistici e della Formazione',
  year: String(new Date().getFullYear()),
};

function readRecord(key: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '{}');
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

export function getLocalProfile(): LocalProfile {
  const value = readRecord(PROFILE_KEY);
  return {
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 60) : DEFAULT_PROFILE.name,
    faculty: typeof value.faculty === 'string' && value.faculty.trim() ? value.faculty.trim() : DEFAULT_PROFILE.faculty,
    year: typeof value.year === 'string' && /^\d{4}$/.test(value.year) ? value.year : DEFAULT_PROFILE.year,
  };
}

export function saveLocalProfile(value: LocalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...value, name: value.name.trim() }));
}

export function getLocalPreferences(): LocalPreferences {
  const value = readRecord(PREFERENCES_KEY);
  return { anonymousReviews: typeof value.anonymousReviews === 'boolean' ? value.anonymousReviews : true };
}

export function saveLocalPreferences(value: LocalPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(value));
}
