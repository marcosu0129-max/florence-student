import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface CourseCardProps {
  id: string;
  name: string;
  professor: string;
  professorInitials?: string;
  cfu: number;
  year: string;
  semester: string;
  isRequired: boolean;
  rating?: number;
  reviewCount?: number;
  programCode?: string;
  onClick?: () => void;
  compact?: boolean;
  description?: string;
  category?: string;
  professorNames?: string[];
  professorRealIds?: string[];
  rotate?: 'left' | 'right' | 'none';
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export default function CourseCard({
  id,
  name,
  professor,
  cfu,
  semester,
  isRequired,
  rating,
  reviewCount,
  programCode,
  onClick,
  compact = false,
  rotate = 'none',
  isSaved = false,
  onToggleSave,
  professorNames,
  professorRealIds,
}: CourseCardProps) {
  const navigate = useNavigate();

  const rotateClass = rotate === 'left' ? '-rotate-1' : rotate === 'right' ? 'rotate-1' : '';

  // Prefer professorNames array from Supabase, fall back to professor prop
  const displayProf = professorNames && professorNames.length > 0
    ? professorNames[0].replace(/^(Prof\.?|Prof\.ssa)\s*/i, '')
    : (professor || '—');

  const openCourse = () => {
    if (onClick) { onClick(); return; }
    navigate(`/courses/${id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.currentTarget !== event.target) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCourse();
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Apri dettagli corso: ${name}`}
      onClick={openCourse}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex flex-col gap-3
        bg-card-base
        border border-border-card
        shadow-card
        hover:-translate-y-1 hover:shadow-float
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2
        cursor-pointer
        overflow-hidden
        ${compact ? 'p-4 sm:p-5' : 'p-4 sm:p-card-padding'}
        rounded-xl
        ${rotateClass}
        transition-all duration-300
      `}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {programCode && (
            <span className="inline-block mb-1.5 text-[11px] font-semibold tracking-wide text-on-surface-variant uppercase bg-canvas border border-outline-variant px-2.5 py-0.5 rounded-sm shadow-sm">
              {programCode}
            </span>
          )}
          <h2 className={`font-semibold text-text group-hover:text-ink transition-colors duration-200 ${compact ? 'text-[14px] sm:text-[15px]' : 'text-[15px] sm:text-[17px]'} leading-snug`}>
            {name}
          </h2>
        </div>
        <button
          className="shrink-0 w-9 h-9 rounded-full bg-canvas border border-border-card flex items-center justify-center transition-colors"
          style={{
            color: isSaved ? 'var(--color-pop-red)' : 'var(--color-text-muted)',
            borderColor: isSaved ? 'var(--color-pop-red)' : 'var(--color-border-card)',
          }}
          onClick={(e) => { e.stopPropagation(); onToggleSave?.(); }}
          aria-label={isSaved ? 'Rimuovi dai salvati' : 'Salva corso'}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: `'FILL' ${isSaved ? 1 : 0}` }}>
            {isSaved ? 'bookmark' : 'bookmark_border'}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[12px] text-text-secondary bg-canvas border border-outline-variant px-2.5 py-1 rounded-full">
          {cfu} CFU
        </span>
        <span className="text-[12px] text-text-secondary bg-canvas border border-outline-variant px-2.5 py-1 rounded-full">
          {semester}
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
          isRequired
            ? 'text-ink bg-primary-fixed border-primary-fixed'
            : 'text-on-surface-variant bg-secondary-fixed border-secondary-fixed'
        }`}>
          {isRequired ? 'Obbligatorio' : 'A Scelta'}
        </span>
      </div>

      <div className="flex items-center gap-3 pt-3 border-t border-outline-variant/20">
        <div className="flex flex-col min-w-0">
          {professorRealIds && professorRealIds.length > 0 ? (
            (professorNames || []).map((pname, i) => (
              <a
                key={i}
                href={`/professors/${professorRealIds[i]}`}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(`/professors/${professorRealIds[i]}`); }}
                className="text-[11px] text-text-muted font-medium uppercase tracking-wide leading-tight hover:text-ink hover:underline"
              >
                {pname.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '')}
              </a>
            ))
          ) : (
            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wide leading-tight">
              {displayProf}
            </span>
          )}
        </div>
        {rating !== undefined && (
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[16px] text-pop-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span className="font-semibold text-[14px] text-ink">{rating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="text-[12px] text-text-muted">({reviewCount})</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
