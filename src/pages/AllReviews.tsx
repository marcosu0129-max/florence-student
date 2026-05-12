import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import ReviewCard from '../components/ReviewCard';
import { fetchAllReviews } from '../lib/dataService';

interface ReviewWithCourse {
  id: string;
  courseId: string;
  author: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  tip?: string;
  tipType?: 'success' | 'warning';
  helpfulCount: number;
  courseName?: string;
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[14px]"
          style={{
            fontVariationSettings: `'FILL' ${i < value ? 1 : 0}`,
            color: i < value ? '#F0A93D' : '#d8c2bb',
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function StarRatingDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[12px]"
          style={{
            fontVariationSettings: `'FILL' ${i < Math.round(rating) ? 1 : 0}`,
            color: i < Math.round(rating) ? '#F0A93D' : '#d8c2bb',
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

const avatarGradients = [
  'from-coral to-[#c44a3c]',
  'from-mint to-mint-deep',
  'from-amber to-[#d99a32]',
  'from-[#b89bd9] to-[#9678c4]',
  'from-[#f4b5b0] to-[#e89b8e]',
];

export default function AllReviews() {
  const [reviews, setReviews] = useState<ReviewWithCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReviews().then((data) => {
      setReviews(data as ReviewWithCourse[]);
      setLoading(false);
    });
  }, []);

  return (
    <Layout showBack={true} backTo="/">
      <div className="page-container flex flex-col gap-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h1 className="h-hero text-text-primary">
            Tutte le Recensioni
          </h1>
          <p className="text-text-muted t-label text-xs mt-2">
            {loading
              ? '...'
              : `${reviews.length} recensioni dalla comunità studentesca`}
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-brand/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-surface-cream flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-text-muted"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                rate_review
              </span>
            </div>
            <div className="text-center">
              <h3 className="h-card font-semibold text-lg text-text-primary mb-1">
                Nessuna recensione
              </h3>
              <p className="text-text-muted t-label text-xs max-w-xs">
                Le recensioni appariranno qui.
              </p>
            </div>
            <Link
              to="/"
              className="text-brand h-card font-medium text-[14px] hover:underline flex items-center gap-1"
            >
              Esplora corsi
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </motion.div>
        )}

        {/* Reviews Grid */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review, index) => {
              const initials = review.author
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const colorIndex = review.author.charCodeAt(0) % avatarGradients.length;
              const avgRating = (review.ratingDifficulty + review.ratingTeaching) / 2;

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  className="bg-surface-soft rounded-[20px] p-5 shadow-sm border border-surface-variant hover:shadow-md transition-all"
                >
                  {/* Author Row */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[colorIndex]} flex items-center justify-center text-white font-semibold text-[14px] shrink-0`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="h-card font-semibold text-[15px] text-text-primary leading-tight">
                        {review.author}
                      </h3>
                      <p className="text-[12px] text-text-muted t-label mt-0.5">
                        {review.date}
                      </p>
                    </div>
                    <Link
                      to={`/courses/${review.courseId}`}
                      className="text-brand h-card font-medium text-[12px] hover:underline shrink-0"
                    >
                      {review.courseName || 'Corso'}
                    </Link>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="bg-surface-cream border border-surface-variant px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] h-card font-medium text-text-muted uppercase tracking-wide">
                        Difficoltà
                      </span>
                      <StarRating value={review.ratingDifficulty} />
                    </div>
                    <div className="bg-surface-cream border border-surface-variant px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] h-card font-medium text-text-muted uppercase tracking-wide">
                        Didattica
                      </span>
                      <StarRating value={review.ratingTeaching} />
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-[14px] leading-relaxed text-text-secondary t-body mb-3 line-clamp-3">
                    {review.content}
                  </p>

                  {/* Tip */}
                  {review.tip && (
                    <div
                      className={`rounded-xl p-4 mb-4 border ${
                        review.tipType === 'warning'
                          ? 'bg-amber/10 border-amber/20'
                          : 'bg-mint/10 border-mint/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`material-symbols-outlined text-[16px] ${
                            review.tipType === 'warning' ? 'text-amber' : 'text-mint-deep'
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          lightbulb
                        </span>
                        <span
                          className={`h-card font-semibold text-[12px] ${
                            review.tipType === 'warning' ? 'text-amber' : 'text-mint-deep'
                          }`}
                        >
                          Consiglio per l&apos;esame
                        </span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-text-secondary t-body">
                        {review.tip}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-text-muted">
                        thumb_up
                      </span>
                      <span className="text-[12px] text-text-muted h-card">
                        Utile ({review.helpfulCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRatingDisplay rating={avgRating} />
                      <span className="text-[12px] text-text-muted h-card">
                        ({avgRating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
