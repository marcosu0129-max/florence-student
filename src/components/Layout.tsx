import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import TopNav from './TopNav';

const FIRST_LEVEL = ['/', '/courses', '/professors', '/profile'];

interface LayoutProps {
  children?: ReactNode;
  showBack?: boolean;
  backTo?: string;
}

export default function Layout({ children, showBack = false, backTo }: LayoutProps) {
  const location = useLocation();
  const noNav = location.pathname === '/login' || location.pathname === '/auth/callback';
  const isFirstLevel = FIRST_LEVEL.includes(location.pathname);

  return (
    <div className="min-h-screen bg-canvas flex flex-col relative overflow-x-hidden">
      {/* Desktop TopNav (lg+) */}
      {!noNav && (
        <TopNav />
      )}

      {/* Mobile Header (<lg) */}
      {!noNav && (
        <header className="lg:hidden sticky top-0 z-50 bg-canvas">
          <div className="flex items-center justify-between px-margin-mobile h-[56px]">
            {/* Left */}
            <div className="flex items-center">
              {showBack ? (
                <Link
                  to={backTo || '/profile'}
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <span className="material-symbols-outlined text-xl text-on-surface" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_back
                  </span>
                </Link>
              ) : !isFirstLevel ? (
                <button
                  onClick={() => window.history.back()}
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <span className="material-symbols-outlined text-xl text-on-surface" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_back
                  </span>
                </button>
              ) : (
                <div className="w-9" />
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pb-12 pt-6 lg:pt-16">
        {children}
      </main>
    </div>
  );
}
