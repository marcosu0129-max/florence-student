import type { SchoolCoverage, SchoolOfferingDetail, SchoolRequirement } from './schoolCatalogTypes';

/** The published UNIFI snapshot and the cloud import share this contract. */
export interface CatalogProgramRecord {
  id: string;
  code: string;
  name: string;
  faculty?: string | null;
  school?: string | null;
  total_credits?: number | null;
  description?: string | null;
  president?: string | null;
  official_url?: string | null;
  source_urls?: string[];
  [key: string]: unknown;
}

export interface CatalogCourseRecord {
  id: string;
  official_code: string;
  name: string;
  program_code: string;
  kind: string;
  [key: string]: unknown;
}

export interface CatalogProfessorRecord {
  id: string;
  official_id: string;
  name: string;
  official_url?: string | null;
  source_urls?: string[];
  department?: string | null;
  faculty?: string | null;
  bio?: string | null;
  email?: string | null;
  office?: string | null;
  missing_fields?: string[];
  last_verified_at?: string | null;
  [key: string]: unknown;
}

export interface CatalogOfferingRecord {
  id?: string;
  course_id: string;
  program_id: string;
  academic_year: string;
  academic_year_start?: number;
  cohort_year?: string | number | null;
  year_level: number | null;
  semester: string | null;
  credits: number | null;
  is_required: boolean | null;
  requirement_ids?: string[];
  professor_ids: string[];
  official_key?: string | null;
  official_url?: string | null;
  source_urls?: string[];
  last_verified_at?: string | null;
  status?: string;
  missing_fields?: string[];
  notes?: string | string[] | null;
  curriculum?: string | null;
  curriculum_name?: string | null;
  lingua?: string | null;
  ssd?: string | null;
  frequenza?: string | null;
  durata?: string | null;
  obiettivi_formativi?: string | null;
  contenuti?: string | null;
  prerequisiti?: string | null;
  metodi_didattici?: string | null;
  verifica_apprendimento?: string | null;
  programma_esteso?: string | null;
  testi?: string | null;
  agenda_2030?: string | null;
  altro?: string | null;
  [key: string]: unknown;
}

export interface CatalogRequirementRecord {
  id: string;
  label?: string;
  name?: string;
  kind?: string;
  credits?: number | null;
  choose?: number | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface CatalogSourceRecord {
  url: string;
  title?: string;
  fetched_at?: string;
  [key: string]: unknown;
}

export interface CatalogSnapshot {
  schema_version: number;
  generated_at: string;
  programs: CatalogProgramRecord[];
  courses: CatalogCourseRecord[];
  professors: CatalogProfessorRecord[];
  offerings: CatalogOfferingRecord[];
  requirements: CatalogRequirementRecord[];
  sources: CatalogSourceRecord[];
  coverage?: Record<string, unknown>;
}

export type CatalogDataSource = 'cloud' | 'official-snapshot';
export type CatalogStatsStatus = 'ready' | 'unavailable';
export interface RequirementGroup {
  id: string;
  label: string;
  kind: string;
  credits?: number | null;
  choose?: number | null;
  notes?: string | null;
}

export interface Course {
  id: string;
  offeringId?: string;
  programKey?: string;
  curriculumCode?: string;
  curriculumName?: string | null;
  academicYearStart?: number;
  schoolDetail?: SchoolOfferingDetail;
  schoolCoverage?: SchoolCoverage;
  schoolRequirements?: SchoolRequirement[];
  name: string;
  professorId: string;
  professorName: string;
  /** Unknown values are 0 for compatibility; missingFields identifies them. */
  credits: number;
  semester: string;
  yearLevel: number;
  isRequired: boolean | null;
  programCode: string;
  description: string;
  faculty: string;
  rating?: number;
  reviewCount?: number;
  /** Published community aggregates across study plans, independent of official data. */
  statsStatus?: CatalogStatsStatus;
  difficulty?: number;
  teaching?: number;
  grading?: number;
  professorIds?: string[];
  professorNames?: string[];
  professorRealIds?: string[];
  officialCode: string;
  academicYear: string;
  /** Selected admission cohort / study plan, distinct from the teaching year. */
  planYear: string;
  teachingAcademicYears: string[];
  cohortYear: string | number | null;
  cohortYears: Array<string | number>;
  activityType: string;
  kind: string;
  requirementKind: 'required' | 'choice' | 'elective' | 'unknown' | 'mixed';
  requirementGroups: RequirementGroup[];
  offeringStatus: string;
  offeringNotes: string[];
  offerings: CatalogOfferingRecord[];
  sourceUrl: string | null;
  sourceUrls: string[];
  verifiedAt: string | null;
  lastVerifiedAt: string | null;
  missingFields: string[];
  dataSource: CatalogDataSource;
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
  profileYear?: number;
  programKey?: string;
  planYear?: string;
  curriculumCode?: string;
  name: string;
  department: string;
  faculty: string;
  bio?: string;
  email?: string;
  office?: string;
  rating?: number;
  reviewCount?: number;
  statsStatus?: CatalogStatsStatus;
  programs: string[];
  courseCount: number;
  officialId: string;
  academicYear: string;
  sourceUrl: string | null;
  sourceUrls: string[];
  verifiedAt: string | null;
  lastVerifiedAt: string | null;
  missingFields: string[];
  dataSource: CatalogDataSource;
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
  requirementGroups: RequirementGroup[];
  academicYear: string;
  academicYears: string[];
  sourceUrl: string | null;
  sourceUrls: string[];
  verifiedAt: string | null;
  dataSource: CatalogDataSource;
}

export interface CatalogStatus {
  loading: boolean;
  source: CatalogDataSource | 'unavailable';
  academicYear: string;
  academicYears: string[];
  updatedAt: string | null;
  cloudError: string | null;
  error: string | null;
}
