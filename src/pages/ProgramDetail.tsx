import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import { fetchCoursesByProgram, programs, getProfessorInitials, getSavedCourseIds, toggleSaveCourse } from '../lib/dataService';

export default function ProgramDetail() {
  const { code } = useParams<{ code: string }>();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const program = programs.find((p) => p.code === code);

  useEffect(() => {
    if (!code) return;
    fetchCoursesByProgram(code).then((data) => {
      setCourses(data);
      setSavedIds(getSavedCourseIds());
      setLoading(false);
    });
  }, [code]);

  const handleToggleSave = (courseId: string) => {
    toggleSaveCourse(courseId);
    setSavedIds(getSavedCourseIds());
  };

  if (!program) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-ink mb-4">Programma non trovato</h2>
          <Link to="/" className="text-ink font-bold text-[15px] hover:underline">Torna alla home</Link>
        </div>
      </Layout>
    );
  }

  const requiredCourses = courses.filter((c) => c.isRequired);
  const electiveCourses = courses.filter((c) => !c.isRequired);

  return (
    <Layout>
      <div className="flex flex-col gap-8 md:gap-16">

        {/* Header */}
        <section className="relative z-10">
          <span className="inline-block mb-4 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase bg-card-tinted border border-border-card px-3 py-1 rounded-sm shadow-sm">
            {program.code}
          </span>
          <h1 className="font-h1-editorial text-h1-editorial md:font-h1-editorial lg:font-hero-display lg:text-hero-display text-ink leading-tight md:leading-none mb-3 md:mb-4">
            {program.name}
          </h1>
          <p className="font-body-main text-body-main text-text-muted">
            {program.faculty} {program.president && `\u00B7 ${program.president}`}
          </p>
        </section>

        {/* Stats */}
        <section className="relative z-10">
          <div className="bg-canvas border border-surface-container rounded-2xl p-4 md:p-8 shadow-float rotate-1">
            <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-6 text-center">
              <div>
                <div
                  className="font-data-display text-ink leading-none mb-0.5 sm:mb-1 md:mb-2"
                  style={{ fontSize: 'clamp(20px, 5.5vw, var(--text-data-display))' }}
                >
                  {loading ? '...' : courses.length}
                </div>
                <div className="font-body-main text-[8px] sm:text-[9px] md:text-[11px] text-text-muted uppercase tracking-widest">Insegnamenti</div>
              </div>
              <div className="border-l border-r border-outline-variant/20">
                <div
                  className="font-data-display text-ink leading-none mb-0.5 sm:mb-1 md:mb-2"
                  style={{ fontSize: 'clamp(20px, 5.5vw, var(--text-data-display))' }}
                >
                  {loading ? '...' : requiredCourses.length}
                </div>
                <div className="font-body-main text-[8px] sm:text-[9px] md:text-[11px] text-text-muted uppercase tracking-widest">Obbligatori</div>
              </div>
              <div>
                <div
                  className="font-data-display text-ink leading-none mb-0.5 sm:mb-1 md:mb-2"
                  style={{ fontSize: 'clamp(20px, 5.5vw, var(--text-data-display))' }}
                >
                  {loading ? '...' : program.totalCredits}
                </div>
                <div className="font-body-main text-[8px] sm:text-[9px] md:text-[11px] text-text-muted uppercase tracking-widest">CFU Totali</div>
              </div>
            </div>
          </div>
        </section>

        {/* Required Courses */}
        {!loading && requiredCourses.length > 0 && (
          <section className="relative z-10">
            <h2 className="font-h2-section text-base sm:text-lg md:text-h2-section text-ink mb-6 md:mb-8">Obbligatori</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requiredCourses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  professor={course.professorName?.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '') || '—'}
                  professorInitials={getProfessorInitials(course.professorName || '')}
                  cfu={course.credits}
                  year={`${course.yearLevel}°`}
                  semester={course.semester}
                  isRequired={true}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                  description={course.description}
                  rotate={i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : 'none'}
                  isSaved={savedIds.includes(course.id)}
                  onToggleSave={() => handleToggleSave(course.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Elective Courses */}
        {!loading && electiveCourses.length > 0 && (
          <section className="relative z-10">
            <h2 className="font-h2-section text-base sm:text-lg md:text-h2-section text-ink mb-6 md:mb-8">A Scelta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {electiveCourses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  professor={course.professorName?.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '') || '—'}
                  professorInitials={getProfessorInitials(course.professorName || '')}
                  cfu={course.credits}
                  year={`${course.yearLevel}°`}
                  semester={course.semester}
                  isRequired={false}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                  description={course.description}
                  rotate={i % 3 === 0 ? 'right' : i % 3 === 2 ? 'left' : 'none'}
                  isSaved={savedIds.includes(course.id)}
                  onToggleSave={() => handleToggleSave(course.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-surface-container animate-pulse" />
              ))}
            </div>
            <p className="text-[13px] text-text-muted">Caricamento...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
