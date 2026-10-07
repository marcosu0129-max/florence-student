import { useLayoutEffect, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
const positions = new Map<string, number>();
export function usePageScroll(main: RefObject<HTMLElement | null>) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const route = location.pathname + location.search;
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    const restore = navigationType === 'POP' || location.state?.restoreScroll;
    const target = restore ? positions.get(route) || 0 : navigationType === 'REPLACE' ? window.scrollY : 0;
    window.scrollTo({ top: target, behavior: 'instant' });
    const observer = new ResizeObserver(() => {
      window.scrollTo({ top: target, behavior: 'instant' });
      if (window.scrollY >= target) observer.disconnect();
    });
    if (target > window.scrollY && main.current) observer.observe(main.current);
    const stop = () => observer.disconnect();
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('pointerdown', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });
    // Async lists may need more than two seconds to restore their content height.
    // Observe until the target exists, the user intervenes, or this route leaves.
    return () => {
      positions.set(route, window.scrollY);
      if (positions.size > 100) positions.delete(positions.keys().next().value!);
      observer.disconnect();
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop);
      window.removeEventListener('pointerdown', stop);
    };
  }, [location.key]);
}
