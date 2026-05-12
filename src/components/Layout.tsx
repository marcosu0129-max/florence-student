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
        <div className="hidden lg:block">
          <TopNav />
        </div>
      )}

      {/* Mobile Header (<lg) */}
      {!noNav && (
        <header className="lg:hidden sticky top-0 z-50 bg-canvas">
          <div className="flex items-center justify-between px-margin-mobile h-[52px]">
            {/* Left — back button only */}
            <div className="flex items-center">
              {showBack ? (
                <Link
                  to={backTo || '/profile'}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <span className="material-symbols-outlined text-base text-on-surface" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_back
                  </span>
                </Link>
              ) : !isFirstLevel ? (
                <button
                  onClick={() => window.history.back()}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <span className="material-symbols-outlined text-base text-on-surface" style={{ fontVariationSettings: "'FILL' 0" }}>
                    arrow_back
                  </span>
                </button>
              ) : (
                <div className="w-8" />
              )}
            </div>

            {/* Right — compact nav */}
            <nav className="flex items-center gap-3">
              <Link
                to="/"
                className="font-top-nav text-[10px] tracking-wider opacity-40 hover:opacity-70 transition-opacity"
              >
                CORSI
              </Link>
              <Link
                to="/professors"
                className="font-top-nav text-[10px] tracking-wider opacity-40 hover:opacity-70 transition-opacity"
              >
                DOCENTI
              </Link>
              <Link
                to="/profile"
                className="font-top-nav text-[10px] tracking-wider opacity-40 hover:opacity-70 transition-opacity"
              >
                PROFILO
              </Link>
            </nav>
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
