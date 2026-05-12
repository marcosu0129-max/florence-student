import { motion } from 'framer-motion';

interface ReviewCardProps {
  id: string;
  author: string;
  authorInitial: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  helpfulCount?: number;
  onHelpful?: () => void;
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
            color: i < value ? '#FFE25C' : '#d8c2bb',
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ReviewCard({
  author,
  authorInitial,
  date,
  ratingDifficulty,
  ratingTeaching,
  grade,
  content,
}: ReviewCardProps) {
  return (
    <motion.article
      className="bg-card-base border border-border-card p-4 sm:p-card-padding shadow-card hover:shadow-float transition-all duration-300 rounded-xl -rotate-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-semibold text-ink text-[16px]">
            {authorInitial}
          </div>
          <div>
            <div className="font-card-title text-card-title text-ink">{author}</div>
            <div className="font-caption text-caption text-text-muted">{date}</div>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="material-symbols-outlined text-pop-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="material-symbols-outlined text-pop-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="material-symbols-outlined text-pop-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="material-symbols-outlined text-pop-yellow text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          <span className="material-symbols-outlined text-pop-yellow text-sm" style={{ fontVariationSettings: "'FILL' 0" }}>star</span>
        </div>
      </div>

      <p className="font-body-main text-body-main text-text leading-relaxed mb-4">
        &ldquo;{content}&rdquo;
      </p>

      <div className="flex gap-4">
        <span className="bg-canvas border border-outline-variant px-2 py-1 rounded text-caption text-text-muted">
          Chiarezza: {ratingDifficulty}
        </span>
        <span className="bg-canvas border border-outline-variant px-2 py-1 rounded text-caption text-text-muted">
          Didattica: {ratingTeaching}
        </span>
        {grade !== undefined && (
          <span className="bg-canvas border border-outline-variant px-2 py-1 rounded text-caption text-text-muted">
            Voto: {grade}
          </span>
        )}
      </div>
    </motion.article>
  );
}
