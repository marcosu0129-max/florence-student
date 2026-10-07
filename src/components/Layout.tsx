import { ReactNode, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import TopNav from './TopNav';
import BottomNav from './BottomNav';
import CatalogNotice from './CatalogNotice';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';

import { firstLevelPaths, safeReturnPath, returnNavigationState } from '../lib/navigation';
import { usePageScroll } from '../lib/usePageScroll';

interface LayoutProps {
  children?: ReactNode;
  showBack?: boolean;
  backTo?: string;
  catalogNotice?: boolean;
}

export default function Layout({ children, showBack = false, backTo, catalogNotice = true }: LayoutProps) {
  const location = useLocation();
  const { planYear, programKey } = useCatalog();
  const parentPath = location.pathname.startsWith('/courses/') ? '/courses' : location.pathname.startsWith('/professors/') ? '/professors' : location.pathname.startsWith('/programs/') ? '/' : '/profile';
  const main = useRef<HTMLElement>(null);
  usePageScroll(main);
  useEffect(() => { if (!location.state?.restoreScroll) main.current?.focus({ preventScroll: true }); }, [location.pathname]);
  const returnTo = safeReturnPath(location.state?.from) || catalogLink(backTo || parentPath, planYear, programKey);
  const backState = returnNavigationState(location.state);
  const noNav = location.pathname === '/login' || location.pathname === '/auth/callback';
  const isFirstLevel = firstLevelPaths.includes(location.pathname);

  return (
    <div className="min-h-dvh bg-canvas flex flex-col relative overflow-x-clip">
      {/* Desktop TopNav (lg+) */}
      {!noNav && (
        <div className="hidden lg:block">
          <TopNav backTo={returnTo} backState={backState} showBack={showBack || !isFirstLevel} />
        </div>
      )}

      {/* Mobile Header (<lg) */}
      {!noNav && (
        <header className="lg:hidden sticky top-0 z-50 bg-canvas">
          <div className="flex items-center justify-between px-margin-mobile h-[52px]">
            {/* Left — back button or spacer */}
            <div className="flex items-center">
              {showBack ? (
                <Link
                  to={returnTo} state={backState}
                  className="size-11 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <Icon name="arrow_back" size={20} className="text-on-surface" />
                </Link>
              ) : !isFirstLevel ? (
                <Link
                  to={returnTo} state={backState}
                  className="size-11 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Torna indietro"
                >
                  <Icon name="arrow_back" size={20} className="text-on-surface" />
                </Link>
              ) : (
                <div className="w-8" />
              )}
            </div>

            {/* Right — spacer to balance layout */}
            <div className="w-8" />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main ref={main} tabIndex={-1} id="main-content" className="flex-grow w-full max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pb-[calc(3rem+64px+env(safe-area-inset-bottom,0px))] lg:pb-12 pt-6 lg:pt-16">
        {catalogNotice && (/^\/(courses|professors|programs)(\/|$)/.test(location.pathname) || location.pathname === '/') && <CatalogNotice />}
        <div className="page-content">{children}</div>
      </main>

      {/* BottomNav — mobile only */}
      {!noNav && <BottomNav />}
    </div>
  );
}
