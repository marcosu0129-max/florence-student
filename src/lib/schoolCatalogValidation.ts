import type { SchoolAliases, SchoolCohort, SchoolCohortReference, SchoolIndex, SchoolOffering, SchoolOfferingDetail, SchoolProgram, SchoolSearch } from './schoolCatalogTypes';

export class SchoolCatalogValidationError extends Error {
  constructor(readonly reason: string) { super('I dati del catalogo non sono validi. Riprova a caricarli.'); this.name = 'SchoolCatalogValidationError'; }
}
const fail = (reason: string): never => { throw new SchoolCatalogValidationError(reason); };
const check = (condition: unknown, reason: string): void => { if (!condition) fail(reason); };
const object = (value: unknown): Record<string, unknown> => {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), 'object');
  return value as Record<string, unknown>;
};
const array = (value: unknown): unknown[] => { check(Array.isArray(value), 'array'); return value as unknown[]; };
const string = (value: unknown): string => { check(typeof value === 'string', 'string'); return value as string; };
const strings = (value: unknown): string[] => array(value).map(string);
const nullableString = (value: unknown): void => { if (value !== null) string(value); };
const bool = (value: unknown): void => { check(typeof value === 'boolean', 'boolean'); };
const number = (value: unknown, min = 0): number => { check(typeof value === 'number' && Number.isFinite(value) && value >= min, 'number'); return value as number; };
const integer = (value: unknown, min = 0): number => { const result = number(value, min); check(Number.isSafeInteger(result), 'integer'); return result; };
const nullableNumber = (value: unknown): void => { if (value !== null) number(value); };
const uuid = (value: unknown): string => { const result = string(value); check(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result), 'uuid'); return result; };
const uuids = (value: unknown): string[] => array(value).map(uuid);
const date = (value: unknown): void => { check(Number.isFinite(Date.parse(string(value))), 'date'); };
const unique = (values: string[], reason: string): Set<string> => { const ids = new Set(values); check(ids.size === values.length, reason); return ids; };
const year = (value: unknown): number => integer(value, 1900);
const planYear = (start: number) => `${start}/${start + 1}`;
const sourceUrl = (value: unknown): void => { check(/^https?:\/\/[^\s]+$/i.test(string(value)), 'source URL'); };
const sourceUrls = (value: unknown): void => { array(value).forEach(sourceUrl); };
const nullableUrl = (value: unknown): void => { if (value !== null) sourceUrl(value); };

