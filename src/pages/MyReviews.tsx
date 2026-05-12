import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import ReviewCard from '../components/ReviewCard';
import { fetchUserReviews, fetchCourses, deleteDemoReview, type Review } from '../lib/dataService';

interface ReviewWithCourse extends Review {
  courseName: string;
}

export default function MyReviews() {
  const [reviews, setReviews] = useState<ReviewWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchUserReviews(), fetchCourses()]).then(([reviewsData, coursesData]) => {
      const courseMap: Record<string, string> = {};
      for (const c of coursesData) {
        courseMap[c.id] = c.name;
      }
      const enriched: ReviewWithCourse[] = reviewsData.map((r) => ({
        ...r,
        courseName: r.courseName || courseMap[r.courseId] || 'Corso',
      }));
      setReviews(enriched);
      setLoading(false);
    });
  }, []);

  const handleDelete = (reviewId: string) => {
    if (reviewId.startsWith('demo-')) {
      deleteDemoReview(reviewId);
    }
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
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
            Le mie Recensioni
          </h1>
          <p className="text-text-muted t-label text-xs mt-2">
            {loading
              ? '...'
              : `${reviews.length} recension${reviews.length !== 1 ? 'i' : 'e'} lasciat${reviews.length !== 1 ? 'e' : 'a'}`}
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
        ) : reviews.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-surface-soft flex items-center justify-center shadow-[0_4px_16px_rgba(42,37,32,0.04)]">
              <span className="material-symbols-outlined text-4xl text-text-muted" style={{ fontVariationSettings: "'FILL' 0" }}>
                forum
              </span>
            </div>
            <div className="text-center">
              <h3 className="h-card font-semibold text-lg text-text-primary mb-1">
                Nessuna recensione
              </h3>
              <p className="text-text-muted t-label text-xs max-w-xs">
                Non hai ancora lasciato nessuna recensione.
              </p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1 text-coral h-card font-semibold text-[14px] hover:text-danger transition-colors"
            >
              Esplora corsi
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </motion.div>
        ) : (
          /* Reviews List */
          <div className="flex flex-col gap-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
              >
                <ReviewCard
                  id={review.id}
                  author={review.author}
                  authorInitial={review.author.charAt(0).toUpperCase()}
                  date={review.date}
                  ratingDifficulty={review.ratingDifficulty}
                  ratingTeaching={review.ratingTeaching}
                  grade={review.grade}
                  content={review.content}
                  tip={review.tip}
                  tipType={review.tipType}
                  helpfulCount={review.helpfulCount}
                />

                {/* Review Action Bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="flex gap-3 mt-2 -rotate-1"
                >
                  <Link
                    to={`/courses/${review.courseId}`}
                    className="flex-1 border border-surface-variant rounded-full py-2.5 text-center text-coral h-card font-medium text-[14px] hover:bg-coral/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Modifica
                  </Link>
                  <button
                    onClick={() => setPendingDelete(review.id)}
                    className="flex-1 border border-danger/30 text-danger rounded-full py-2.5 text-center h-card font-medium text-[14px] hover:bg-danger/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Elimina
                  </button>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setPendingDelete(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-card-base border border-border-card rounded-2xl p-6 shadow-float max-w-sm w-full text-center"
          >
            <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-danger" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
            </div>
            <h3 className="font-h2-section text-h2-section text-ink mb-2">Eliminare?</h3>
            <p className="text-text-muted t-label text-xs mb-6">
              Questa recensione sara rimossa in modo permanente. L&apos;azione non puo essere annullata.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 border border-ink text-ink rounded-full py-3 text-center h-card font-medium text-[14px] hover:bg-ink/5 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  handleDelete(pendingDelete);
                  setPendingDelete(null);
                }}
                className="flex-1 border border-danger text-danger rounded-full py-3 text-center h-card font-medium text-[14px] hover:bg-danger/5 transition-colors cursor-pointer"
              >
                Elimina
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
}
