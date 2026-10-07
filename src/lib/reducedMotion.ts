import { useSyncExternalStore } from 'react';

export function createReducedMotionStore(media: MediaQueryList | null) {
  return {
    getSnapshot: () => media?.matches ?? true,
    subscribe: (notify: () => void) => {
      if (!media) return () => {};
      media.addEventListener('change', notify);
      return () => media.removeEventListener('change', notify);
    },
  };
}

let browserStore: ReturnType<typeof createReducedMotionStore> | undefined;
const serverSnapshot = () => true;

export function useReducedMotionPreference() {
  // Read lazily so importing a page during server rendering needs no browser.
  browserStore ??= createReducedMotionStore(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null,
  );
  return useSyncExternalStore(browserStore.subscribe, browserStore.getSnapshot, serverSnapshot);
}
