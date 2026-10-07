import { createProfileRequestScope } from './profileRequestScope';

type ReadTicket = { scope: number; read: number };
interface OperationTicket { version: number; read: ReadTicket | null; }

/** Account/view generations plus operation ownership: an old completion cannot
 * modify a returned-to account or release a newer operation's lock. */
export function createCommunityRequestScope() {
  const requests = createProfileRequestScope();
  let operation: OperationTicket | null = null;
  return {
    ...requests,
    update(owner: string | null, checking: boolean) {
      const before = requests.capture();
      const version = requests.update(owner, checking);
      if (version !== before) operation = null;
      return version;
    },
    beginRead() {
      if (operation?.read) operation = null;
      return requests.beginRead();
    },
    invalidateReads() {
      if (operation?.read) operation = null;
      requests.invalidateReads();
    },
    busy() { return operation !== null; },
    beginOperation(read = false): OperationTicket | null {
      if (operation || !requests.isCurrent(requests.capture())) return null;
      operation = { version: requests.capture(), read: read ? requests.beginRead() : null };
      return operation;
    },
    acceptsOperation(ticket: OperationTicket) {
      return operation === ticket && requests.isCurrent(ticket.version) && (!ticket.read || requests.acceptsRead(ticket.read));
    },
    finishOperation(ticket: OperationTicket) {
      if (operation !== ticket) return false;
      operation = null;
      return requests.isCurrent(ticket.version);
    },
    dispose() { operation = null; requests.invalidateReads(); },
  };
}
