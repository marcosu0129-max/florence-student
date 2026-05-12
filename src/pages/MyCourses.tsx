import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import { getSavedCourseIds, unsaveCourse, fetchCourses, getProfessorInitials, toggleSaveCourse, type Course } from '../lib/dataService';

export default function MyCourses() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedCourseIds();
    setSavedIds(ids);
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const savedCourses = courses.filter((c) => savedIds.includes(c.id));

  const handleToggleSave = (courseId: string) => {
    toggleSaveCourse(courseId);
    setSavedIds((prev) => prev.filter((id) => id !== courseId));
  };

  return (
    <Layout showBack={true} backTo="/profile">
      <div className="page-container flex flex-col gap-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="font-handwritten text-4xl text-text-primary">
            I Miei Corsi
          </h1>
          <p className="text-text-muted t-label text-xs mt-2">
            {loading
              ? '...'
              : `${savedCourses.length} corso/${savedCourses.length !== 1 ? 'i' : ''} salvat/${savedCourses.length !== 1 ? 'i' : 'o'}`}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-coral/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        ) : savedCourses.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-surface-soft flex items-center justify-center shadow-[0_4px_16px_rgba(42,37,32,0.04)]">
              <span className="material-symbols-outlined text-4xl text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>
                bookmark_border
              </span>
            </div>
            <div className="text-center">
              <h3 className="h-card font-semibold text-lg text-text-primary mb-1">
                Nessun corso salvato
              </h3>
              <p className="text-text-muted t-label text-xs max-w-xs">
                Salva i corsi che ti interessano...
              </p>
            </div>
            <Link
              to="/courses"
              className="flex items-center gap-1 text-coral h-card font-semibold text-[14px] hover:text-danger transition-colors"
            >
              Esplora i corsi
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </motion.div>
        ) : (
          /* Saved Courses Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
                className="flex flex-col gap-2"
              >
                {/* Course Card */}
                <CourseCard
                  id={course.id}
                  name={course.name}
                  professor={course.professorName.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '')}
                  professorInitials={getProfessorInitials(course.professorName)}
                  cfu={course.credits}
                  year={`${course.yearLevel}° Anno`}
                  semester={course.semester}
                  isRequired={course.isRequired}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                  programCode={course.programCode}
                  description={course.description}
                  isSaved={true}
                  onToggleSave={() => handleToggleSave(course.id)}
                />

                {/* Write Review button */}
                <Link
                  to={`/courses/${course.id}/review`}
                  className="flex items-center justify-center gap-2 bg-brand text-white rounded-full py-2.5 px-4 hover:bg-brand-dark transition-colors shadow-[0_4px_12px_rgba(46,94,162,0.25)]"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    rate_review
                  </span>
                  <span className="h-card font-semibold text-[13px]">Scrivi recensione</span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
