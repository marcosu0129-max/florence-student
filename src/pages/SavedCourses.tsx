import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import { getSavedCourseIds, fetchCourses, toggleSaveCourse } from '../lib/dataService';

export default function SavedCourses() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getSavedCourseIds();
    setSavedIds(ids);
    fetchCourses().then((data) => {
      setCourses(data.filter((c: any) => ids.includes(c.id)));
      setLoading(false);
    });
  }, []);

  const handleToggleSave = (id: string) => {
    toggleSaveCourse(id);
    setSavedIds((prev) => prev.filter((i) => i !== id));
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">

        {/* Header */}
        <div className="-rotate-1">
          <h1 className="font-h1-editorial text-h1-editorial text-ink mb-2">I miei corsi<br/>salvati</h1>
          <p className="font-body-main text-body-main text-text-muted">
            {loading ? '...' : `${savedIds.length} corsi salvati`}
          </p>
        </div>

        {/* Course Grid or Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-surface-container animate-pulse" />
              ))}
            </div>
            <p className="text-[13px] text-text-muted">Caricamento...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[48px] text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>
                bookmark_border
              </span>
            </div>
            <p className="font-card-title text-card-title text-text-muted">Nessun corso salvato</p>
            <Link to="/courses" className="text-ink font-semibold text-[14px] hover:underline">
              Esplora corsi &#8594;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div key={course.id} className="flex flex-col">
                <CourseCard
                  id={course.id}
                  name={course.name}
                  professor={course.professorName?.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '') || '—'}
                  cfu={course.credits}
                  year={`${course.yearLevel}°`}
                  semester={course.semester}
                  isRequired={course.isRequired}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                  programCode={course.programCode}
                  description={course.description}
                  rotate={index % 3 === 0 ? 'left' : index % 3 === 2 ? 'right' : 'none'}
                  isSaved={true}
                  onToggleSave={() => handleToggleSave(course.id)}
                />
                <button
                  onClick={() => handleToggleSave(course.id)}
                  className="mt-2 text-[13px] text-text-muted font-semibold hover:text-ink transition-colors text-left"
                >
                  Rimuovi dai salvati
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
