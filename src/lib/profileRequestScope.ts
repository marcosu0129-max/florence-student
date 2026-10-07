/** Distinguish a return to the same account from the original session/page request. */
export function createProfileRequestScope() {
  let scope = { owner: null as string | null, checking: true, version: 0 };
  let readVersion = 0;
  return {
    update(owner: string | null, checking: boolean) {
      if (scope.owner !== owner || scope.checking !== checking) {
        scope = { owner, checking, version: scope.version + 1 };
        readVersion += 1;
      }
      return scope.version;
    },
    capture() { return scope.version; },
    isCurrent(version: number) { return scope.version === version && !scope.checking; },
    beginRead() { return { scope: scope.version, read: ++readVersion }; },
    acceptsRead(ticket: { scope: number; read: number }) {
      return scope.version === ticket.scope && readVersion === ticket.read && !scope.checking;
    },
    invalidateReads() { readVersion += 1; },
  };
}
