import Icon from '../components/Icon';
import { catalogLink, useCatalog } from '../contexts/CatalogContext';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useReducedMotionPreference } from '../lib/reducedMotion';

const WELCOME_KEY = 'florence:welcome-shown';
const SLIDES = [
  { icon: 'school', title: 'Florence Student', description: 'La tua guida ai corsi della Scuola di Studi Umanistici e della Formazione di UNIFI.' },
  { icon: 'menu_book', title: 'Esplora i corsi', description: 'Scegli il tuo anno di ingresso e consulta insegnamenti, crediti e programmi disponibili.' },
  { icon: 'groups', title: 'Conosci i docenti', description: 'Trova i docenti associati ai corsi nelle fonti ufficiali. Le informazioni non ancora pubblicate sono indicate.' },
  { icon: 'verified', title: 'Controlla le fonti', description: 'Apri le pagine ufficiali UNIFI dal catalogo. Le recensioni degli studenti e i materiali condivisi sono distinti dalle informazioni ufficiali.' },
  { icon: 'bookmark', title: 'Salva i tuoi corsi', description: 'Salva i preferiti su questo dispositivo anche senza account. Accedi per sincronizzarli, mantenendo la copia locale.' },
];

export default function Welcome({ onDismiss }: { onDismiss?: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const reducedMotion = useReducedMotionPreference();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const dismissed = useRef(false);
  const navigate = useNavigate();
  const { planYear } = useCatalog();
  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  function goTo(index: number) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, index));
    setDirection(next > currentSlide ? 1 : -1);
    setCurrentSlide(next);
  }

  function dismiss(destination: string) {
    if (dismissed.current) return;
    dismissed.current = true;
    try { localStorage.setItem(WELCOME_KEY, 'true'); } catch { /* Browsing still works when storage is unavailable. */ }
    onDismiss?.();
    navigate(catalogLink(destination, planYear));
  }

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}><main className="bg-canvas min-h-dvh p-4 md:p-6 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-end mb-4"><button onClick={() => dismiss('/')} className="text-text text-sm font-semibold hover:text-ink transition-colors duration-150 min-h-11 px-4">Salta introduzione</button></div>
        <section aria-label="Introduzione a Florence Student" aria-roledescription="carosello" onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === 'ArrowRight') { event.preventDefault(); goTo(currentSlide + 1); }
          if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(currentSlide - 1); }
        }} className="bg-card-base rounded-xl p-6 sm:p-8 shadow-card overflow-hidden">
          <div onTouchStart={(event) => { const touch = event.changedTouches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            const dx = start.x - touch.clientX;
            const dy = start.y - touch.clientY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25) goTo(currentSlide + (dx > 0 ? 1 : -1));
          }} onTouchCancel={() => { touchStart.current = null; }} className="overflow-hidden">
            <div className="flex items-center justify-center min-h-80">
              <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div key={currentSlide} custom={direction} initial={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : direction * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: reducedMotion ? 1 : 0, x: reducedMotion ? 0 : -direction * 16 }} transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }} className="w-full flex flex-col items-center text-center">
                  <div className="size-20 rounded-full bg-ink flex items-center justify-center mb-6" aria-hidden="true"><Icon name={slide.icon} size={32} filled className="text-canvas" /></div>
                  <h1 className="font-h1-editorial text-3xl text-ink mb-4 leading-tight text-balance">{slide.title}</h1>
                  <p className="text-sm text-text leading-relaxed max-w-xs text-pretty">{slide.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <p role="status" className="text-center text-sm tabular-nums text-text mt-2">{currentSlide + 1} di {SLIDES.length} · {slide.title}</p>
          <div className="flex justify-center gap-1 mb-5 mt-2" aria-label="Pagine dell’introduzione">
            {SLIDES.map((item, index) => <button key={item.title} onClick={() => goTo(index)} aria-current={index === currentSlide ? 'step' : undefined} aria-label={`Pagina ${index + 1}: ${item.title}`} className="size-11 flex items-center justify-center rounded-full"><span className={index === currentSlide ? 'size-3 rounded-full bg-ink' : 'size-2.5 rounded-full bg-outline'} /></button>)}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => goTo(currentSlide - 1)} disabled={currentSlide === 0} className="size-12 rounded-full bg-canvas border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors duration-150 shrink-0 disabled:opacity-30" aria-label="Pagina precedente"><Icon name="arrow_back" size={20} className="text-ink" /></button>
            <button onClick={() => isLastSlide ? dismiss('/') : goTo(currentSlide + 1)} className="flex-1 min-h-12 bg-ink text-canvas rounded-full py-3 px-6 font-semibold text-sm hover:bg-ink-soft transition-colors duration-150 flex items-center justify-center gap-2"><span className="min-w-0">{isLastSlide ? 'Inizia ora' : 'Avanti'}</span><Icon name="arrow_forward" size={20} /></button>
          </div>
          <div className="text-center mt-4 min-h-11">{isLastSlide && <button onClick={() => dismiss('/login')} className="min-h-11 text-sm font-semibold text-text underline underline-offset-4">Accedi / Registrati</button>}</div>
        </section>
        <p className="text-center text-xs text-text mt-5">Un progetto della comunità studentesca UNIFI</p>
      </div>
    </main></MotionConfig>
  );
}
