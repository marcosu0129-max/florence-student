import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/courses', label: 'Corsi', icon: 'search' },
  { path: '/profile', label: 'Profilo', icon: 'person' },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-canvas border-t border-surface-container safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`
                flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors duration-200
                ${active ? 'text-ink' : 'text-text-muted'}
              `}
            >
              <span
                className="material-symbols-outlined text-2xl transition-transform duration-200"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] font-medium leading-none font-caption">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
