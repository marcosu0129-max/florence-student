/** Schema 3 application shards; source collection payloads are intentionally a separate contract. */
export interface SchoolSource { id: string; url: string; title: string; sha256: string; fetched_at: string; http_status: number; }
export interface SchoolProgram {
  id: string; program_key: string; name: string; degree_classes: string[];
  degree_level: 'bachelor' | 'master' | 'single_cycle'; duration_years: number;
  total_credits: number; faculty: string; official_website: string | null;
  official_url: string | null; source_urls: string[]; legacy_catalog_code: string | null;
}
export interface SchoolCounts { courses: number; offerings: number; published: number; scheduled: number; plan_only: number; professors: number; }
export interface SchoolCoverage {
  api_collection_complete: boolean; plan_status: string; credit_totals_validated: boolean;
  can_assert_study_plan_satisfied: false; conditional_constraints_status: string;
  unresolved: unknown[]; curriculum_credit_checks: unknown[]; excluded_api_contexts: number;
}
export interface SchoolAliases { programs: Record<string, string>; courses: Record<string, string>; professors: Record<string, string>; }
export interface SchoolCohortReference {
  cohort_year: number; plan_year: string; url: string; sha256: string; bytes: number;
  counts: SchoolCounts; coverage: SchoolCoverage;
}
export interface SchoolIndex {
  schema_version: 3; kind: 'school-app-index'; release_id: string; generated_at: string;
  aliases: SchoolAliases; search?: { url: string; sha256: string; bytes: number };
  programs: Array<SchoolProgram & { cohorts: SchoolCohortReference[] }>;
}
export interface SchoolAssignment {
  professor_id: string; profile_year: number; responsible: boolean; teaching: boolean;
  section_code: string | null; source_url: string;
}
export interface SchoolOffering {
  id: string; course_id: string; program_id: string; program_key: string; official_key: string;
  official_code: string; name: string; cohort_year: number; academic_year_start: number;
  academic_year: string; year_level: number; official_degree_code: string; official_degree_id: string;
  curriculum_id: string | null; curriculum_code: string; curriculum_name: string | null;
  activity_curriculum_id: string | null; credits: number | null; semester: string | null;
  status: 'published' | 'scheduled' | 'plan-only'; kind: string;
  is_required: boolean | null; api_is_required: boolean | null; requirement_ids: string[];
  professor_ids: string[]; assignments: SchoolAssignment[]; source_urls: string[];
  detail_source_id: string | null; official_url: string | null; last_verified_at: string;
  missing_fields: string[]; context_validation: string; details_url: string;
}
export interface SchoolCourse {
  id: string; official_code: string; name: string; kind: string;
  program_ids: string[]; program_codes: string[]; source_urls: string[];
}
export interface SchoolProfessorProfile {
  id: string; official_id: string; name: string; profile_year: number;
  department: string | null; faculty: string | null; email: string | null; bio: string | null;
  official_url: string | null; source_urls: string[]; missing_fields: string[];
}
export interface SchoolRequirement {
  id: string; program_key: string; cohort_year: number; year_level: number | null;
  curriculum_code: string; degree_class_track: string | null; kind: string;
  credits_to_choose: number | null; courses_to_choose: number | null; description: string;
  course_ids: string[]; activity_row_ids: string[]; offering_ids: string[];
  source_id: string; source_url: string; source_page: number | null; source_pages: number[]; conditions: unknown[];
  [evidenceField: string]: unknown;
}
export interface SchoolPlanActivity {
  id: string; official_code: string | null; name: string; credits: number | null;
  year_level: number; academic_year_start: number; curriculum_code: string;
  degree_class_track: string | null; module_of: string | null; requirement_id: string;
  offering_ids: string[]; source_url: string; source_page: number | null; source_pages: number[];
  [evidenceField: string]: unknown;
}
export interface SchoolCohort {
  schema_version: 3; kind: 'school-app-cohort'; generated_at: string;
  program: SchoolProgram; cohort_year: number; plan_year: string;
  official_degree_code: string; official_degree_id: string;
  curricula: Array<{ id: string | null; code: string; name: string | null }>;
  courses: SchoolCourse[]; offerings: SchoolOffering[]; professors: SchoolProfessorProfile[];
  professor_profiles: SchoolProfessorProfile[]; requirements: SchoolRequirement[]; plan_activities: SchoolPlanActivity[];
  sources: SchoolSource[]; coverage: SchoolCoverage; counts: SchoolCounts; aliases: SchoolAliases;
}
export interface SchoolTeachingPart {
  code: string; name: string; credits: number | null; semester: string | null;
  professor_ids: string[]; profile_year: number; section_code?: string | null;
  module_code?: string | null;
  source_id: string | null; source_url: string | null;
}
export interface SchoolSearch {
  schema_version: 3; kind: 'school-app-search'; generated_at: string;
  courses: Array<{ id: string; official_code: string; name: string; names: string[];
    contexts: Array<{ program_key: string; cohort_year: number; offering_id: string }> }>;
  professors: Array<{ id: string; official_id: string; name: string;
    contexts: Array<{ program_key: string; cohort_year: number; profile_year: number }> }>;
}
export interface SchoolFindOptions { limit?: number; programKey?: string; cohortYear?: number; }
export interface SchoolOfferingDetail {
  schema_version: 3; kind: 'school-app-offering-detail'; offering_id: string; course_id: string;
  program_key: string; cohort_year: number; academic_year_start: number;
  curriculum_code: string; profile_year: number;
  syllabus: Record<string, string | null>; syllabus_sections: Array<Record<string, string | null>>;
  modules: SchoolTeachingPart[]; sections: SchoolTeachingPart[];
  professor_profiles: SchoolProfessorProfile[]; source_urls: string[];
  detail_source_id: string | null; missing_fields: string[];
}
/** A real programme identity and admission cohort. Degree classes are not programme IDs. */
export interface SchoolContext { programKey: string; cohortYear: number; curriculumCode?: string; academicYearStart?: number; }
export interface SchoolLoadOptions { retry?: boolean; }
export interface SchoolReadOptions { signal: AbortSignal; sha256?: string; bytes?: number; }
export type SchoolJsonReader = (url: string, options: SchoolReadOptions) => Promise<unknown>;
export interface SchoolResourceState { status: 'idle' | 'loading' | 'ready' | 'error'; error: string | null; }
