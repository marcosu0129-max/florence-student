import CourseCard from './CourseCard';
import type { SchoolCommunityStatsFields } from '../lib/schoolCommunityStats';
import type { SchoolCohort, SchoolOffering } from '../lib/schoolCatalogTypes';
import { offeringLink, schoolLink } from '../lib/schoolLinks';
import type { useSavedCourses } from '../lib/useSavedCourses';

export default function SchoolOfferingCard({ offering, cohort, saved, stats }: { offering: SchoolOffering; cohort: SchoolCohort; saved: ReturnType<typeof useSavedCourses>; stats?: SchoolCommunityStatsFields }) {
  const teachers = offering.assignments.map(assignment => ({ assignment, profile: cohort.professor_profiles.find(profile => profile.id === assignment.professor_id && profile.profile_year === assignment.profile_year) })).filter(item => item.profile !== undefined);
  const uniqueTeachers = teachers.filter((item, index) => teachers.findIndex(other => other.profile!.id === item.profile!.id && other.assignment.profile_year === item.assignment.profile_year) === index);
  return <CourseCard rating={stats?.rating} reviewCount={stats?.reviewCount} statsStatus={stats?.statsStatus} id={offering.course_id} name={offering.name} professor="" cfu={offering.credits} year={`${offering.year_level}°`} semester={offering.semester || ''} isRequired={offering.is_required} programCode={cohort.program.program_key} academicYear={offering.academic_year} officialCode={offering.official_code} activityType={offering.kind} requirementLabel={offering.curriculum_name || offering.curriculum_code} href={offeringLink(offering)} professorNames={uniqueTeachers.map(item => item.profile!.name)} professorRealIds={uniqueTeachers.map(item => item.profile!.id)} professorHrefs={uniqueTeachers.map(item => schoolLink(`/professors/${item.profile!.id}`, { programKey: offering.program_key, cohortYear: offering.cohort_year, curriculumCode: offering.curriculum_code, academicYearStart: offering.academic_year_start }, { profileYear: item.assignment.profile_year }))} isSaved={saved.isSaved(offering.course_id)} saveDisabled={saved.unavailable} savePending={saved.isPending(offering.course_id)} onToggleSave={() => saved.toggle(offering.course_id)} />;
}
