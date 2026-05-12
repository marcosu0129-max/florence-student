import { supabase } from './supabase';
import { courses as mockCourses, professors as mockProfessors } from '../data/mockData';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// Safe Supabase fetch with 3s timeout — returns fallback on timeout/error
async function safeSupabase<T>(fn: () => Promise<{ data: T | null; error: any }>, fallback: T): Promise<T> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await withTimeout(fn() as Promise<{ data: T | null; error: any }>, 3000);
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}

// Map Supabase professor names (ALL CAPS) to a readable format
function formatProfessorName(name: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstName = parts.slice(0, -1).map((n) => n.charAt(0) + n.slice(1).toLowerCase()).join(' ');
    return `${firstName} ${lastName.charAt(0) + lastName.slice(1).toLowerCase()}`;
  }
  return name.charAt(0) + name.slice(1).toLowerCase();
}

// ===== Type Definitions =====

export interface Course {
  id: string;
  name: string;
  professorId: string;
  professorName: string;
  credits: number;
  semester: string;
  yearLevel: number;
  isRequired: boolean;
  programCode: string;
  description: string;
  faculty: string;
  rating?: number;
  reviewCount?: number;
  difficulty?: number;
  teaching?: number;
  grading?: number;
  professorIds?: string[];
  professorNames?: string[];
  professorRealIds?: string[];
  ssd?: string;
  lingua?: string;
  frequenza?: string;
  durata?: string;
  obiettiviFormativi?: string;
  contenuti?: string;
  prerequisiti?: string;
  metodiDidattici?: string;
  verificaApprendimento?: string;
  programmaEsteso?: string;
  testi?: string;
  obiettiviAgenda2030?: string;
  altro?: string;
}

export interface Professor {
  id: string;
  name: string;
  department: string;
  faculty: string;
  bio?: string;
  email?: string;
  office?: string;
  rating: number;
  programs: string[];
  courseCount: number;
}

export interface Review {
  id: string;
  courseId: string;
  author: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  tip?: string;
  tipType?: 'success' | 'warning';
  helpfulCount: number;
}

export interface Resource {
  id: string;
  courseId: string;
  title: string;
  type: 'pdf' | 'audio' | 'video' | 'doc' | 'image';
  uploader: string;
  date: string;
  size: string;
  downloads: number;
  description?: string;
}

export interface Program {
  code: string;
  name: string;
  faculty: string;
  totalCredits: number;
  description: string;
  president: string;
  courseCount: number;
  requiredCount: number;
}

// ===== Programs =====
const programs: Program[] = [
  {
    code: 'LM-92',
    name: 'Pratiche, linguaggi e culture della comunicazione',
    faculty: 'Scuola di Studi Umanistici e della Formazione',
    totalCredits: 120,
    description: 'Il corso di laurea in Pratiche, linguaggi e culture della comunicazione forma professionisti della comunicazione, del linguaggio e dei media.',
    president: 'Prof.ssa Benedetta Baldi',
    courseCount: 21,
    requiredCount: 0,
  },
  {
    code: 'LM-14',
    name: 'Filologia moderna',
    faculty: 'Scuola di Studi Umanistici e della Formazione',
    totalCredits: 120,
    description: 'Corso di laurea magistrale in Filologia moderna, con approfondimenti in linguistica, letteratura e filologia romanza.',
    president: 'Prof.ssa Irene Gambacorti',
    courseCount: 22,
    requiredCount: 0,
  },
  {
    code: 'LM-2',
    name: 'Archeologia',
    faculty: 'Scuola di Studi Umanistici e della Formazione',
    totalCredits: 120,
    description: 'Laurea magistrale in Archeologia, con focus su metodologie di scavo, analisi dei materiali e valorizzazione del patrimonio.',
    president: 'Prof. Luca Cappuccini',
    courseCount: 20,
    requiredCount: 0,
  },
  {
    code: 'L-11',
    name: 'Lingue, letterature e studi interculturali',
    faculty: 'Scuola di Studi Umanistici e della Formazione',
    totalCredits: 180,
    description: 'Corso di laurea triennale in Lingue, letterature e studi interculturali. Include studio di due lingue straniere.',
    president: 'Prof.ssa Benedetta Baldi',
    courseCount: 21,
    requiredCount: 0,
  },
  {
    code: 'L-10',
    name: 'Lettere',
    faculty: 'Scuola di Studi Umanistici e della Formazione',
    totalCredits: 180,
    description: 'Corso di laurea triennale in Lettere, con indirizzi in letteratura italiana, storia antica e moderna, e filologia.',
    president: 'Prof. Cristiano Giometti',
    courseCount: 20,
    requiredCount: 0,
  },
];

