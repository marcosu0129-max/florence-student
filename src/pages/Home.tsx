import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SearchBar, { SearchSuggestion } from '../components/SearchBar';
import { fetchCourses, programs } from '../lib/dataService';

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeQuery, setHomeQuery] = useState('');

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const homeSuggestions = useMemo((): SearchSuggestion[] => {
    if (!homeQuery.trim()) return [];
    const q = homeQuery.toLowerCase().trim();

    const matchedPrograms: SearchSuggestion[] = programs
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .map((p) => ({
        type: 'program' as const,
        label: p.code,
        sublabel: p.name,
      }));

    const matchedCourses: SearchSuggestion[] = courses
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const profMatch = c.professorName?.toLowerCase().includes(q) ?? false;
        const codeMatch = c.programCode.toLowerCase().includes(q);
        return nameMatch || profMatch || codeMatch;
      })
      .slice(0, 6)
      .map((c) => ({
        type: 'course' as const,
        label: c.name,
        sublabel: `${c.programCode} · ${c.professorName?.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '') || '—'}`,
        programCode: c.programCode,
        courseId: c.id,
      }));

    return [...matchedPrograms, ...matchedCourses];
  }, [homeQuery, courses]);

  const handleHomeSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'course' && suggestion.courseId) {
      navigate(`/courses/${suggestion.courseId}`);
    } else if (suggestion.type === 'program') {
      navigate(`/courses?program=${encodeURIComponent(suggestion.label)}`);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col">

        {/* Hero — centered, generous space */}
        <section className="flex flex-col items-center text-center py-16 md:py-24 gap-3">
          <h1 className="text-4xl md:text-6xl font-semibold text-ink tracking-[0.18em] leading-none uppercase">
            Trova il tuo corso
          </h1>
          <p className="text-sm text-text-muted tracking-widest uppercase">
            {loading ? '...' : `${courses.length} insegnamenti UNIFI`}
          </p>
          <div className="w-full max-w-xl mt-4">
            <SearchBar
              placeholder="Cerca corso..."
              value={homeQuery}
              onChange={setHomeQuery}
              suggestions={homeSuggestions}
              onSelectSuggestion={handleHomeSelectSuggestion}
              onSubmit={(query) => navigate(`/courses?q=${encodeURIComponent(query)}`)}
            />
            <button
              onClick={() => navigate('/courses')}
              className="mt-3 text-[13px] text-text-muted hover:text-ink hover:underline transition-colors cursor-pointer"
            >
              Vedi tutti i corsi →
            </button>
          </div>
        </section>

        {/* Corsi di Laurea — simple list, no cards */}
        <section className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">
            Corsi di Laurea
          </h2>
          {programs.map((program) => {
            const programCourses = courses.filter((c) => c.programCode === program.code);
            return (
              <Link
                key={program.code}
                to={`/programs/${program.code}`}
                className="group flex items-center justify-between py-4 px-1 border-b border-surface-container hover:pl-2 hover:border-l-2 hover:border-l-ink hover:bg-surface-container-low transition-all duration-150"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-bold text-text-muted bg-surface-container px-2 py-1 rounded shrink-0 uppercase tracking-wider">
                    {program.code}
                  </span>
                  <span className="text-base font-medium text-ink truncate group-hover:text-ink">
                    {program.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-text-muted hidden sm:block">
                    {programCourses.length} corsi
                  </span>
                  <span className="material-symbols-outlined text-lg text-text-muted group-hover:text-ink transition-colors">
                    chevron_right
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

      </div>
    </Layout>
  );
}
