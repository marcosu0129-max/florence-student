import type { SchoolOtherReader } from './schoolOtherTypes';
import { SchoolOtherLoadError, validateSchoolOtherUrl } from './schoolOtherValidation';

/** Only app-owned JSON URLs are fetched; official source links are display metadata. */
export function createSchoolOtherJsonReader({ fetch: fetcher = globalThis.fetch, maxBytes = 8 * 1024 * 1024 }:
  { fetch?: typeof globalThis.fetch; maxBytes?: number } = {}): SchoolOtherReader {
  return async (url, { signal, sha256, bytes }) => {
    validateSchoolOtherUrl(url);
    if (bytes !== undefined && (bytes <= 0 || bytes > maxBytes)) throw new SchoolOtherLoadError('Il file supera il limite previsto. Riprova dopo l’aggiornamento.');
    const response = await fetcher(url, { signal, credentials: 'omit', cache: 'no-cache', redirect: 'error', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new SchoolOtherLoadError();
    const contentType = response.headers.get('content-type');
    if (contentType && !/^application\/([\w.-]+\+)?json\b/i.test(contentType)) throw new SchoolOtherLoadError('Il file non è disponibile. Riprova.');
    const declaredLength = response.headers.get('content-length');
    if (declaredLength && Number(declaredLength) > maxBytes) throw new SchoolOtherLoadError('Il file supera il limite previsto.');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes || (bytes !== undefined && buffer.byteLength !== bytes)) throw new SchoolOtherLoadError('Il file è incompleto. Riprova a scaricarlo.');
    if (sha256) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer);
      const actual = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
      if (actual !== sha256) throw new SchoolOtherLoadError('La copia non corrisponde alla versione pubblicata. Riprova.');
    }
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); }
    catch { throw new SchoolOtherLoadError('Il file non è leggibile. Riprova.'); }
  };
}
