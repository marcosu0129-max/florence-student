import type { Course, Professor, RequirementGroup } from './catalogTypes';
import type { SchoolCohort, SchoolContext, SchoolLoadOptions, SchoolOffering, SchoolOfferingDetail, SchoolProfessorProfile } from './schoolCatalogTypes';
import { schoolCatalog } from './schoolCatalog';
import { earliestSourceDate } from './catalogProvenance';
import { createSchoolCatalogRepository, selectSchoolOfferings, SchoolCatalogSupersededError } from './schoolCatalogRepository';

type Repository = ReturnType<typeof createSchoolCatalogRepository>;
const unique = <T>(values: T[]) => [...new Set(values)];
const text = (value: string | null | undefined): string => value || '';

function mapOffering(cohort: SchoolCohort, offering: SchoolOffering, detail?: SchoolOfferingDetail): Course {
  const requirements = cohort.requirements.filter(requirement => offering.requirement_ids.includes(requirement.id));
  const groups: RequirementGroup[] = requirements.map(requirement => ({
    id: requirement.id, label: `${requirement.description}${requirement.degree_class_track ? ` · ${requirement.degree_class_track}` : ''}`,
    kind: requirement.kind, credits: requirement.credits_to_choose, choose: requirement.courses_to_choose,
    notes: requirement.kind === 'assigned_section' ? 'La sezione è assegnata: non è una libera scelta del docente.' : undefined,
  }));
  const kinds = unique(groups.map(group => group.kind));
  const tracks = unique(requirements.map(requirement => requirement.degree_class_track).filter(Boolean));
  const isAssigned = kinds.includes('assigned_section');
  const isQuota = kinds.some(kind => kind === 'choice' || kind === 'credit_group');
  const requirementKind: Course['requirementKind'] = tracks.length > 1 || (isQuota && kinds.includes('required')) ? 'mixed'
    : isAssigned ? 'unknown' : isQuota ? 'choice' : kinds.includes('free_choice') ? 'elective'
      : offering.is_required === true ? 'required' : offering.is_required === false ? 'elective' : 'unknown';
  const professorIds = offering.status === 'published' ? unique(offering.professor_ids) : [];
  const profiles = professorIds.map(id => cohort.professor_profiles.find(profile => profile.id === id && profile.profile_year === offering.academic_year_start)!).filter(Boolean);
  const syllabus = detail?.syllabus || {};
  const sourceUrls = unique([...offering.source_urls, ...(detail?.source_urls || []), ...(offering.official_url ? [offering.official_url] : [])]);
  const notes = [
    ...(offering.status === 'scheduled' ? ['Attività programmata. Docenti e programma non sono ancora pubblicati per questo anno di insegnamento.'] : []),
    ...(offering.status === 'plan-only' ? ['Attività presente nel piano PDF. La corrispondente scheda di insegnamento non è pubblicata; docenti e programma restano da verificare.'] : []),
    ...(cohort.coverage.plan_status === 'source_conflict' ? ['Le fonti ufficiali di questo piano presentano valori discordanti. Consulta le quote e le condizioni del PDF; il completamento del piano non è confermato.'] : []),
    ...(isAssigned ? ['Le sezioni sono assegnate secondo le regole ufficiali e non costituiscono una libera scelta del docente.'] : []),
    ...(tracks.length > 1 ? ['Le regole riportate dipendono dalla classe di laurea scelta; i gruppi non vanno sommati automaticamente.'] : []),
  ];
  const missingFields = unique([...offering.missing_fields, ...(detail?.missing_fields || []),
    ...(offering.credits === null ? ['credits'] : []), ...(offering.semester === null ? ['semester'] : []),
    ...(!profiles.length ? ['professor_ids'] : [])]);
  return {
    id: offering.course_id, offeringId: offering.id, programKey: offering.program_key,
    curriculumCode: offering.curriculum_code, curriculumName: offering.curriculum_name, academicYearStart: offering.academic_year_start,
    schoolDetail: detail, schoolCoverage: cohort.coverage, schoolRequirements: requirements,
    name: offering.name, professorId: profiles.length === 1 ? profiles[0].id : '', professorName: profiles.map(p => p.name).join(', '),
    professorIds: profiles.map(p => p.id), professorRealIds: profiles.map(p => p.id), professorNames: profiles.map(p => p.name),
    credits: offering.credits ?? 0, semester: text(offering.semester), yearLevel: offering.year_level,
    isRequired: requirementKind === 'required' ? true : ['unknown', 'mixed'].includes(requirementKind) ? null : false,
    programCode: offering.program_key, description: text(syllabus.contenuti), faculty: cohort.program.faculty,
    rating: undefined, reviewCount: undefined, statsStatus: 'unavailable', difficulty: undefined, teaching: undefined, grading: undefined,
    officialCode: offering.official_code, academicYear: offering.academic_year, planYear: cohort.plan_year,
    teachingAcademicYears: [offering.academic_year], cohortYear: offering.cohort_year, cohortYears: [offering.cohort_year],
    activityType: offering.kind, kind: offering.kind, requirementKind, requirementGroups: groups,
    offeringStatus: offering.status, offeringNotes: notes, offerings: [{ ...offering }],
    sourceUrl: offering.official_url || sourceUrls[0] || null, sourceUrls,
    verifiedAt: earliestSourceDate(cohort.sources, offering.source_urls), lastVerifiedAt: earliestSourceDate(cohort.sources, offering.source_urls), missingFields, dataSource: 'official-snapshot',
    ssd: text(syllabus.ssd), lingua: text(syllabus.lingua), frequenza: text(syllabus.frequenza), durata: text(syllabus.durata),
    obiettiviFormativi: text(syllabus.obiettivi_formativi), contenuti: text(syllabus.contenuti), prerequisiti: text(syllabus.prerequisiti),
    metodiDidattici: text(syllabus.metodi_didattici), verificaApprendimento: text(syllabus.verifica_apprendimento),
    programmaEsteso: text(syllabus.programma_esteso), testi: text(syllabus.testi), obiettiviAgenda2030: text(syllabus.agenda_2030), altro: text(syllabus.altro),
  };
}

