/** Post-laurea and historical scope is separate from Bxxx degree catalogue identities. */
export type SchoolOtherProgramKind = 'university_master' | 'advanced_training' | 'phd' | 'specialisation_school' | 'teacher_qualification' | 'special_needs_teacher_specialisation';
export interface SchoolOtherAsset { url: string; sha256: string; bytes: number; }
export interface SchoolOtherEnvelope { schema_version: 1; kind: string; release_id: string; source_sha256: string; }
export interface SchoolOtherSourceEvidence {
  url: string; status: number | string; source_id: string | null; sha256: string | null;
  snapshot_path?: string | null; checked_at?: string | null; [field: string]: unknown;
}
export interface SchoolOtherDocumentReference extends SchoolOtherSourceEvidence {
  role: string; document_id: string | null; full_text: string | null;
}
export interface SchoolOtherActivity {
  id: string; name: string; official_code: string | null; credits: number | null;
  teachers_raw: string | null; source_id: string; reviewable: false;
  row_role?: string; module_of?: string | null; evidence: Record<string, unknown>;
  modules?: Array<{ name: string; credits: number | null; source_id: string; [field: string]: unknown }>;
  [field: string]: unknown;
}
export interface SchoolOtherTrack {
  /** Local to program + academic year. Activities may legitimately repeat in different tracks. */
  id: string; activities: SchoolOtherActivity[]; credit_total: number; expected_path_credits: number;
  credit_check_status: 'verified' | 'source_conflict'; can_assert_completion?: false;
  source_conflict_id?: string; name?: string; competition_class?: string; path?: string; edition?: string;
  [field: string]: unknown;
}
export interface SchoolOtherCalendarCell {
  text: string; source_id: string; evidence: { page: number; table: number; row: number; column: number };
  semantic_status: string;
}
export interface SchoolOtherEdition {
  academic_year_start: number; academic_year: string; admissions_status: string; teaching_status: string;
  running_edition?: string; source_evidence: SchoolOtherSourceEvidence[];
  documents: SchoolOtherDocumentReference[]; activities: SchoolOtherActivity[]; tracks?: SchoolOtherTrack[];
  people: Array<{ role: string; name_text: string; source_id: string; not_course_assignment: true }>;
  limitations: Array<{ kind: string; reason: string; [field: string]: unknown }>;
  calendar_cells?: SchoolOtherCalendarCell[];
  registry_cards?: string[];
  [field: string]: unknown;
}
export interface SchoolOtherProgram {
  id: string; name: string; program_kind: SchoolOtherProgramKind; department?: string | null;
  master_level?: number; directory_entry_indices: number[]; editions: SchoolOtherEdition[];
  faculty_board_evidence?: SchoolOtherDocumentReference[]; faculty_directory_evidence?: SchoolOtherDocumentReference[];
  [field: string]: unknown;
}
export interface SchoolOtherYearCheck {
  academic_year_start: number; admissions_status: string; teaching_status: string; [field: string]: unknown;
}
export interface SchoolOtherDirectoryEntry {
  id: string; directory_entry_index: number; name: string; program_kind: SchoolOtherProgramKind | 'historical_degree';
  resolution: string; related_program_ids: string[]; year_checks: SchoolOtherYearCheck[];
  source_evidence: SchoolOtherSourceEvidence[]; [field: string]: unknown;
}
export interface SchoolOtherConflict {
  id: string; programme_name: string; academic_year_start: number; status: string;
  description: string; source_url: string; source_id: string; source_sha256: string; [field: string]: unknown;
}
export interface SchoolOtherCounts {
  programs: number; directory_entries: number; editions: number; activities: number; tracks: number;
  track_activities: number; calendar_cells: number; conflicts: number;
}
export interface SchoolOtherProgramSummary {
  id: string; name: string; program_kind: SchoolOtherProgramKind; department: string | null; master_level: number | null;
  directory_entry_indices: number[]; conflict_ids: string[]; detail: SchoolOtherAsset;
  editions: Array<Pick<SchoolOtherEdition, 'academic_year_start' | 'academic_year' | 'admissions_status' | 'teaching_status'> & {
    running_edition: string | null; activities: number; tracks: number; calendar_cells: number; limitations: number;
  }>;
}
export interface SchoolOtherDirectorySummary extends Pick<SchoolOtherDirectoryEntry, 'id' | 'directory_entry_index' | 'name' | 'program_kind' | 'resolution' | 'related_program_ids' | 'year_checks'> { detail: SchoolOtherAsset; }
export interface SchoolOtherIndex extends SchoolOtherEnvelope {
  kind: 'school-other-index'; generated_at: string; requested_academic_years: string[]; counts: SchoolOtherCounts;
  programs: SchoolOtherProgramSummary[]; directory_entries: SchoolOtherDirectorySummary[];
  scope: SchoolOtherAsset; provenance: SchoolOtherAsset; manifest_url: string;
}
export interface SchoolOtherProgramDetail extends SchoolOtherEnvelope { kind: 'school-other-program'; program: SchoolOtherProgram; source_conflicts: SchoolOtherConflict[]; }
export interface SchoolOtherDirectoryDetail extends SchoolOtherEnvelope { kind: 'school-other-directory-entry'; entry: SchoolOtherDirectoryEntry; }
export interface SchoolOtherScope extends SchoolOtherEnvelope {
  kind: 'school-other-scope'; metadata: {
    schema_version: 1; kind: 'school-other-programs'; generated_at: string; requested_academic_years: string[];
    coverage: Record<string, unknown>; scope_policy: Record<string, string>;
    source_conflicts: SchoolOtherConflict[]; source_failures: Array<Record<string, unknown>>;
    registry_evidence: { registries: Array<Record<string, unknown>>; cards: Array<Record<string, unknown>> };
    [field: string]: unknown;
  };
}
export interface SchoolOtherProvenance extends SchoolOtherEnvelope {
  kind: 'school-other-provenance'; source_manifest: { sources: Array<Record<string, unknown>>; [field: string]: unknown };
  document_evidence_metadata: Record<string, unknown>;
  documents: Array<SchoolOtherAsset & { id: string; source_id: string; source_url: string }>;
}
export interface SchoolOtherDocument extends SchoolOtherEnvelope {
  kind: 'school-other-document'; document: {
    id: string; source_id: string; source_url: string; source_sha256: string;
    pages: Array<{ page: number; text: string; tables: Array<Array<Array<string | null>>> }>;
    activities: SchoolOtherActivity[]; [field: string]: unknown;
  };
}
export interface SchoolOtherManifest extends SchoolOtherEnvelope {
  kind: 'school-other-manifest'; generated_at: string;
  inputs: Record<'source' | 'source_manifest' | 'document_evidence', { sha256: string; bytes: number }>;
  counts: SchoolOtherCounts & { document_evidence: number; source_snapshots: number };
  files: Array<SchoolOtherAsset & { kind: string }>;
}
export interface SchoolOtherLoadOptions { retry?: boolean; }
export interface SchoolOtherReadOptions { signal: AbortSignal; sha256?: string; bytes?: number; }
export type SchoolOtherReader = (url: string, options: SchoolOtherReadOptions) => Promise<unknown>;
