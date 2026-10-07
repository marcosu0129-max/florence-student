export const firstLevelPaths = ['/', '/courses', '/professors', '/profile'];
export function activeNavPath(pathname: string): string {
  if (/^\/(courses|programs)(\/|$)/.test(pathname)) return '/courses';
  if (/^\/professors(\/|$)/.test(pathname)) return '/professors';
  if (/^\/(profile|my-courses|my-reviews|all-reviews|notifications|materials)(\/|$)/.test(pathname)) return '/profile';
  return '/';
}
export function safeReturnPath(value: unknown): string | undefined {
  return typeof value === 'string' && /^\/(?![\/\\])/.test(value) && !value.includes('\\') && !/[\u0000-\u0020\u007f]/.test(value) ? value : undefined;
}

const MAX_RETURN_DEPTH = 8;
const MAX_RETURN_PATH_LENGTH = 4096;
export interface ReturnNavigationState {
  from?: string;
  /** Flat ancestor paths only. Never copy arbitrary or recursive location state. */
  returnTrail?: string[];
  restoreScroll?: boolean;
}
function boundedReturnPath(value: unknown): string | undefined {
  const path = safeReturnPath(value);
  return path && path.length <= MAX_RETURN_PATH_LENGTH && !/[\u0000-\u0020\u007f]/.test(path) ? path : undefined;
}
function returnAncestors(state: unknown): string[] {
  if (!state || typeof state !== 'object') return [];
  const input = state as Record<string, unknown>;
  const from = boundedReturnPath(input.from);
  if (!from) return [];
  const trail = Array.isArray(input.returnTrail) ? input.returnTrail.slice(0, MAX_RETURN_DEPTH - 1) : [];
  const result = [from];
  // A malformed segment ends the chain; do not silently jump to a farther ancestor.
  for (const value of trail) {
    const path = boundedReturnPath(value);
    if (!path) break;
    result.push(path);
  }
  return result;
}
/** Push a same-origin page onto a small flat return chain when following a detail link. */
export function createReturnState(currentPath: string, state?: unknown): ReturnNavigationState {
  const from = boundedReturnPath(currentPath);
  if (!from) return {};
  const ancestors = returnAncestors(state).slice(0, MAX_RETURN_DEPTH - 1);
  return { from, ...(ancestors.length ? { returnTrail: ancestors } : {}) };
}
/** Pop the current return target and give the destination its own remaining ancestors. */
export function returnNavigationState(state: unknown): ReturnNavigationState {
  const [, from, ...returnTrail] = returnAncestors(state);
  return { restoreScroll: true, ...(from ? { from, ...(returnTrail.length ? { returnTrail } : {}) } : {}) };
}


/** Only restore ancestors belonging to this exact authentication destination. */
export function authReturnNavigationState(destination: string, state: unknown): ReturnNavigationState | undefined {
  return boundedReturnPath(destination) && returnAncestors(state)[0] === destination
    ? returnNavigationState(state) : undefined;
}