/** Shard URLs are manifest data. Never reconstruct release paths or fetch arbitrary external URLs. */
export function validateSchoolAssetUrl(value: unknown): string {
  const path = string(value);
  check(path.startsWith('/catalog/school/') && !/[?#\\]/.test(path), 'asset URL');
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { return fail('asset URL encoding'); }
  check(!decoded.split('/').some(part => part === '.' || part === '..') && !/[?#\\]/.test(decoded), 'asset traversal');
  check(decoded.endsWith('.json'), 'asset type');
  return path;
}

function aliases(value: unknown): SchoolAliases {
  const row = object(value);
  for (const name of ['programs', 'courses', 'professors']) {
    for (const [key, target] of Object.entries(object(row[name]))) {
      check(key.length > 0 && string(target).length > 0, 'empty alias');
      if (name !== 'programs') { uuid(key); uuid(target); }
    }
  }
  return value as SchoolAliases;
}

function program(value: unknown): SchoolProgram {
  const row = object(value);
  uuid(row.id);
  for (const key of ['program_key', 'name', 'faculty']) check(string(row[key]).length > 0, key);
  strings(row.degree_classes); check(['bachelor', 'master', 'single_cycle'].includes(string(row.degree_level)), 'degree level');
  integer(row.duration_years, 1); number(row.total_credits, 1);
  nullableUrl(row.official_website); nullableUrl(row.official_url); sourceUrls(row.source_urls); nullableString(row.legacy_catalog_code);
  return value as SchoolProgram;
}
function counts(value: unknown) {
  const row = object(value);
  for (const key of ['courses', 'offerings', 'published', 'scheduled', 'plan_only', 'professors']) integer(row[key]);
  check(row.offerings === Number(row.published) + Number(row.scheduled) + Number(row.plan_only), 'offering counts');
}
function coverage(value: unknown) {
  const row = object(value);
  bool(row.api_collection_complete); bool(row.credit_totals_validated);
  check(row.can_assert_study_plan_satisfied === false, 'unverified plan assertion');
  string(row.plan_status); string(row.conditional_constraints_status);
  array(row.unresolved); array(row.curriculum_credit_checks); integer(row.excluded_api_contexts);
}
function envelope(value: unknown, kind: string): Record<string, unknown> {
  const row = object(value);
  check(row.schema_version === 3 && row.kind === kind, 'schema/kind');
  return row;
}
function profile(value: unknown) {
  const row = object(value);
  uuid(row.id); string(row.official_id); string(row.name); year(row.profile_year);
  for (const key of ['department', 'faculty', 'email', 'bio']) nullableString(row[key]);
  nullableUrl(row.official_url); sourceUrls(row.source_urls); strings(row.missing_fields);
}

export function validateSchoolIndex(value: unknown): SchoolIndex {
  const row = envelope(value, 'school-app-index');
  check(string(row.release_id).length > 0, 'release'); date(row.generated_at); aliases(row.aliases);
  if (row.search !== undefined) {
    const search = object(row.search); validateSchoolAssetUrl(search.url);
    check(/^[0-9a-f]{64}$/i.test(string(search.sha256)), 'search checksum'); integer(search.bytes, 1);
  }
  const programs = array(row.programs).map(item => {
    const p = program(item); const record = object(item);
    const cohorts = array(record.cohorts).map(item => {
      const ref = object(item); const cohortYear = year(ref.cohort_year);
      check(ref.plan_year === planYear(cohortYear), 'cohort plan year'); validateSchoolAssetUrl(ref.url);
      check(/^[0-9a-f]{64}$/i.test(string(ref.sha256)), 'cohort checksum'); integer(ref.bytes, 1);
      counts(ref.counts); coverage(ref.coverage); return String(cohortYear);
    });
    check(cohorts.length > 0, 'empty cohort index'); unique(cohorts, 'duplicate cohorts');
    return p;
  });
  check(programs.length > 0, 'empty programme index');
  unique(programs.map(p => p.id), 'duplicate programme IDs'); unique(programs.map(p => p.program_key), 'duplicate programme keys');
  return value as SchoolIndex;
}

export function validateSchoolCohort(value: unknown, expected: { program: SchoolProgram; reference: SchoolCohortReference; generatedAt: string }): SchoolCohort {
  const row = envelope(value, 'school-app-cohort');
  date(row.generated_at); check(row.generated_at === expected.generatedAt, 'mixed release dates');
  const p = program(row.program);
  check(p.id === expected.program.id && p.program_key === expected.program.program_key, 'wrong programme shard');
  const cohortYear = year(row.cohort_year);
  check(cohortYear === expected.reference.cohort_year && row.plan_year === planYear(cohortYear), 'wrong cohort shard');
  string(row.official_degree_code); string(row.official_degree_id); aliases(row.aliases); coverage(row.coverage); counts(row.counts);
  const curricula = unique(array(row.curricula).map(item => { const c = object(item); nullableString(c.id); nullableString(c.name); return string(c.code); }), 'duplicate curricula');
  const courses = unique(array(row.courses).map(item => {
    const c = object(item); const id = uuid(c.id); string(c.official_code); string(c.name); string(c.kind);
    check(uuids(c.program_ids).includes(p.id) && strings(c.program_codes).includes(p.program_key), 'course programme relationship');
    sourceUrls(c.source_urls); return id;
  }), 'duplicate courses');
  const profiles = unique(array(row.professor_profiles).map(item => { profile(item); const r = object(item); return `${r.id}:${r.profile_year}`; }), 'duplicate year profiles');
  const professorIds = unique(array(row.professors).map(item => { profile(item); const r = object(item); check(profiles.has(`${r.id}:${r.profile_year}`), 'latest profile reference'); return uuid(r.id); }), 'duplicate professors');
  const sourceIds = unique(array(row.sources).map(item => {
    const s = object(item); const id = uuid(s.id); sourceUrl(s.url); string(s.title); date(s.fetched_at);
    check(/^[0-9a-f]{64}$/i.test(string(s.sha256)), 'source checksum'); integer(s.http_status, 100); return id;
  }), 'duplicate sources');
  const requirementIds = unique(array(row.requirements).map(item => uuid(object(item).id)), 'duplicate requirements');
  const activityIds = unique(array(row.plan_activities).map(item => uuid(object(item).id)), 'duplicate plan rows');
  const offeringIds = unique(array(row.offerings).map(item => uuid(object(item).id)), 'duplicate offerings');
  const rows = array(row.offerings).map(item => {
    const o = object(item);
    check(courses.has(uuid(o.course_id)) && o.program_id === p.id && o.program_key === p.program_key && o.cohort_year === cohortYear, 'offering context');
    for (const key of ['official_key', 'official_code', 'name', 'kind', 'context_validation', 'official_degree_code', 'official_degree_id']) string(o[key]);
    check(o.official_degree_code === row.official_degree_code && o.official_degree_id === row.official_degree_id, 'historical programme identity');
    const academicYear = year(o.academic_year_start);
    check(academicYear === cohortYear + integer(o.year_level, 1) - 1 && o.academic_year === planYear(academicYear), 'teaching year progression');
    check(curricula.has(string(o.curriculum_code)), 'curriculum relationship');
    for (const key of ['curriculum_id', 'curriculum_name', 'activity_curriculum_id', 'semester']) nullableString(o[key]);
    nullableNumber(o.credits); check(['published', 'scheduled', 'plan-only'].includes(string(o.status)), 'offering status');
    for (const key of ['is_required', 'api_is_required']) if (o[key] !== null) bool(o[key]);
    uuids(o.requirement_ids).forEach(id => check(requirementIds.has(id), 'offering requirement'));
    const teachers = uuids(o.professor_ids);
    teachers.forEach(id => check(profiles.has(`${id}:${academicYear}`), 'exact offering profile'));
    const assignments = array(o.assignments);
    assignments.forEach(item => {
      const a = object(item); check(teachers.includes(uuid(a.professor_id)), 'assignment professor');
      check(a.profile_year === academicYear, 'assignment year'); bool(a.responsible); bool(a.teaching); nullableString(a.section_code); sourceUrl(a.source_url);
    });
    if (o.status !== 'published') check(!teachers.length && !assignments.length, 'unpublished teacher assertion');
    sourceUrls(o.source_urls); nullableUrl(o.official_url); string(o.last_verified_at); strings(o.missing_fields);
    if (o.detail_source_id !== null) check(sourceIds.has(uuid(o.detail_source_id)), 'offering source');
    validateSchoolAssetUrl(o.details_url); return o;
  });
  array(row.requirements).forEach(item => {
    const r = object(item); check(r.program_key === p.program_key && r.cohort_year === cohortYear, 'requirement context');
    if (r.year_level !== null) integer(r.year_level, 1);
    string(r.curriculum_code); nullableString(r.degree_class_track); string(r.kind); string(r.description);
    nullableNumber(r.credits_to_choose); nullableNumber(r.courses_to_choose); array(r.conditions);
    uuids(r.course_ids).forEach(id => check(courses.has(id), 'requirement course'));
    uuids(r.activity_row_ids).forEach(id => check(activityIds.has(id), 'requirement plan row'));
    uuids(r.offering_ids).forEach(id => check(offeringIds.has(id), 'requirement offering'));
    check(sourceIds.has(uuid(r.source_id)), 'requirement source'); sourceUrl(r.source_url);
    if (r.source_page !== null) integer(r.source_page, 1);
    array(r.source_pages).forEach(page => integer(page, 1));
  });
  array(row.plan_activities).forEach(item => {
    const a = object(item); nullableString(a.official_code); string(a.name); nullableNumber(a.credits);
    check(year(a.academic_year_start) === cohortYear + integer(a.year_level, 1) - 1, 'plan activity teaching year');
    string(a.curriculum_code); nullableString(a.degree_class_track); nullableString(a.module_of);
    check(requirementIds.has(uuid(a.requirement_id)), 'plan row requirement');
    uuids(a.offering_ids).forEach(id => check(offeringIds.has(id), 'plan row offering'));
    sourceUrl(a.source_url); if (a.source_page !== null) integer(a.source_page, 1);
    array(a.source_pages).forEach(page => integer(page, 1));
  });
  const declared = object(row.counts);
  check(declared.courses === courses.size && declared.offerings === offeringIds.size && declared.professors === professorIds.size, 'cohort counts');
  for (const [key, status] of [['published', 'published'], ['scheduled', 'scheduled'], ['plan_only', 'plan-only']]) {
    check(declared[key] === rows.filter(o => o.status === status).length, 'publication counts');
  }
  for (const [key, count] of Object.entries(expected.reference.counts)) check(declared[key] === count, 'index/cohort counts');
  return value as SchoolCohort;
}

export function validateSchoolOfferingDetail(value: unknown, offering: SchoolOffering): SchoolOfferingDetail {
  const row = envelope(value, 'school-app-offering-detail');
  for (const [key, expected] of Object.entries({ offering_id: offering.id, course_id: offering.course_id, program_key: offering.program_key,
    cohort_year: offering.cohort_year, academic_year_start: offering.academic_year_start, curriculum_code: offering.curriculum_code,
    profile_year: offering.academic_year_start, detail_source_id: offering.detail_source_id })) check(row[key] === expected, 'wrong detail context');
  const textMap = (value: unknown) => Object.values(object(value)).forEach(nullableString);
  textMap(row.syllabus); array(row.syllabus_sections).forEach(textMap);
  const profiles = unique(array(row.professor_profiles).map(item => {
    profile(item); const p = object(item); check(p.profile_year === offering.academic_year_start, 'detail profile year'); return uuid(p.id);
  }), 'duplicate detail profiles');
  const parts = [...array(row.modules), ...array(row.sections)];
  parts.forEach(item => {
    const p = object(item); string(p.code); string(p.name); nullableNumber(p.credits); nullableString(p.semester);
    check(p.profile_year === offering.academic_year_start, 'teaching part year');
    uuids(p.professor_ids).forEach(id => check(profiles.has(id), 'teaching part profile'));
    if (p.section_code !== undefined) nullableString(p.section_code);
    if (p.module_code !== undefined) nullableString(p.module_code);
    if (p.source_id !== null) uuid(p.source_id); nullableUrl(p.source_url);
  });
  const moduleCodes = new Set(array(row.modules).map(part => string(object(part).code)));
  array(row.sections).forEach(part => {
    const code = object(part).module_code;
    if (code !== undefined && code !== null) check(moduleCodes.has(string(code)), 'section parent module');
  });
  offering.professor_ids.forEach(id => check(profiles.has(id), 'detail parent profile'));
  if (offering.status !== 'published') check(!profiles.size && parts.every(p => !array(object(p).professor_ids).length), 'unpublished detail teacher assertion');
  sourceUrls(row.source_urls); strings(row.missing_fields);
  return value as SchoolOfferingDetail;
}

export function validateSchoolSearch(value: unknown, index: SchoolIndex): SchoolSearch {
  const row = envelope(value, 'school-app-search');
  check(row.generated_at === index.generated_at, 'search release date');
  const pairs = new Set(index.programs.flatMap(program => program.cohorts.map(cohort => `${program.program_key}:${cohort.cohort_year}`)));
  unique(array(row.courses).map(item => {
    const course = object(item); const id = uuid(course.id); string(course.official_code); string(course.name); strings(course.names);
    const contexts = array(course.contexts).map(item => {
      const context = object(item); const pair = `${string(context.program_key)}:${year(context.cohort_year)}`;
      check(pairs.has(pair), 'search programme/cohort'); return `${pair}:${uuid(context.offering_id)}`;
    });
    check(contexts.length > 0, 'empty course search context'); unique(contexts, 'duplicate course search context'); return id;
  }), 'duplicate search course');
  unique(array(row.professors).map(item => {
    const professor = object(item); const id = uuid(professor.id); string(professor.official_id); string(professor.name);
    const contexts = array(professor.contexts).map(item => {
      const context = object(item); const pair = `${string(context.program_key)}:${year(context.cohort_year)}`;
      check(pairs.has(pair), 'search programme/cohort'); return `${pair}:${year(context.profile_year)}`;
    });
    check(contexts.length > 0, 'empty professor search context'); unique(contexts, 'duplicate professor search context'); return id;
  }), 'duplicate search professor');
  return value as SchoolSearch;
}
