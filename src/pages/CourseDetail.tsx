import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ReviewCard from '../components/ReviewCard';
import StarRatingDisplay from '../components/StarRatingDisplay';
import AccordionItem from '../components/AccordionItem';
import { fetchCourseById, fetchReviewsByCourse, isCourseSaved, toggleSaveCourse } from '../lib/dataService';

type Tab = 'reviews' | 'info';

function RatingBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center text-center min-w-0 px-2">
      <span className="font-body-main text-[10px] sm:text-[11px] text-text-muted uppercase tracking-widest mb-1">{label}</span>
      <div className="font-data-display text-lg sm:text-xl md:text-data-display text-ink leading-none">{value > 0 ? value.toFixed(1) : '—'}</div>
      <div className="mt-2 flex gap-0.5 md:gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="w-4 h-1.5 md:w-8 md:h-2 rounded-full"
            style={{ backgroundColor: i <= Math.round(value) ? color : '#e5e2e1' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('reviews');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const courseData = await fetchCourseById(id);
      const reviewsData = await fetchReviewsByCourse(id);
      setCourse(courseData);
      setReviews(reviewsData);
      setIsSaved(isCourseSaved(id));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [id]);

  const handleToggleSave = () => {
    if (!id) return;
    const saved = toggleSaveCourse(id);
    setIsSaved(saved);
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

  if (!course) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-ink mb-3">Corso non trovato</h2>
          <Link to="/courses" className="text-ink font-semibold hover:underline">Torna ai corsi</Link>
        </div>
      </Layout>
    );
  }

  const stats = (() => {
    if (reviews.length === 0) return { difficulty: 0, teaching: 0, grading: 0, count: 0 };
    const d = reviews.reduce((s, r) => s + (r.ratingDifficulty || 0), 0) / reviews.length;
    const t = reviews.reduce((s, r) => s + (r.ratingTeaching || 0), 0) / reviews.length;
    const g = reviews.reduce((s, r) => s + (r.grade || 0), 0) / reviews.length;
    const gradingNorm = Math.max(1, Math.min(5, ((g - 18) / 12) * 4 + 1));
    return {
      difficulty: parseFloat(d.toFixed(1)),
      teaching: parseFloat(t.toFixed(1)),
      grading: parseFloat(gradingNorm.toFixed(1)),
      count: reviews.length,
    };
  })();

  return (
    <Layout>
      <div className="flex flex-col gap-8 md:gap-20 pb-32">

        {/* Editorial Header */}
        <section className="relative z-10">
          <div className="flex justify-between items-start gap-3 mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              {course.programCode && (
                <span className="inline-block mb-2 md:mb-3 text-[10px] md:text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase bg-card-tinted border border-border-card px-2.5 py-0.5 md:px-3 md:py-1 rounded-sm shadow-sm">
                  {course.programCode}
                </span>
              )}
              <h1 className="font-h1-editorial text-h1-editorial md:font-h1-editorial md:text-h1-editorial lg:font-hero-display lg:text-hero-display text-ink leading-tight md:leading-none mb-3 md:mb-4">
                {course.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-body-main text-[11px] sm:text-[12px] text-on-surface-variant">
                {(course.professorNames || []).map((name: string, i: number) => {
                  const realId = (course.professorRealIds || [])[i];
                  const displayName = name.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '');
                  if (realId) {
                    return (
                      <Link
                        key={i}
                        to={`/professors/${realId}`}
                        className="font-semibold text-ink hover:underline decoration-2 underline-offset-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {displayName}
                      </Link>
                    );
                  }
                  return (
                    <span key={i} className="font-semibold text-ink">
                      {displayName}
                    </span>
                  );
                })}
                {(!course.professorNames || course.professorNames.length === 0) && (
                  <span className="text-text-muted">Docente da assegnare</span>
                )}
                <span className="text-surface-tint opacity-50">•</span>
                <span>{course.credits} CFU</span>
                <span className="text-surface-tint opacity-50">•</span>
                <span>{course.semester}</span>
              </div>
            </div>
            <button
              onClick={handleToggleSave}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-canvas border border-border-card shadow-card flex items-center justify-center text-text-muted hover:text-pop-red transition-colors shrink-0"
              aria-label={isSaved ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: `'FILL' ${isSaved ? 1 : 0}` }}>
                bookmark
              </span>
            </button>
          </div>

          {/* Bio / description */}
          {course.description && (
            <div className="max-w-2xl bg-canvas p-4 md:p-6 lg:p-8 rounded-xl border border-surface-container shadow-card -rotate-1 relative z-20">
              <p className="font-body-main text-[13px] md:text-body-main text-text leading-relaxed">{course.description}</p>
            </div>
          )}
        </section>

        {/* Rating Dashboard */}
        <section className="relative z-10">
          <h2 className="font-h2-section text-base sm:text-lg md:text-h2-section text-ink mb-4 md:mb-8">Valutazioni Medie</h2>
          <div className="bg-canvas border border-surface-container rounded-2xl p-4 sm:p-5 md:p-6 lg:p-12 shadow-float rotate-1 flex flex-col md:flex-row justify-around items-center gap-5 md:gap-8 overflow-x-auto">
            <RatingBar value={stats.difficulty} color="#FF6B35" label="Difficolta" />
            <div className="hidden md:block w-px h-24 bg-surface-container" />
            <div className="md:hidden w-full h-px bg-surface-container" />
            <RatingBar value={stats.teaching} color="#4F8BFF" label="Didattica" />
            <div className="hidden md:block w-px h-24 bg-surface-container" />
            <div className="md:hidden w-full h-px bg-surface-container" />
            <RatingBar value={stats.grading} color="#4ADE80" label="Voto Medio" />
          </div>
          <p className="text-center font-caption text-[11px] md:text-caption text-text-muted mt-3 md:mt-4">
            Basata su {stats.count} recension{stats.count === 1 ? 'e' : 'i'}
          </p>
        </section>

        {/* Tabs */}
        <section className="relative z-10">
          <div className="flex gap-1 bg-card-base p-1 rounded-lg inline-flex items-center shadow-inner mb-6 md:mb-8">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-1.5 md:px-6 md:py-2 rounded-md font-nav-link text-[12px] md:text-nav-link font-semibold transition-all ${
                activeTab === 'reviews' ? 'bg-canvas text-ink shadow-sm' : 'text-text-muted hover:text-ink'
              }`}
            >
              Recensioni
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-1.5 md:px-6 md:py-2 rounded-md font-nav-link text-[12px] md:text-nav-link font-semibold transition-all ${
                activeTab === 'info' ? 'bg-canvas text-ink shadow-sm' : 'text-text-muted hover:text-ink'
              }`}
            >
              Info
            </button>
          </div>

          {activeTab === 'reviews' ? (
            reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-text-muted">rate_review</span>
                </div>
                <h3 className="font-semibold text-[15px] md:text-[16px] text-ink mb-2">Nessuna recensione</h3>
                <p className="text-[12px] md:text-[13px] text-text-muted mb-2">Sii il primo a lasciare una recensione!</p>
                <Link to={`/courses/${id}/review`} className="text-ink font-semibold text-[13px] md:text-[14px] hover:underline">
                  Scrivi la prima &#8594;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                <div className="md:col-span-8 space-y-4 md:space-y-6">
                  {reviews.map((review, i) => (
                    <div key={review.id} className={i % 2 === 0 ? '-rotate-1' : 'rotate-1'}>
                      <ReviewCard
                        id={review.id}
                        author={review.author}
                        authorInitial={review.author.charAt(0).toUpperCase()}
                        date={review.date}
                        ratingDifficulty={review.ratingDifficulty}
                        ratingTeaching={review.ratingTeaching}
                        grade={review.grade}
                        content={review.content}
                        helpfulCount={0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-3 md:gap-4 max-w-2xl">
              {course.description && (
                <div className="mb-1 md:mb-2">
                  <h3 className="font-h2-section text-lg md:text-h2-section text-ink mb-2 md:mb-3">Descrizione</h3>
                  <p className="font-body-main text-[13px] md:text-body-main text-text leading-relaxed">{course.description}</p>
                </div>
              )}

              {(course as any).lingua && (
                <AccordionItem title="Lingua">{course.lingua}</AccordionItem>
              )}
              {(course as any).frequenza && (
                <AccordionItem title="Frequenza">{course.frequenza}</AccordionItem>
              )}
              {(course as any).durata && (
                <AccordionItem title="Durata">{course.durata}</AccordionItem>
              )}
              {(course as any).obiettiviFormativi && (
                <AccordionItem title="Obiettivi formativi">{course.obiettiviFormativi}</AccordionItem>
              )}
              {(course as any).contenuti && (
                <AccordionItem title="Contenuti">{course.contenuti}</AccordionItem>
              )}
              {(course as any).prerequisiti && (
                <AccordionItem title="Prerequisiti">{course.prerequisiti}</AccordionItem>
              )}
              {(course as any).metodiDidattici && (
                <AccordionItem title="Metodi didattici">{course.metodiDidattici}</AccordionItem>
              )}
              {(course as any).verificaApprendimento && (
                <AccordionItem title="Verifica dell'apprendimento">{course.verificaApprendimento}</AccordionItem>
              )}
              {(course as any).programmaEsteso && (
                <AccordionItem title="Programma esteso">{course.programmaEsteso}</AccordionItem>
              )}
              {(course as any).testi && (
                <AccordionItem title="Testi">{course.testi}</AccordionItem>
              )}
              {(course as any).obiettiviAgenda2030 && (
                <AccordionItem title="Obiettivi Agenda 2030">{course.obiettiviAgenda2030}</AccordionItem>
              )}
              {(course as any).altro && (
                <AccordionItem title="Altro">{course.altro}</AccordionItem>
              )}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <Link
        to={`/courses/${id}/review`}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-8 z-50 bg-ink/75 text-canvas w-10 h-10 rounded-full shadow-float flex items-center justify-center transition-transform hover:scale-105 hover:bg-ink group"
        aria-label="Scrivi recensione"
      >
        <span className="material-symbols-outlined text-sm text-canvas group-hover:-rotate-12 transition-transform">edit</span>
      </Link>
    </Layout>
  );
}
