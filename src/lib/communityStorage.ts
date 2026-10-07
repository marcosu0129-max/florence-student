import { reviewKey } from './reviewIdentity';

export interface Review {
  id: string;
  courseId: string;
  professorId?: string;
  subjectType?: 'course' | 'professor';
  isDemo?: boolean;
  isMine?: boolean;
  isAnonymous?: boolean;
  status?: string;
  professorName?: string;
  planYear?: string;
  author: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  tip?: string;
  tipType?: 'success' | 'warning';
  helpfulCount: number;
  courseName?: string;
  chiarezzaScore?: number;
  disponibilitaScore?: number;
  equitaScore?: number;
}

export const SAVED_COURSES_KEY = 'florence:saved-course-ids';
export const COURSE_REVIEWS_KEY = 'florence:demo-reviews';
export const PROFESSOR_REVIEWS_KEY = 'florence:demo-prof-reviews';
export const SAVED_COURSES_EVENT = 'florence:saved-courses-change';
const STORAGE_ERROR = 'Impossibile salvare su questo dispositivo. Controlla che il browser consenta l’archiviazione locale e riprova.';
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown) => typeof value === 'string' ? value : '';
export const validScore = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

export function readLocalArray(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeLocalArray(key: string, value: unknown[]) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error(STORAGE_ERROR); }
}

export function getSavedCourseIds(): string[] {
  return [...new Set(readLocalArray(SAVED_COURSES_KEY).filter((value): value is string => typeof value === 'string' && value.trim().length > 0))];
}

function notifySavedCourses() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SAVED_COURSES_EVENT));
}

export function saveCourse(courseId: string): void {
  if (typeof courseId !== 'string' || !courseId.trim()) throw new Error('Corso non valido. Riapri la scheda e riprova.');
  const ids = getSavedCourseIds();
  if (!ids.includes(courseId)) writeLocalArray(SAVED_COURSES_KEY, [...ids, courseId]);
  notifySavedCourses();
}

export function unsaveCourse(courseId: string): void {
  writeLocalArray(SAVED_COURSES_KEY, getSavedCourseIds().filter(id => id !== courseId));
  notifySavedCourses();
}

export function isCourseSaved(courseId: string): boolean { return getSavedCourseIds().includes(courseId); }
export function toggleSaveCourse(courseId: string): boolean {
  if (isCourseSaved(courseId)) { unsaveCourse(courseId); return false; }
  saveCourse(courseId);
  return true;
}

function normalizeLocalReview(value: unknown, subjectType: 'course' | 'professor'): Review | null {
  if (!object(value) || !string(value.id)) return null;
  const courseId = string(value.courseId);
  const professorId = string(value.professorId) || undefined;
  const content = string(value.content) || string(value.verbalReview);
  const ratingDifficulty = subjectType === 'professor' ? value.equitaScore : value.ratingDifficulty;
  const ratingTeaching = subjectType === 'professor' ? value.chiarezzaScore : value.ratingTeaching;
  if (!(subjectType === 'professor' ? professorId : courseId) || !content || !validScore(ratingDifficulty) || !validScore(ratingTeaching)) return null;
  const professorName = string(value.professorName) || undefined;
  return {
    id: string(value.id), courseId, professorId, subjectType, isDemo: true, isMine: true,
    isAnonymous: typeof value.isAnonymous === 'boolean' ? value.isAnonymous : string(value.author) !== 'Tu',
    content, ratingDifficulty, ratingTeaching,
    author: string(value.author) || 'Studente anonimo', date: string(value.date) || 'Data non disponibile',
    courseName: string(value.courseName) || (subjectType === 'professor' ? professorName : undefined),
    professorName, planYear: string(value.planYear) || undefined,
    grade: validScore(value.grade) ? value.grade : undefined,
    helpfulCount: typeof value.helpfulCount === 'number' && Number.isFinite(value.helpfulCount) ? Math.max(0, value.helpfulCount) : 0,
    tip: string(value.tip) || undefined, tipType: value.tipType === 'success' || value.tipType === 'warning' ? value.tipType : undefined,
    chiarezzaScore: validScore(value.chiarezzaScore) ? value.chiarezzaScore : undefined,
    disponibilitaScore: validScore(value.disponibilitaScore) ? value.disponibilitaScore : undefined,
    equitaScore: validScore(value.equitaScore) ? value.equitaScore : undefined,
  };
}

export function fetchDemoReviews(): Review[] {
  const reviews = [
    ...readLocalArray(COURSE_REVIEWS_KEY).map(value => normalizeLocalReview(value, 'course')),
    ...readLocalArray(PROFESSOR_REVIEWS_KEY).map(value => normalizeLocalReview(value, 'professor')),
  ];
  const seen = new Set<string>();
  return reviews.filter((review): review is Review => {
    if (!review || seen.has(reviewKey(review))) return false;
    seen.add(reviewKey(review));
    return true;
  });
}

export function appendLocalReview(review: Review): void {
  const key = review.subjectType === 'professor' ? PROFESSOR_REVIEWS_KEY : COURSE_REVIEWS_KEY;
  writeLocalArray(key, [review, ...readLocalArray(key).filter(row => !object(row) || row.id !== review.id)]);
}

export function deleteDemoReview(reviewId: string, subjectType: 'course' | 'professor'): void {
  const key = subjectType === 'professor' ? PROFESSOR_REVIEWS_KEY : COURSE_REVIEWS_KEY;
  const rows = readLocalArray(key);
  if (rows.some(row => object(row) && row.id === reviewId)) {
    writeLocalArray(key, rows.filter(row => !object(row) || row.id !== reviewId));
  }
}

export function validateReview(content: unknown, scores: unknown[]): string | null {
  const length = string(content).trim().length;
  if (length < 20 || length > 5000) return 'Scrivi una descrizione tra 20 e 5000 caratteri, esclusi gli spazi iniziali e finali.';
  if (!scores.every(validScore)) return 'Seleziona una valutazione intera da 1 a 5 per ogni voce.';
  return null;
}
