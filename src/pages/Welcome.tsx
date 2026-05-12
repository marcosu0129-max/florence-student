import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_KEY = 'florence:welcome-shown';

const SLIDES = [
  {
    icon: 'school',
    iconColor: '#E55B4C',
    iconBg: 'bg-coral',
    title: 'Florence Student',
    description: 'La tua guida per i corsi UNIFI. Valuta, condividi, scopri.',
  },
  {
    icon: 'star',
    iconColor: '#F0A93D',
    iconBg: 'bg-amber',
    title: 'Valuta i Corsi',
    description: 'Leggi e scrivi recensioni per aiutare te e i tuoi colleghi a scegliere i corsi migliori.',
  },
  {
    icon: 'groups',
    iconColor: '#8c4e36',
    iconBg: 'bg-primary',
    title: 'Trova i Migliori Docenti',
    description: 'Sfoglia il database completo dei professori UNIFI con valutazioni e consigli degli studenti.',
  },
  {
    icon: 'folder_open',
    iconColor: '#6BAFA3',
    iconBg: 'bg-mint',
    title: 'Condividi e Scarica Materiali',
    description: 'Accedi a appunti, esercizi e temi d\'esame condivisi dalla comunita studentesca.',
  },
  {
    icon: 'favorite',
    iconColor: '#B89BD9',
    iconBg: 'bg-purple',
    title: 'Salva i tuoi Corsi Preferiti',
    description: 'Tieni traccia dei corsi che ti interessano e delle tue esperienze di studio.',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipeSpeed = 500;

function dotsVariants() {
  return {
    initial: { scale: 1, opacity: 0.4 },
    animate: { scale: 1, opacity: 0.4 },
    active: { scale: 1.35, opacity: 1 },
  };
}

export default function Welcome({ onDismiss }: { onDismiss?: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const isFirstSlide = currentSlide === 0;

  const goTo = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const goNext = () => {
    if (isLastSlide) {
      markSeen();
      onDismiss?.();
      navigate('/');
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (!isFirstSlide) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  function markSeen() {
    try { localStorage.setItem(WELCOME_KEY, 'true'); } catch {}
    onDismiss?.();
  }

  function handleStart() {
    markSeen();
    navigate('/');
  }

  function handleDemo() {
    markSeen();
    navigate('/');
  }

  function handleLogin() {
    markSeen();
    onDismiss?.();
    navigate('/login');
  }

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="bg-coral min-h-screen p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        {/* Skip Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleStart}
            className="text-white/80 text-[14px] font-medium hover:text-white transition-colors h-card px-2 py-1"
          >
            Salta
          </button>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-surface-soft rounded-[28px] p-8 shadow-[0_8px_40px_rgba(42,37,32,0.15)] overflow-hidden"
        >
          {/* Swipe Area */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden"
          >
            {/* Animated Slide Content */}
            <div className="flex items-center justify-center min-h-[200px]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ x: { type: 'spring', stiffness: swipeSpeed, damping: 30 }, opacity: { duration: 0.2 } }}
                  className="w-full flex flex-col items-center text-center px-2"
                >
                  {/* Icon Circle */}
                  <div className={`w-20 h-20 rounded-full ${slide.iconBg} flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(0,0,0,0.15)]`}>
                    <span
                      className="material-symbols-outlined text-[48px] text-white"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {slide.icon}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="h-hero text-[28px] md:text-[32px] text-text-primary mb-3 leading-tight">
                    {slide.title}
                  </h1>

                  {/* Description */}
                  <p className="text-[14px] text-text-secondary leading-relaxed max-w-xs t-body">
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Page Indicators */}
          <div className="flex justify-center gap-2 mb-8 mt-2">
            {SLIDES.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goTo(index)}
                variants={dotsVariants()}
                initial="initial"
                animate={index === currentSlide ? 'active' : 'animate'}
                transition={{ duration: 0.2 }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-coral shadow-[0_0_8px_rgba(229,91,76,0.4)]'
                    : 'bg-surface-variant'
                }`}
                aria-label={`Vai alla slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {!isFirstSlide ? (
              <button
                onClick={goPrev}
                className="w-12 h-12 rounded-full bg-surface-cream border border-surface-variant flex items-center justify-center hover:bg-surface-variant transition-colors shrink-0"
                aria-label="Slide precedente"
              >
                <span className="material-symbols-outlined text-xl text-text-secondary" style={{ fontVariationSettings: "'FILL' 0" }}>
                  arrow_back
                </span>
              </button>
            ) : (
              <div className="w-12 h-12 shrink-0" />
            )}

            {/* Main CTA */}
            {isLastSlide ? (
              <button
                onClick={handleStart}
                className="flex-1 bg-coral text-white rounded-full py-4 px-6 font-bold text-[15px] h-card shadow-[0_4px_16px_rgba(229,91,76,0.3)] hover:bg-danger transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_circle
                </span>
                Inizia ora
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex-1 bg-coral text-white rounded-full py-4 px-6 font-bold text-[15px] h-card shadow-[0_4px_16px_rgba(229,91,76,0.3)] hover:bg-danger transition-colors flex items-center justify-center gap-2"
              >
                Avanti
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                  arrow_forward
                </span>
              </button>
            )}
          </div>

          {/* Accedi link on last slide */}
          {isLastSlide && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4"
            >
              <button
                onClick={handleLogin}
                className="text-[13px] h-card font-medium text-text-secondary hover:text-coral transition-colors"
              >
                Accedi / Registrati
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Demo mode link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[11px] text-white/60 t-label mt-4"
        >
          Un progetto della comunita studentesca UNIFI
        </motion.p>
      </div>
    </div>
  );
}