// ===== Data Fetching =====

const SUPABASE_URL = 'https://bydicprzizmiywzykofr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5ZGljcHJ6aXptaXl3enlrb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNTM4NTIsImV4cCI6MjA5MzcyOTg1Mn0.lyNiSTaXRfRrV2Srk4JCEoie7fTQuPsd8Lbwzj1K58I';

async function supabaseFetch(table: string, params: string = '', signal?: AbortSignal) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? `?${params}` : ''}`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    signal,
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchCourses(programCodes?: string[]): Promise<Course[]> {
  try {
    const courseFields = [
      'id', 'name', 'credits', 'semester', 'year_level',
      'is_required', 'program_code', 'description', 'ssd',
      'lingua', 'frequenza', 'durata',
      'obiettivi_formativi', 'contenuti', 'prerequisiti',
      'metodi_didattici', 'verifica_apprendimento',
      'programma_esteso', 'testi', 'agenda_2030', 'altro',
    ].join(',');

    const codes = programCodes && programCodes.length > 0
      ? programCodes
      : programs.map((p) => p.code);

    // Step 1: Fetch courses for each program (bypasses RLS with program_code filter)
    const results = await Promise.all(
      codes.map((pc) =>
        supabaseFetch('courses', `select=${courseFields}&program_code=eq.${encodeURIComponent(pc)}`)
      )
    );

    let rows: any[] = [];
    for (const r of results) {
      if (Array.isArray(r)) rows = rows.concat(r);
    }

    if (rows.length === 0) return mockCourses as Course[];

    // Step 2: Batch-fetch course_professor links for fetched courses (bypasses RLS with course_id=in filter)
    const courseIds = rows.map((r: any) => r.id);
    const cpMap: Record<string, string[]> = {};
    if (courseIds.length > 0) {
      const cpAllRows: any[] = await supabaseFetch(
        'course_professor', `select=course_id,professor_id&course_id=in.(${courseIds.join(',')})`
      );
      for (const cp of cpAllRows) {
        if (!cpMap[cp.course_id]) cpMap[cp.course_id] = [];
        if (cp.professor_id && !cpMap[cp.course_id].includes(cp.professor_id)) {
          cpMap[cp.course_id].push(cp.professor_id);
        }
      }
    }

    // Step 3: Fetch all needed professors by ID (bypasses RLS with id=in filter)
    const allProfIds = [...new Set(Object.values(cpMap).flat())];
    const profMap: Record<string, string> = {};
    if (allProfIds.length > 0) {
      const profs: any[] = await supabaseFetch('professors', `select=id,name&id=in.(${allProfIds.join(',')})`);
      for (const p of profs) profMap[p.id] = p.name;
    }

    // Step 4: Map to Course objects
    return rows.map((r: any) => {
      const profIds = cpMap[r.id] || [];
      const profNames = profIds.map((pid) => profMap[pid]).filter(Boolean);
      return {
        id: r.id, name: r.name, professorId: '',
        professorName: profNames[0] || '',
        credits: r.credits || 0, semester: r.semester || '',
        yearLevel: r.year_level || 1, isRequired: r.is_required ?? false,
        programCode: r.program_code || '', description: r.description || '',
        faculty: '', rating: undefined, reviewCount: 0, difficulty: undefined,
        teaching: undefined, grading: undefined,
        professorIds: profIds.map((pid: string, i: number) => pid),
        professorNames: profNames,
        professorRealIds: profIds,
        ssd: r.ssd || '', lingua: r.lingua || '', frequenza: r.frequenza || '',
        durata: r.durata || '', obiettiviFormativi: r.obiettivi_formativi || '',
        contenuti: r.contenuti || '', prerequisiti: r.prerequisiti || '',
        metodiDidattici: r.metodi_didattici || '',
        verificaApprendimento: r.verifica_apprendimento || '',
        programmaEsteso: r.programma_esteso || '', testi: r.testi || '',
        obiettiviAgenda2030: r.agenda_2030 || '', altro: r.altro || '',
      };
    });
  } catch {
    // fall through to mock
  }

  return mockCourses as Course[];
}

export async function fetchProfessors(): Promise<Professor[]> {
  return mockProfessors.map((p) => ({
    id: p.id,
    name: p.name.includes('Prof.') ? p.name : `Prof. ${p.name}`,
    department: p.department || '',
    faculty: p.faculty || '',
    bio: p.bio || '',
    rating: p.rating || 4.0,
    programs: p.programs || [],
    courseCount: p.courseCount || 0,
  }));
}

export async function fetchCourseById(id: string): Promise<Course | null> {
  try {
    const courseFields = [
      'id', 'name', 'credits', 'semester', 'year_level',
      'is_required', 'program_code', 'description', 'ssd',
      'lingua', 'frequenza', 'durata',
      'obiettivi_formativi', 'contenuti', 'prerequisiti',
      'metodi_didattici', 'verifica_apprendimento',
      'programma_esteso', 'testi', 'agenda_2030', 'altro',
    ].join(',');

    // Step 1: Get course data
    const courseRows = await supabaseFetch('courses', `select=${courseFields}&id=eq.${id}`);
    if (!courseRows || courseRows.length === 0) return null;
    const r = courseRows[0];

    // Step 2: Get course_professor links for THIS course only (bypasses RLS)
    const cpRows: any[] = await supabaseFetch(
      'course_professor', `select=professor_id&course_id=eq.${id}`
    );

    // Step 3: Get professors by their IDs (bypasses RLS by using specific IDs)
    const professorIds = cpRows.map((cp: any) => cp.professor_id).filter(Boolean);
    let profMap: Record<string, string> = {};
    if (professorIds.length > 0) {
      const idList = professorIds.join(',');
      const profRows: any[] = await supabaseFetch('professors', `select=id,name&id=in.(${idList})`);
      for (const p of profRows) profMap[p.id] = p.name;
    }

    const professorNames = professorIds
      .map((pid: string) => profMap[pid])
      .filter(Boolean);
    const result = {
      id: r.id,
      name: r.name,
      professorId: '',
      professorName: professorNames[0] || '',
      credits: r.credits || 0,
      semester: r.semester || '',
      yearLevel: r.year_level || 1,
      isRequired: r.is_required ?? false,
      programCode: r.program_code || '',
      description: r.description || '',
      faculty: '',
      rating: undefined,
      reviewCount: 0,
      difficulty: undefined,
      teaching: undefined,
      grading: undefined,
      professorIds: professorIds.map((pid: string) => pid),
      professorNames,
      professorRealIds: professorIds,
      ssd: r.ssd || '',
      lingua: r.lingua || '',
      frequenza: r.frequenza || '',
      durata: r.durata || '',
      obiettiviFormativi: r.obiettivi_formativi || '',
      contenuti: r.contenuti || '',
      prerequisiti: r.prerequisiti || '',
      metodiDidattici: r.metodi_didattici || '',
      verificaApprendimento: r.verifica_apprendimento || '',
      programmaEsteso: r.programma_esteso || '',
      testi: r.testi || '',
      obiettiviAgenda2030: r.agenda_2030 || '',
      altro: r.altro || '',
    };
    return result;
  } catch {
    return null;
  }
}

export async function fetchProfessorById(id: string): Promise<Professor | null> {
  // Try Supabase first (the real source of truth for professor IDs from course_professor links)
  try {
    const rows: any[] = await supabaseFetch('professors', `select=id,name,department,faculty,bio&id=eq.${id}`);
    if (rows && rows.length > 0) {
      const p = rows[0];
      return {
        id: p.id,
        name: p.name.includes('Prof.') ? p.name : `Prof. ${p.name}`,
        department: p.department || '',
        faculty: p.faculty || '',
        bio: p.bio || '',
        email: p.email || '',
        office: p.office || '',
        rating: 4.0,
        programs: [],
        courseCount: 0,
      };
    }
  } catch {
    // fall through to mock
  }

  // Fallback to mock (handles demo/mock professor IDs like p_alberti_maria_emanuela)
  const mock = mockProfessors.find((p) => p.id === id);
  if (mock) return mock;
  return null;
}

export async function fetchCoursesByProfessor(professorId: string): Promise<Course[]> {
  // Query Supabase: find all course IDs linked to this professor via course_professor table
  try {
    const cpRows: any[] = await supabaseFetch(
      'course_professor',
      `select=course_id,professor_id&professor_id=eq.${professorId}`
    );
    const courseIds = cpRows.map((cp: any) => cp.course_id).filter(Boolean);
    if (courseIds.length === 0) return [];

    const idList = courseIds.join(',');

    // Fetch those courses by ID
    const courseFields = [
      'id', 'name', 'credits', 'semester', 'year_level',
      'is_required', 'program_code', 'description', 'ssd',
      'lingua', 'frequenza', 'durata',
      'obiettivi_formativi', 'contenuti', 'prerequisiti',
      'metodi_didattici', 'verifica_apprendimento',
      'programma_esteso', 'testi', 'agenda_2030', 'altro',
    ].join(',');
    const rows: any[] = await supabaseFetch('courses', `select=${courseFields}&id=in.(${idList})`);

    // Fetch ALL professor names for these courses (for professorNames / other professors on card)
    const allCpRows: any[] = await supabaseFetch(
      'course_professor',
      `select=course_id,professor_id&course_id=in.(${idList})`
    );
    const allProfIds = [...new Set(allCpRows.map((cp: any) => cp.professor_id).filter(Boolean))];
    const profNameMap: Record<string, string> = {};
    if (allProfIds.length > 0) {
      const profRows: any[] = await supabaseFetch(
        'professors', `select=id,name&id=in.(${allProfIds.join(',')})`
      );
      for (const p of profRows) profNameMap[p.id] = p.name;
    }

    return rows.map((r: any) => {
      const relatedCps = allCpRows.filter((cp: any) => cp.course_id === r.id);
      const profIds = relatedCps.map((cp: any) => cp.professor_id);
      const profNames = profIds.map((pid: string) => profNameMap[pid] || '');
      return {
        id: r.id, name: r.name, professorId: professorId,
        professorName: profNames[0] || '',
        credits: r.credits || 0, semester: r.semester || '',
        yearLevel: r.year_level || 1, isRequired: r.is_required ?? false,
        programCode: r.program_code || '', description: r.description || '',
        faculty: '', rating: undefined, reviewCount: 0, difficulty: undefined,
        teaching: undefined, grading: undefined,
        professorIds: profIds,
        professorNames: profNames,
        professorRealIds: profIds,
        ssd: r.ssd || '', lingua: r.lingua || '', frequenza: r.frequenza || '',
        durata: r.durata || '', obiettiviFormativi: r.obiettivi_formativi || '',
        contenuti: r.contenuti || '', prerequisiti: r.prerequisiti || '',
        metodiDidattici: r.metodi_didattici || '',
        verificaApprendimento: r.verifica_apprendimento || '',
        programmaEsteso: r.programma_esteso || '', testi: r.testi || '',
        obiettiviAgenda2030: r.agenda_2030 || '', altro: r.altro || '',
      };
    });
  } catch {
    return [];
  }
}

export async function fetchCoursesByProgram(programCode: string): Promise<Course[]> {
  const courses = await fetchCourses();
  return courses.filter((c) => c.programCode === programCode);
}

// ===== localStorage keys =====
const LS_SAVED_COURSES = 'florence:saved-course-ids';
const LS_DEMO_REVIEWS = 'florence:demo-reviews';
const LS_DEMO_USER_ID = 'florence:demo-user-id';

// ===== Saved courses (localStorage) =====
export function getSavedCourseIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_SAVED_COURSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isCourseSaved(courseId: string): boolean {
  return getSavedCourseIds().includes(courseId);
}

export function saveCourse(courseId: string): void {
  const ids = getSavedCourseIds();
  if (!ids.includes(courseId)) {
    localStorage.setItem(LS_SAVED_COURSES, JSON.stringify([...ids, courseId]));
  }
}

export function unsaveCourse(courseId: string): void {
  const ids = getSavedCourseIds();
  localStorage.setItem(LS_SAVED_COURSES, JSON.stringify(ids.filter((id) => id !== courseId)));
}

export function toggleSaveCourse(courseId: string): boolean {
  if (isCourseSaved(courseId)) {
    unsaveCourse(courseId);
    return false;
  } else {
    saveCourse(courseId);
    return true;
  }
}

// ===== Demo user id =====
function getDemoUserId(): string {
  let id = localStorage.getItem(LS_DEMO_USER_ID);
  if (!id) {
    id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(LS_DEMO_USER_ID, id);
  }
  return id;
}

// ===== Demo reviews (localStorage) =====
interface DemoReview {
  id: string;
  courseId: string;
  professorId?: string;
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
}

function getDemoReviews(): DemoReview[] {
  try {
    const raw = localStorage.getItem(LS_DEMO_REVIEWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDemoReviews(reviews: DemoReview[]): void {
  localStorage.setItem(LS_DEMO_REVIEWS, JSON.stringify(reviews));
}

// ===== Create review =====
export interface CreateReviewParams {
  courseId: string;
  professorId?: string;
  difficultyScore: number;
  teachingScore: number;
  gradingScore?: number;
  content: string;
  tip?: string;
  isAnonymous: boolean;
}

export async function createReview(params: CreateReviewParams): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Supabase path
    const { error } = await supabase.from('reviews').insert({
      course_id: params.courseId,
      professor_id: params.professorId || null,
      user_id: session.user.id,
      difficulty_score: params.difficultyScore,
      grading_score: params.gradingScore || 3,
      teaching_score: params.teachingScore,
      verbal_review: params.content,
      exam_tips: params.tip || null,
      is_anonymous: params.isAnonymous,
    });
    if (error) return { success: false, error: 'Errore durante il salvataggio. Riprova.' };
    return { success: true };
  }

  // Demo mode: save to localStorage
  const review: DemoReview = {
    id: `demo-${Date.now()}`,
    courseId: params.courseId,
    professorId: params.professorId,
    author: params.isAnonymous ? 'Studente anonimo' : 'Tu',
    date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    ratingDifficulty: params.difficultyScore,
    ratingTeaching: params.teachingScore,
    grade: params.gradingScore,
    content: params.content,
    tip: params.tip || undefined,
    tipType: params.tip ? 'success' : undefined,
    helpfulCount: 0,
  };
  const existing = getDemoReviews();
  persistDemoReviews([review, ...existing]);
  return { success: true };
}

// ===== Fetch demo reviews for a specific user (current demo user) =====
export function fetchDemoReviews(): DemoReview[] {
  return getDemoReviews();
}

// ===== Delete demo review =====
export function deleteDemoReview(reviewId: string): void {
  const reviews = getDemoReviews().filter((r) => r.id !== reviewId);
  persistDemoReviews(reviews);
}

// ===== Helper functions =====

export function getProfessorInitials(name: string): string {
  return name
    .replace(/^(Prof\.?|Prof\.ssa\.?)\s*/i, '')
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export { programs };

// ===== Fetch all reviews =====
export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(username), courses(name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }

  const supabaseReviews: Review[] = (data || []).map((r: any) => ({
    id: r.id,
    courseId: r.course_id,
    author: r.is_anonymous ? 'Studente anonimo' : (r.profiles?.username || 'Studente'),
    date: new Date(r.created_at).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    ratingDifficulty: r.difficulty_score,
    ratingTeaching: r.teaching_score,
    grade: r.grading_score,
    content: r.verbal_review,
    tip: r.exam_tips || undefined,
    tipType: r.exam_tips ? 'success' as const : undefined,
    helpfulCount: r.helpful_count || 0,
    courseName: r.courses?.name || '',
  }));

  // Merge demo reviews
  const demoReviews: Review[] = getDemoReviews().map((r) => ({ ...r, courseName: r.courseName || '' }));

  // Deduplicate by id
  const all = [...demoReviews, ...supabaseReviews];
  const seen = new Set<string>();
  return all.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// ===== Fetch user reviews (demo + Supabase) =====
export async function fetchUserReviews(): Promise<Review[]> {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username), courses(name)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      courseId: r.course_id,
      author: r.is_anonymous ? 'Studente anonimo' : (r.profiles?.username || 'Studente'),
      date: new Date(r.created_at).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
      ratingDifficulty: r.difficulty_score,
      ratingTeaching: r.teaching_score,
      grade: r.grading_score,
      content: r.verbal_review,
      tip: r.exam_tips || undefined,
      tipType: r.exam_tips ? 'success' as const : undefined,
      helpfulCount: r.helpful_count || 0,
      courseName: r.courses?.name || '',
    }));
  }

  // No session: return only local demo reviews authored by the current demo user
  const demoReviews: Review[] = getDemoReviews().map((r) => ({ ...r, courseName: r.courseName || '' }));
  return demoReviews;
}

// ===== Fetch reviews by course (merge demo) =====
export async function fetchReviewsByCourse(courseId: string): Promise<Review[]> {
  const demoReviews = getDemoReviews()
    .filter((r) => r.courseId === courseId)
    .map((r) => ({ ...r }));
  return demoReviews;
}

// ===== Fetch reviews by professor (merge demo + professor_reviews) =====
export async function fetchReviewsByProfessor(professorId: string): Promise<Review[]> {
  const supabaseReviews = (async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map((r: any) => ({
      id: r.id,
      courseId: r.course_id,
      author: r.is_anonymous ? 'Studente anonimo' : (r.profiles?.username || 'Studente'),
      date: new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
      ratingDifficulty: r.difficulty_score,
      ratingTeaching: r.teaching_score,
      grade: r.grading_score,
      content: r.verbal_review,
      tip: r.exam_tips || undefined,
      tipType: r.exam_tips ? 'success' as const : undefined,
      helpfulCount: r.helpful_count || 0,
    }));
  })();

  const { data: profData, error: profErr } = await supabase
    .from('professor_reviews')
    .select('*, profiles(username)')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false });

  const profReviews = (profErr || !profData) ? [] : (profData as any[]).map((r: any) => ({
    id: r.id,
    courseId: '',
    author: r.is_anonymous ? 'Studente anonimo' : (r.profiles?.username || 'Studente'),
    date: new Date(r.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    chiarezzaScore: r.chiarezza_score,
    disponibilitaScore: r.disponibilita_score,
    equitaScore: r.equita_score,
    content: r.verbal_review,
    helpfulCount: 0,
  }));

  const demoCourseReviews = getDemoReviews()
    .filter((r) => r.professorId === professorId)
    .map((r) => ({ ...r }));

  const demoProfReviews = getDemoProfReviews()
    .filter((r) => r.professorId === professorId)
    .map((r) => ({ ...r }));

  const all = [...demoCourseReviews, ...demoProfReviews, ...profReviews];
  const seen = new Set<string>();
  return all.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// ===== Professor Reviews (demo only for now) =====
export interface CreateProfessorReviewParams {
  professorId: string;
  chiarezzaScore: number;
  disponibilitaScore: number;
  equitaScore: number;
  content: string;
}

const LS_PROF_REVIEWS = 'florence:demo-prof-reviews';

interface DemoProfReview {
  id: string;
  professorId: string;
  author: string;
  date: string;
  chiarezzaScore: number;
  disponibilitaScore: number;
  equitaScore: number;
  verbalReview: string;
}

function getDemoProfReviews(): DemoProfReview[] {
  try {
    const raw = localStorage.getItem(LS_PROF_REVIEWS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function createProfessorReview(params: CreateProfessorReviewParams): Promise<{ success: boolean; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { error } = await supabase.from('professor_reviews').insert({
      user_id: session.user.id,
      professor_id: params.professorId,
      chiarezza_score: params.chiarezzaScore,
      disponibilita_score: params.disponibilitaScore,
      equita_score: params.equitaScore,
      verbal_review: params.content,
    });
    if (error) return { success: false, error: 'Errore durante il salvataggio. Riprova.' };
    return { success: true };
  }
  const review: DemoProfReview = {
    id: `demo-prof-${Date.now()}`,
    professorId: params.professorId,
    author: 'Studente anonimo',
    date: new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }),
    chiarezzaScore: params.chiarezzaScore,
    disponibilitaScore: params.disponibilitaScore,
    equitaScore: params.equitaScore,
    verbalReview: params.content,
  };
  const existing = getDemoProfReviews();
  localStorage.setItem(LS_PROF_REVIEWS, JSON.stringify([review, ...existing]));
  return { success: true };
}
