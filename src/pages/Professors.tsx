import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProfessors, getProfessorInitials } from '../lib/dataService';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import type { SearchSuggestion } from '../components/SearchBar';
import ProfessorRow from '../components/ProfessorRow';

export default function Professors() {
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    fetchProfessors().then((data) => {
      setProfessors(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return professors
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((p) => ({
        type: 'professor' as const,
        label: p.name,
        sublabel: p.department || undefined,
        professorId: p.id,
      }));
  }, [professors, searchQuery]);

  const filteredProfessors = useMemo(() => {
    if (!searchQuery.trim()) return professors;
    const q = searchQuery.toLowerCase();
    return professors.filter(
      (p) => p.name.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q)
    );
  }, [professors, searchQuery]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.professorId) {
      const el = document.getElementById(`professor-${suggestion.professorId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlightedId(suggestion.professorId);
      setSearchQuery('');
      setTimeout(() => setHighlightedId(null), 2500);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-4">
        {/* Header */}
        <div>
          <h1 className="font-h1-editorial text-h1-editorial md:font-hero-display md:text-hero-display text-ink leading-none mb-4 -ml-1">
            Docenti
          </h1>
          <p className="font-body-main text-body-main text-text-muted">
            {loading ? '...' : `${professors.length} docenti UNIFI`}
          </p>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          placeholder="Cerca docente..."
        />

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
          ) : filteredProfessors.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-text-muted">Nessun risultato</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-ink text-[13px] font-semibold mt-2 hover:underline"
                >
                  Resetta ricerca
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredProfessors.map((professor) => (
                <ProfessorRow
                  key={professor.id}
                  id={professor.id}
                  name={professor.name}
                  initials={getProfessorInitials(professor.name)}
                  department={professor.department}
                  programs={professor.programs}
                  rating={professor.rating}
                  courseCount={professor.courseCount}
                  highlighted={professor.id === highlightedId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-canvas border border-border-card shadow-float flex items-center justify-center text-text-muted hover:text-ink hover:border-outline-variant transition-all duration-200 z-50"
            aria-label="Torna in alto"
          >
            <span className="material-symbols-outlined text-2xl">keyboard_arrow_up</span>
          </motion.button>
        )}
      </AnimatePresence>
    </Layout>
  );
}
