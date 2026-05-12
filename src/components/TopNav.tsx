import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const isCourses = location.pathname === '/courses';
  const isDocenti = location.pathname === '/professors';
  const isProfile = location.pathname === '/profile';
  const showBack = !isHome;

  return (
    <header className="w-full">
      <div className="flex items-center justify-between h-16 px-margin-desktop">
        <div className="flex items-center gap-6">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-ink transition-all duration-200 group cursor-pointer pl-0 -ml-[40px]"
              aria-label="Torna indietro"
            >
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform duration-200">
                arrow_back
              </span>
              <span className="tracking-wider uppercase group-hover:underline underline-offset-2">Indietro</span>
            </button>
          )}
        </div>

        <nav className="flex items-center gap-8 -mr-margin-desktop pr-margin-desktop">
          <Link
            to="/"
            className={`
              font-top-nav transition-opacity
              ${isHome ? 'opacity-100' : 'opacity-50 hover:opacity-80'}
            `}
          >
            Corsi
          </Link>
          <Link
            to="/professors"
            className={`
              font-top-nav transition-opacity
              ${isDocenti ? 'opacity-100' : 'opacity-50 hover:opacity-80'}
            `}
          >
            Docenti
          </Link>
          <Link
            to="/profile"
            className={`
              font-top-nav transition-opacity
              ${isProfile ? 'opacity-100' : 'opacity-50 hover:opacity-80'}
            `}
          >
            Profilo
          </Link>
        </nav>
      </div>
    </header>
  );
}
