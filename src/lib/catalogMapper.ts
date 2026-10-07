import type {
  CatalogDataSource, CatalogOfferingRecord, CatalogSnapshot, Course,
  Professor, Program, RequirementGroup,
} from './catalogTypes';

const unique = <T>(values: T[]): T[] => [...new Set(values)];
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export class CatalogLoadError extends Error {
  readonly code = 'CATALOG_UNAVAILABLE';
  constructor(message: string) { super(message); this.name = 'CatalogLoadError'; }
}

/** Reject malformed imports instead of presenting incomplete/incorrect joins. */
export function validateCatalog(value: unknown): CatalogSnapshot {
  if (!value || typeof value !== 'object') throw new CatalogLoadError('Catalogo ufficiale non valido.');
  const snapshot = value as CatalogSnapshot;
  if (snapshot.schema_version !== 1 || !Number.isFinite(Date.parse(snapshot.generated_at))) {
    throw new CatalogLoadError('Versione o data del catalogo ufficiale non valida.');
  }
  for (const key of ['programs', 'courses', 'professors', 'offerings', 'requirements', 'sources'] as const) {
    if (!Array.isArray(snapshot[key])) throw new CatalogLoadError(`Catalogo ufficiale privo di ${key}.`);
  }
  if (!snapshot.programs.some((program) => program.code === 'LM-92') || !snapshot.courses.length || !snapshot.offerings.length) {
    throw new CatalogLoadError('Il catalogo LM-92 non contiene ancora un piano di studi.');
  }
  const assertIds = (rows: { id: string }[], label: string) => {
    if (rows.some((row) => !row.id) || unique(rows.map((row) => row.id)).length !== rows.length) {
      throw new CatalogLoadError(`Identificatori ${label} mancanti o duplicati.`);
    }
  };
  assertIds(snapshot.programs, 'dei corsi di laurea');
  assertIds(snapshot.courses, 'degli insegnamenti');
  assertIds(snapshot.professors, 'dei docenti');
  const courses = new Set(snapshot.courses.map((course) => course.id));
  const professors = new Set(snapshot.professors.map((professor) => professor.id));
  const programs = new Set(snapshot.programs.map((program) => program.id));
  if (snapshot.courses.some((course) => !course.official_code || !course.name)) throw new CatalogLoadError('Codice o nome ufficiale di un insegnamento mancante.');
  if (snapshot.offerings.some((offering) => !courses.has(offering.course_id) || !programs.has(offering.program_id)
    || !Array.isArray(offering.professor_ids) || offering.professor_ids.some((id) => !professors.has(id)))) {
    throw new CatalogLoadError('Relazioni tra piano di studi, insegnamenti e docenti non valide.');
  }
  if (!snapshot.sources.some((source) => {
    try { const host = new URL(source.url).hostname; return host === 'unifi.it' || host.endsWith('.unifi.it'); } catch { return false; }
  })) throw new CatalogLoadError('Il catalogo non include fonti ufficiali UNIFI.');
  return snapshot;
}

const planYear = (year: number): string => `${year}/${year + 1}`;
export function catalogPlanYears(snapshot: CatalogSnapshot): string[] {
  const cohorts = snapshot.programs.flatMap((program) => Array.isArray(program.plan_cohorts) ? program.plan_cohorts as unknown[] : [])
    .concat(snapshot.offerings.map((offering) => offering.cohort_year));
  const years = unique(cohorts.map((cohort) => Number.parseInt(String(cohort), 10)).filter(Number.isFinite));
  if (years.length) return years.sort((a, b) => b - a).map(planYear);
  return unique(snapshot.offerings.map((offering) => offering.academic_year)).sort().reverse();
}

const latestVerified = (values: Array<string | null | undefined>, fallback: string): string =>
  values.filter((value): value is string => Boolean(value)).sort().at(-1) || fallback;

export interface CatalogView {
  courses: Course[];
  professors: Professor[];
  programs: Program[];
  academicYears: string[];
  academicYear: string;
}

