import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import ReviewCard from '../components/ReviewCard';
import { fetchProfessorById, fetchCoursesByProfessor, fetchReviewsByProfessor, getProfessorInitials, getSavedCourseIds, toggleSaveCourse } from '../lib/dataService';

function RatingBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="font-body-main text-[11px] md:text-body-main text-text-muted uppercase tracking-widest mb-1 md:mb-2">{label}</span>
      <div className="font-data-display text-xl md:text-data-display text-ink leading-none">{value > 0 ? value.toFixed(1) : '—'}</div>
      <div className="mt-2 md:mt-4 flex gap-0.5 md:gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="w-5 h-1.5 md:w-8 md:h-2 rounded-full"
            style={{ backgroundColor: i <= Math.round(value) ? color : '#e5e2e1' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfessorDetail() {
  const { id } = useParams<{ id: string }>();
  const [professor, setProfessor] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchProfessorById(id),
      fetchCoursesByProfessor(id),
      fetchReviewsByProfessor(id),
    ])
      .then(([profData, coursesData, reviewsData]) => {
        setProfessor(profData);
        setCourses(coursesData);
        setReviews(reviewsData);
        setSavedIds(getSavedCourseIds());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleToggleSave = (courseId: string) => {
    toggleSaveCourse(courseId);
    setSavedIds(getSavedCourseIds());
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-surface-container animate-pulse" />
            ))}
          </div>
          <p className="text-[13px] text-text-muted">Caricamento...</p>
        </div>
      </Layout>
    );
  }

  if (!professor) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-ink mb-3">Docente non trovato</h2>
          <Link to="/courses" className="text-ink font-bold text-[15px] hover:underline">
            Torna ai corsi
          </Link>
        </div>
      </Layout>
    );
  }

  const stats = (() => {
    if (reviews.length === 0) return { chiarezza: 0, disponibilita: 0, equita: 0, count: 0 };
    const chiarezza = reviews.reduce((s, r) => s + (r.chiarezzaScore || 0), 0) / reviews.length;
    const disponibilita = reviews.reduce((s, r) => s + (r.disponibilitaScore || 0), 0) / reviews.length;
    const equita = reviews.reduce((s, r) => s + (r.equitaScore || 0), 0) / reviews.length;
    return {
      chiarezza: parseFloat(chiarezza.toFixed(1)),
      disponibilita: parseFloat(disponibilita.toFixed(1)),
      equita: parseFloat(equita.toFixed(1)),
      count: reviews.length,
    };
  })();

  return (
    <Layout>
      <div className="flex flex-col gap-8 md:gap-20 pb-32">

        {/* Editorial Header */}
        <section className="relative z-10">
          <div className="max-w-4xl">
            <p className="font-card-title text-[12px] md:text-card-title text-text-muted mb-2 md:mb-4 tracking-tight">
              {professor.department}
            </p>
            <h1 className="font-h1-editorial text-2xl sm:text-3xl md:font-h1-editorial md:text-h1-editorial lg:font-hero-display lg:text-hero-display text-ink leading-tight md:leading-none mb-3 md:mb-6">
              {professor.name}
            </h1>
            <div className="flex items-center gap-3 md:gap-4 mt-2 md:mt-4">
              <div className="flex items-center bg-card-base px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-border-card shadow-card rotate-1">
                <span className="material-symbols-outlined text-pop-yellow mr-1.5 md:mr-2 text-base md:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="font-card-title text-[13px] md:text-card-title text-ink">{professor.rating.toFixed(1)}</span>
                <span className="font-body-main text-[11px] md:text-body-main text-text-muted ml-1.5 md:ml-2">/ 5.0 ({stats.count})</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {professor.bio && (
            <div className="mt-6 md:mt-12 max-w-2xl bg-canvas p-4 md:p-6 lg:p-8 rounded-xl border border-surface-container shadow-card -rotate-1 relative z-20">
              <p className="font-body-main text-[13px] md:text-body-main text-text leading-relaxed">
                {professor.bio}
              </p>
            </div>
          )}
        </section>

        {/* Rating Dashboard */}
        <section className="relative z-10">
          <h2 className="font-h2-section text-lg md:text-h2-section text-ink mb-4 md:mb-8">Valutazioni Medie</h2>
          <div className="bg-canvas border border-surface-container rounded-2xl p-4 md:p-6 lg:p-12 shadow-float rotate-1 flex flex-col md:flex-row justify-around items-center gap-6 md:gap-8">
            <RatingBar value={stats.chiarezza} color="#4F8BFF" label="Chiarezza" />
            <div className="hidden md:block w-px h-24 bg-surface-container" />
            <div className="md:hidden w-full h-px bg-surface-container" />
            <RatingBar value={stats.disponibilita} color="#4ADE80" label="Disponibilita" />
            <div className="hidden md:block w-px h-24 bg-surface-container" />
            <div className="md:hidden w-full h-px bg-surface-container" />
            <RatingBar value={stats.equita} color="#FF6B35" label="Equita" />
          </div>
        </section>

        {/* Courses */}
        {courses.length > 0 && (
          <section className="relative z-10">
            <h2 className="font-h2-section text-lg md:text-h2-section text-ink mb-4 md:mb-8">Insegnamenti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  professor={professor.name}
                  professorInitials={getProfessorInitials(professor.name)}
                  cfu={course.credits}
                  year={`${course.yearLevel}°`}
                  semester={course.semester}
                  isRequired={course.isRequired}
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

        {/* Reviews */}
        <section className="relative z-10">
          <div className="flex justify-between items-end mb-4 md:mb-8">
            <h2 className="font-h2-section text-lg md:text-h2-section text-ink">Recensioni Recenti</h2>
            <span className="font-nav-link text-[11px] md:text-nav-link text-text-muted">{reviews.length} totali</span>
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-10 md:py-12 bg-card-base rounded-xl border border-border-card">
              <p className="text-[13px] md:text-[14px] text-text-muted">Nessuna recensione</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              <div className="md:col-span-8 space-y-4 md:space-y-6">
                {reviews.map((review, i) => (
                  <div key={review.id} className={i % 2 === 0 ? 'rotate-1' : '-rotate-1'}>
                    <ReviewCard
                      id={review.id}
                      author={review.author}
                      authorInitial={review.author.charAt(0).toUpperCase()}
                      date={review.date}
                      ratingDifficulty={review.chiarezzaScore || 3}
                      ratingTeaching={review.disponibilitaScore || 3}
                      content={review.verbalReview || review.content || ''}
                      helpfulCount={0}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <Link
        to={`/professors/${id}/review`}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-8 z-50 bg-ink/75 text-canvas w-10 h-10 rounded-full shadow-float flex items-center justify-center transition-transform hover:scale-105 hover:bg-ink group"
        aria-label="Valuta docente"
      >
        <span className="material-symbols-outlined text-sm text-canvas group-hover:-rotate-12 transition-transform">edit</span>
      </Link>
    </Layout>
  );
}
