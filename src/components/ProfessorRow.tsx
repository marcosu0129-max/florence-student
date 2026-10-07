import { createReturnState } from '../lib/navigation';
import { Link, useLocation } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import Icon from './Icon';
import type { CatalogStatsStatus } from '../lib/catalogTypes';
interface ProfessorRowProps { id: string; name: string; initials?: string; department: string; programs?: string[]; rating?: number; reviewCount?: number; statsStatus?: CatalogStatsStatus; courseCount?: number; highlighted?: boolean; }
export default function ProfessorRow({ id, name, department, programs = [], rating, reviewCount, statsStatus, courseCount }: ProfessorRowProps) {
  const { planYear } = useCatalog();
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  return <Link state={returnState} to={catalogLink(`/professors/${id}`, planYear)} className="course-card flex items-center gap-4 p-4 border border-border-card shadow-card bg-card-base rounded-xl">
    <div className="flex-1 min-w-0"><h2 className="font-semibold text-base text-ink leading-snug text-pretty">{name}</h2>{department && <p className="text-sm text-text mt-1 leading-relaxed">{department}</p>}
      {programs.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{programs.map(program => <span key={program} className="text-xs text-text bg-canvas border border-outline-variant px-2 py-0.5 rounded-full">{program}</span>)}</div>}
      <p className="mt-2 text-xs text-text">{courseCount !== undefined ? `${courseCount} attività associate · ` : ''}<span title={statsStatus === 'ready' ? 'Recensioni pubblicate per tutti i piani di studi' : undefined}>{statsStatus === 'ready' && typeof rating === 'number' && Number.isFinite(rating) && reviewCount > 0 ? `${rating.toFixed(1)} / 5 · ${reviewCount} ${reviewCount === 1 ? 'recensione' : 'recensioni'}` : statsStatus === 'ready' && reviewCount === 0 ? 'Nessuna recensione pubblicata' : 'Statistiche non disponibili'}</span></p>
    </div><Icon name="chevron_right" size={20} className="text-text" />
  </Link>;
}