function mapProfile(cohort: SchoolCohort, profile: SchoolProfessorProfile, context: SchoolContext): Professor {
  const offerings = selectSchoolOfferings(cohort, context).filter(offering => offering.academic_year_start === profile.profile_year && offering.professor_ids.includes(profile.id));
  const sourceUrls = unique([...profile.source_urls, ...(profile.official_url ? [profile.official_url] : [])]);
  const verifiedAt = earliestSourceDate(cohort.sources, profile.source_urls);
  return {
    id: profile.id, officialId: profile.official_id, profileYear: profile.profile_year, programKey: cohort.program.program_key,
    planYear: cohort.plan_year, curriculumCode: context.curriculumCode, name: profile.name,
    department: text(profile.department), faculty: text(profile.faculty), bio: profile.bio || undefined, email: profile.email || undefined,
    office: undefined, rating: undefined, reviewCount: undefined, statsStatus: 'unavailable',
    programs: [cohort.program.program_key], courseCount: offerings.length, academicYear: `${profile.profile_year}/${profile.profile_year + 1}`,
    sourceUrl: profile.official_url || sourceUrls[0] || null, sourceUrls, verifiedAt, lastVerifiedAt: verifiedAt,
    missingFields: [...profile.missing_fields], dataSource: 'official-snapshot',
  };
}

/** Legacy display shapes with explicit school context; IDs remain community/business IDs. */
export function createSchoolCatalogBridge(repository: Repository = schoolCatalog) {
  async function cohortCourses(context: SchoolContext, options: SchoolLoadOptions = {}): Promise<Course[]> {
    const cohort = await repository.cohort(context, options);
    return selectSchoolOfferings(cohort, context).map(offering => mapOffering(cohort, offering));
  }
  async function courseCandidates(id: string, context: SchoolContext, options: SchoolLoadOptions = {}): Promise<Course[]> {
    const resolved = await repository.resolveCourseRoute(id, context, options);
    if (!resolved) return [];
    const cohort = await repository.cohort(context);
    if (!cohort.courses.includes(resolved.course) || resolved.offerings.some(offering => !cohort.offerings.includes(offering))) throw new SchoolCatalogSupersededError();
    return resolved.offerings.map(offering => mapOffering(cohort, offering));
  }
  async function offeringCourse(id: string, context: SchoolContext, options: SchoolLoadOptions & { details?: boolean } = {}): Promise<Course | null> {
    const cohort = await repository.cohort(context, options);
    const offering = selectSchoolOfferings(cohort, context).find(item => item.id === id);
    if (!offering) return null;
    const detail = options.details === false ? undefined : await repository.offeringDetail(id, context, options) || undefined;
    if (await repository.cohort(context) !== cohort) throw new SchoolCatalogSupersededError();
    return mapOffering(cohort, offering, detail);
  }
  async function professorById(id: string, profileYear: number, context: SchoolContext, options: SchoolLoadOptions = {}): Promise<Professor | null> {
    const profile = await repository.professorProfile(id, profileYear, context, options);
    if (!profile) return null;
    const cohort = await repository.cohort(context);
    if (!cohort.professor_profiles.includes(profile)) throw new SchoolCatalogSupersededError();
    return mapProfile(cohort, profile, context);
  }
  async function cohortProfessors(context: SchoolContext, options: SchoolLoadOptions = {}): Promise<Professor[]> {
    const cohort = await repository.cohort(context, options);
    const assignments = new Set(selectSchoolOfferings(cohort, context).flatMap(offering => offering.professor_ids.map(id => `${id}:${offering.academic_year_start}`)));
    return cohort.professor_profiles.filter(profile => assignments.has(`${profile.id}:${profile.profile_year}`)).map(profile => mapProfile(cohort, profile, context));
  }
  async function coursesByProfessor(id: string, profileYear: number, context: SchoolContext, options: SchoolLoadOptions = {}): Promise<Course[]> {
    const profile = await repository.professorProfile(id, profileYear, context, options);
    if (!profile) return [];
    const cohort = await repository.cohort(context);
    if (!cohort.professor_profiles.includes(profile)) throw new SchoolCatalogSupersededError();
    return selectSchoolOfferings(cohort, context).filter(offering => offering.academic_year_start === profileYear && offering.professor_ids.includes(profile.id))
      .map(offering => mapOffering(cohort, offering));
  }
  return { cohortCourses, courseCandidates, offeringCourse, professorById, cohortProfessors, coursesByProfessor };
}
export const schoolCatalogBridge = createSchoolCatalogBridge();
