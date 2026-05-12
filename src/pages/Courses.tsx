import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchCourses, programs, getProfessorInitials, getSavedCourseIds, toggleSaveCourse } from '../lib/dataService';
import Layout from '../components/Layout';
import CourseCard from '../components/CourseCard';
import SearchBar, { SearchSuggestion } from '../components/SearchBar';

export default function Courses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeProgram, setActiveProgram] = useState<string | null>(searchParams.get('program') || null);

  useEffect(() => {
    fetchCourses().then((data) => {
      setCourses(data);
      setSavedIds(getSavedCourseIds());
      setLoading(false);
    });
  }, []);

  const handleToggleSave = (courseId: string) => {
    toggleSaveCourse(courseId);
    setSavedIds(getSavedCourseIds());
  };

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.professorName?.toLowerCase().includes(q) ||
          c.programCode?.toLowerCase().includes(q)
      );
    }
    if (activeProgram) {
      result = result.filter((c) => c.programCode === activeProgram);
    }
    return result;
  }, [courses, searchQuery, activeProgram]);

  const programOptions = useMemo(() => {
    const usedCodes = [...new Set(courses.map((c) => c.programCode).filter(Boolean))];
    return [
      { label: 'Tutti', code: null },
      ...programs
        .filter((p) => usedCodes.includes(p.code))
        .map((p) => ({ label: p.code, code: p.code })),
    ];
  }, [courses, programs]);

  const suggestions = useMemo((): SearchSuggestion[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

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
      }));

    return [...matchedPrograms, ...matchedCourses];
  }, [searchQuery, courses, programs]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'program') {
      setActiveProgram(suggestion.programCode ?? suggestion.label);
    } else if (suggestion.programCode) {
      setActiveProgram(suggestion.programCode);
    }
  };

  const rotateOptions: Array<'left' | 'right' | 'none'> = ['right', 'none', 'left', 'right', 'none', 'left'];

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-4">

        {/* Header */}
        <div>
          <h1 className="font-h1-editorial text-h1-editorial md:font-hero-display md:text-hero-display text-ink leading-none mb-4 -ml-1">
            Insegnamenti
          </h1>
          <p className="font-body-main text-body-main text-text-muted">
            {loading ? '...' : `${courses.length} insegnamenti UNIFI`}
          </p>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          placeholder="Cerca corso..."
          onSubmit={(query) => {
            if (query.trim()) {
              navigate(`/courses?q=${encodeURIComponent(query.trim())}`, { replace: true });
            } else {
              navigate('/courses', { replace: true });
            }
          }}
        />

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {programOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setActiveProgram(opt.code)}
              className={`px-4 py-1.5 text-[12px] font-medium transition-all rounded-full ${
                activeProgram === opt.code
                  ? 'bg-ink text-canvas shadow-card'
                  : 'bg-card-base text-text-muted border border-border-card hover:bg-outline-variant hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-surface-container"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
              <p className="text-[13px] text-text-muted">Caricamento...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-text-muted">Nessun risultato</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveProgram(null); }}
                className="text-ink text-[13px] font-semibold mt-2 hover:underline"
              >
                Resetta filtri
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  name={course.name}
                  professor={course.professorName?.replace(/^(Prof\.?|Prof\.ssa)\s*/i, '') || '—'}
                  professorInitials={getProfessorInitials(course.professorName || '')}
                  cfu={course.credits}
                  year={`${course.yearLevel}°`}
                  semester={course.semester}
                  isRequired={course.isRequired}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                  programCode={course.programCode}
                  description={course.description}
                  professorNames={course.professorNames?.map((n: string) => n.replace(/^(Prof\.?|Prof\.ssa)\s*/i, ''))}
                  professorRealIds={course.professorRealIds}
                  rotate={rotateOptions[index % rotateOptions.length]}
                  isSaved={savedIds.includes(course.id)}
                  onToggleSave={() => handleToggleSave(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
