import { useSavedCourses } from '../lib/useSavedCourses';
import CourseCard from './CourseCard';
import { type Course } from '../lib/dataService';
import { schoolLink } from '../lib/schoolLinks';

export default function CatalogCourseGrid({ courses }: { courses: Course[] }) {
  const saved = useSavedCourses();
  return <>{saved.error && <p role="alert" className="mb-4 text-sm text-error">{saved.error}<button type="button" onClick={saved.retry} className="ml-3 min-h-11 underline">Riprova</button></p>}<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {courses.map(course => <CourseCard key={course.offeringId || course.id} id={course.id} name={course.name}
      professor={course.professorName} professorNames={course.professorNames} professorRealIds={course.professorRealIds}
      cfu={course.credits > 0 ? course.credits : null} year={course.yearLevel ? `${course.yearLevel}°` : ''} semester={course.semester}
      isRequired={course.isRequired} rating={course.rating} reviewCount={course.reviewCount} statsStatus={course.statsStatus}
      programCode={course.programCode} academicYear={course.academicYear} officialCode={course.officialCode}
      href={course.programKey && typeof course.cohortYear === 'number' ? schoolLink(`/courses/${course.id}`, { programKey: course.programKey, cohortYear: course.cohortYear,
        curriculumCode: course.curriculumCode, academicYearStart: course.academicYearStart }, { offering: course.offeringId }) : undefined}
      professorHrefs={course.professorRealIds?.map(id => course.programKey && typeof course.cohortYear === 'number' && course.academicYearStart ? schoolLink(`/professors/${id}`, {
        programKey: course.programKey, cohortYear: course.cohortYear, curriculumCode: course.curriculumCode, academicYearStart: course.academicYearStart,
      }, { profileYear: course.academicYearStart }) : undefined)}
      activityType={course.activityType} isSaved={saved.isSaved(course.id)} saveDisabled={saved.unavailable} savePending={saved.isPending(course.id)}
      onToggleSave={() => { void saved.toggle(course.id); }} />)}
  </div></>;
}
