import type { SchoolJsonReader } from './schoolCatalogTypes';
import { validateSchoolAssetUrl } from './schoolCatalogValidation';

export class SchoolCatalogLoadError extends Error {
  constructor(message = 'Impossibile caricare il catalogo. Controlla la connessione e riprova.') { super(message); this.name = 'SchoolCatalogLoadError'; }
}

/** The browser verifies the exact UTF-8 shard bytes before JSON enters the shared cache. */
export function createSchoolCatalogJsonReader({ fetch: fetcher = globalThis.fetch, maxBytes = 8 * 1024 * 1024 }:
  { fetch?: typeof globalThis.fetch; maxBytes?: number } = {}): SchoolJsonReader {
  return async (url, { signal, sha256, bytes }) => {
    validateSchoolAssetUrl(url);
    if (bytes !== undefined && bytes > maxBytes) throw new SchoolCatalogLoadError('Il file del catalogo supera il limite previsto. Riprova dopo l’aggiornamento.');
    const response = await fetcher(url, { signal, credentials: 'omit', cache: 'no-cache', redirect: 'error', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new SchoolCatalogLoadError();
    const contentType = response.headers.get('content-type');
    if (contentType && !/^application\/([\w.-]+\+)?json\b/i.test(contentType)) throw new SchoolCatalogLoadError('Il file del catalogo non è disponibile. Riprova.');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes || (bytes !== undefined && buffer.byteLength !== bytes)) throw new SchoolCatalogLoadError('Il file del catalogo è incompleto. Riprova a scaricarlo.');
    if (sha256) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
      const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
      if (actual !== sha256.toLowerCase()) throw new SchoolCatalogLoadError('La copia del catalogo non corrisponde alla versione pubblicata. Riprova.');
    }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); }
    catch { throw new SchoolCatalogLoadError('Il file del catalogo non è leggibile. Riprova.'); }
  };
}
