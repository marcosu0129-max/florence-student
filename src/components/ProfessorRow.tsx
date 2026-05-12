import { Link } from 'react-router-dom';

interface ProfessorRowProps {
  id: string;
  name: string;
  initials?: string;
  department: string;
  programs?: string[];
  rating: number;
  courseCount?: number;
  highlighted?: boolean;
}

export default function ProfessorRow({
  id,
  name,
  department,
  programs = [],
  rating,
  courseCount,
  highlighted = false,
}: ProfessorRowProps) {
  return (
    <Link
      to={`/professors/${id}`}
      id={`professor-${id}`}
      className={`flex items-center gap-4 p-4 border shadow-card hover:shadow-float transition-all duration-300 group rounded-xl
        ${highlighted
          ? 'bg-[#FFE25C]/30 border-[#c9b200]'
          : 'bg-card-base border-border-card'
        }
      `}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[16px] text-ink group-hover:text-ink transition-colors leading-tight">
          {name}
        </h3>
        <p className="text-[12px] text-text-muted mt-0.5 leading-tight">
          {department}
        </p>
        {programs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {programs.slice(0, 3).map((p) => (
              <span
                key={p}
                className="text-[10px] font-semibold text-on-surface-variant bg-secondary-fixed border border-outline-variant px-2 py-0.5 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-canvas border border-outline-variant px-3 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-[16px] text-pop-yellow" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
          <span className="font-semibold text-[14px] text-ink">{rating.toFixed(1)}</span>
        </div>
        {courseCount !== undefined && (
          <span className="text-[12px] text-text-muted hidden md:block">
            {courseCount} corsi
          </span>
        )}
        <span className="material-symbols-outlined text-xl text-text-muted group-hover:text-ink transition-colors">
          chevron_right
        </span>
      </div>
    </Link>
  );
}
