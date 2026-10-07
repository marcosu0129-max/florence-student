import { Link, useLocation } from 'react-router-dom';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';

import { activeNavPath } from '../lib/navigation';
import Icon from './Icon';

const TABS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/courses', label: 'Corsi', icon: 'search' },
  { path: '/professors', label: 'Docenti', icon: 'school' },
  { path: '/profile', label: 'Profilo', icon: 'person' },
];

export default function BottomNav() {
  const location = useLocation();
  const { planYear, programKey } = useCatalog();

  const isActive = (path: string) => activeNavPath(location.pathname) === path;

  return (
    <nav aria-label="Navigazione principale" className="fixed bottom-0 left-0 right-0 z-50 bg-canvas border-t border-surface-container safe-area-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={catalogLink(tab.path, planYear, programKey)}
              aria-current={active ? 'page' : undefined}
              className={`
                flex min-w-0 flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-150
                ${active ? 'text-ink' : 'text-text'}
              `}
            >
              <Icon name={tab.icon} size={24} filled={active} />
              <span className="text-[11px] font-medium leading-[14px] whitespace-nowrap" style={{ fontFamily: 'var(--font-caption)' }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