export function buildCatalogView(snapshot: CatalogSnapshot, selectedPlanYear: string | undefined, source: CatalogDataSource): CatalogView {
  const academicYears = catalogPlanYears(snapshot);
  const selected = selectedPlanYear || academicYears[0] || '';
  const selectedCohort = Number.parseInt(selected, 10);
  const hasCohorts = snapshot.offerings.some((offering) => offering.cohort_year !== null && offering.cohort_year !== undefined);
  const offerings = snapshot.offerings.filter((offering) => hasCohorts
    ? Number.parseInt(String(offering.cohort_year), 10) === selectedCohort
    : offering.academic_year === selected);
  const programMap = new Map(snapshot.programs.map((program) => [program.id, program]));
  const professorMap = new Map(snapshot.professors.map((professor) => [professor.id, professor]));
  const requirementMap = new Map(snapshot.requirements.map((requirement) => [requirement.id, requirement]));
  const courses: Course[] = [];
  for (const course of snapshot.courses) {
    const matches = offerings.filter((offering) => offering.course_id === course.id);
    if (!matches.length) continue;
    // The same course may be offered in different curricula. Preserve each arrangement.
    const primary = [...matches].sort((a, b) => Object.values(b).filter(Boolean).length - Object.values(a).filter(Boolean).length)[0];
    const professorIds = unique(matches.flatMap((offering) => offering.professor_ids));
    const requirementGroups: RequirementGroup[] = unique(matches.flatMap((offering) => offering.requirement_ids ?? []))
      .map((id) => requirementMap.get(id))
      .filter((value) => Boolean(value))
      .map((requirement) => ({
        id: requirement!.id,
        label: text(requirement!.label) || text(requirement!.description) || text(requirement!.name),
        kind: text(requirement!.kind) || 'unknown',
        credits: typeof requirement!.credits_to_choose === 'number' ? requirement!.credits_to_choose : requirement!.credits,
        choose: requirement!.choose,
        notes: requirement!.notes,
      }));
    const groupKinds = unique(requirementGroups.map((group) => group.kind));
    let requirementKind: Course['requirementKind'];
    if (groupKinds.length > 1) requirementKind = 'mixed';
    else if (groupKinds.includes('choice')) requirementKind = 'choice';
    else if (groupKinds.includes('free_choice')) requirementKind = 'elective';
    else if (matches.every((offering) => offering.is_required === true)) requirementKind = 'required';
    else if (matches.every((offering) => offering.is_required === false)) requirementKind = 'elective';
    else requirementKind = 'unknown';
    const program = programMap.get(primary.program_id);
    const sourceUrls = unique(matches.flatMap((offering) => [...(offering.source_urls ?? []), ...(offering.official_url ? [offering.official_url] : [])]));
    const missingFields = unique(matches.flatMap((offering) => [
      ...(offering.missing_fields ?? []),
      ...(['credits', 'year_level', 'semester', 'is_required'] as const).filter((field) => offering[field] === null || offering[field] === undefined),
      ...(offering.professor_ids.length ? [] : ['professor_ids']),
    ]));
    const verifiedAt = latestVerified(matches.map((offering) => offering.last_verified_at), snapshot.generated_at);
    const teachingAcademicYears = unique(matches.map((offering) => offering.academic_year));
    courses.push({
      id: course.id, name: course.name, professorId: professorIds[0] ?? '',
      professorName: professorMap.get(professorIds[0])?.name ?? '',
      professorIds, professorRealIds: professorIds,
      professorNames: professorIds.map((id) => professorMap.get(id)!.name),
      credits: primary.credits ?? 0,
      semester: unique(matches.map((offering) => offering.semester).filter((value): value is string => Boolean(value))).join(' / '),
      yearLevel: primary.year_level ?? 0,
      isRequired: requirementKind === 'required' ? true : requirementKind === 'unknown' || requirementKind === 'mixed' ? null : false,
      programCode: course.program_code,
      description: text(primary.contenuti), faculty: text(program?.faculty) || text(program?.school),
      // Community ratings are not official data. Never synthesize them from catalog entries.
      rating: undefined, reviewCount: 0, difficulty: undefined, teaching: undefined, grading: undefined,
      officialCode: course.official_code,
      academicYear: teachingAcademicYears.join(' · '), planYear: selected, teachingAcademicYears,
      cohortYear: primary.cohort_year ?? null,
      cohortYears: unique(matches.map((offering) => offering.cohort_year).filter((value): value is string | number => value !== null && value !== undefined)),
      activityType: course.kind, kind: course.kind, requirementKind, requirementGroups,
      offeringStatus: unique(matches.map((offering) => offering.status || 'unknown')).join(' · '),
      offeringNotes: unique(matches.flatMap((offering) => typeof offering.notes === 'string' ? [offering.notes] : strings(offering.notes))),
      offerings: matches,
      sourceUrl: primary.official_url ?? sourceUrls[0] ?? null, sourceUrls,
      verifiedAt, lastVerifiedAt: verifiedAt, missingFields, dataSource: source,
      ssd: text(primary.ssd), lingua: text(primary.lingua), frequenza: text(primary.frequenza),
      durata: text(primary.durata), obiettiviFormativi: text(primary.obiettivi_formativi),
      contenuti: text(primary.contenuti), prerequisiti: text(primary.prerequisiti),
      metodiDidattici: text(primary.metodi_didattici), verificaApprendimento: text(primary.verifica_apprendimento),
      programmaEsteso: text(primary.programma_esteso), testi: text(primary.testi),
      obiettiviAgenda2030: text(primary.agenda_2030), altro: text(primary.altro),
    });
  }
  courses.sort((a, b) => a.yearLevel - b.yearLevel || a.name.localeCompare(b.name, 'it'));
  const activeProfessorIds = new Set(courses.flatMap((course) => course.professorIds ?? []));
  const professors: Professor[] = snapshot.professors.filter((professor) => activeProfessorIds.has(professor.id)).map((professor) => {
    const linkedCourses = courses.filter((course) => course.professorIds?.includes(professor.id));
    const sourceUrls = unique([...(professor.source_urls ?? []), ...(professor.official_url ? [professor.official_url] : [])]);
    const verifiedAt = professor.last_verified_at ?? snapshot.generated_at;
    return {
      id: professor.id, officialId: professor.official_id, name: professor.name,
      department: text(professor.department), faculty: text(professor.faculty),
      bio: text(professor.bio), email: text(professor.email), office: text(professor.office),
      rating: undefined, reviewCount: 0, programs: unique(linkedCourses.map((course) => course.programCode)),
      courseCount: linkedCourses.length, academicYear: selected,
      sourceUrl: professor.official_url ?? sourceUrls[0] ?? null, sourceUrls, verifiedAt, lastVerifiedAt: verifiedAt,
      missingFields: professor.missing_fields ?? [], dataSource: source,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const programs: Program[] = snapshot.programs.map((program) => {
    const linked = courses.filter((course) => course.programCode === program.code);
    const sourceUrls = unique([...(program.source_urls ?? []), ...(program.official_url ? [program.official_url] : [])]);
    return {
      code: program.code, name: program.name, faculty: text(program.faculty) || text(program.school),
      totalCredits: program.total_credits ?? 0, description: text(program.description), president: text(program.president),
      courseCount: linked.length, requiredCount: linked.filter((course) => course.isRequired === true).length,
      requirementGroups: snapshot.requirements.filter((requirement) => requirement.program_id === program.id
        && Number.parseInt(String(requirement.cohort_year), 10) === selectedCohort).map((requirement) => ({
        id: requirement.id, label: text(requirement.label) || text(requirement.description) || text(requirement.name),
        kind: text(requirement.kind) || 'unknown', credits: typeof requirement.credits_to_choose === 'number' ? requirement.credits_to_choose : requirement.credits,
        choose: requirement.choose, notes: requirement.notes,
      })),
      academicYear: selected, academicYears, sourceUrl: program.official_url ?? sourceUrls[0] ?? null,
      sourceUrls, verifiedAt: text(program.last_verified_at) || snapshot.generated_at, dataSource: source,
    };
  });
  return { courses, professors, programs, academicYears, academicYear: selected };
}
