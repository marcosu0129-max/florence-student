import { createReturnState } from '../lib/navigation';
import { Link, useLocation } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import Icon from './Icon';
import type { CatalogStatsStatus } from '../lib/catalogTypes';

interface CourseCardProps {
  id: string; name: string; professor: string; professorInitials?: string;
  cfu: number | null; year: string; semester: string; isRequired: boolean | null;
  rating?: number; reviewCount?: number; programCode?: string;
  statsStatus?: CatalogStatsStatus;
  onClick?: () => void; compact?: boolean; description?: string; category?: string;
  professorNames?: string[]; professorRealIds?: string[];
  rotate?: 'left' | 'right' | 'none'; isSaved?: boolean; onToggleSave?: () => void; saveDisabled?: boolean; savePending?: boolean;
  academicYear?: string; officialCode?: string; activityType?: string; requirementLabel?: string;
  href?: string; professorHrefs?: Array<string | undefined>;
}

export default function CourseCard({ id, name, professor, cfu, year, semester, isRequired, rating, reviewCount, statsStatus, programCode, onClick, compact = false, isSaved = false, onToggleSave, saveDisabled = false, savePending = false, professorNames = [], professorRealIds = [], academicYear, officialCode, activityType, requirementLabel, href, professorHrefs = [] }: CourseCardProps) {
  const { planYear } = useCatalog();
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const teachers = professorNames.length ? professorNames : professor ? [professor] : [];
  const hasRating = statsStatus === 'ready' && typeof rating === 'number' && Number.isFinite(rating) && Boolean(reviewCount && reviewCount > 0);
  const finalActivity = ['thesis', 'final_exam', 'final'].includes(activityType || '');
  return <article className={`course-card group relative flex flex-col gap-3 bg-card-base border border-border-card shadow-card rounded-xl ${compact ? 'p-4 sm:p-5' : 'p-4 sm:p-card-padding'}`}>
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        {(programCode || officialCode) && <p className="text-xs text-text mb-2">{[programCode, officialCode].filter(Boolean).join(' · ')}</p>}
        <h2 className="text-[15px] sm:text-[17px] font-semibold leading-snug text-ink text-pretty">
          <Link aria-label={`Apri dettagli corso: ${name}`} state={returnState} to={href || catalogLink(`/courses/${id}`, planYear)} onClick={onClick ? event => { event.preventDefault(); onClick(); } : undefined} className="after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ink focus-visible:after:ring-offset-2">{name}</Link>
        </h2>
      </div>
      {onToggleSave && <button type="button" className="relative z-10 shrink-0 size-11 rounded-full bg-canvas border border-outline-variant flex items-center justify-center text-text disabled:opacity-50" disabled={saveDisabled || savePending} aria-busy={savePending} onClick={onToggleSave} aria-pressed={isSaved} aria-label={savePending ? 'Salvataggio corso…' : isSaved ? 'Rimuovi dai salvati' : 'Salva corso'}><Icon name="bookmark" size={20} filled={isSaved} /></button>}
    </div>
    <div className="flex flex-wrap gap-2 text-xs text-text">
      <span className="bg-canvas border border-outline-variant px-2.5 py-1 rounded-full tabular-nums">{cfu !== null && cfu >= 0 ? `${cfu} CFU` : 'CFU non pubblicati'}</span>
      {year && year !== '0°' && <span className="bg-canvas border border-outline-variant px-2.5 py-1 rounded-full">{year} anno</span>}
      {academicYear && <span className="bg-canvas border border-outline-variant px-2.5 py-1 rounded-full">{academicYear}</span>}
      {semester && <span className="bg-canvas border border-outline-variant px-2.5 py-1 rounded-full">{semester}</span>}
      <span className="bg-primary-fixed px-2.5 py-1 rounded-full text-ink">{finalActivity ? 'Prova finale' : isRequired === true ? 'Obbligatorio' : isRequired === false ? 'Gruppo a scelta' : 'Regola da verificare'}</span>
    </div>
    {requirementLabel && <p className="text-xs leading-relaxed text-text">{requirementLabel}</p>}
    <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/30">
      <div className="flex flex-col gap-1 text-sm text-text">{teachers.length ? teachers.map((teacher, index) => professorRealIds[index] ? <Link key={`${professorRealIds[index]}-${index}`} state={returnState} to={professorHrefs[index] || catalogLink(`/professors/${professorRealIds[index]}`, planYear)} className="relative z-10 self-start underline underline-offset-4 hover:text-ink">{teacher.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '')}</Link> : <span key={`${teacher}-${index}`}>{teacher}</span>) : <span>Docente non pubblicato</span>}</div>
      {hasRating ? <p className="text-sm text-ink tabular-nums" title="Recensioni pubblicate per tutti i piani di studi">{rating!.toFixed(1)} / 5 · {reviewCount} {reviewCount === 1 ? 'recensione' : 'recensioni'}</p> : <p className="text-xs text-text">{statsStatus === 'ready' && reviewCount === 0 ? 'Nessuna recensione pubblicata' : 'Statistiche non disponibili'}</p>}
    </div>
  </article>;
}
