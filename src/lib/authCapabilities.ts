/** Public Auth settings only; never reads a user session or changes provider settings. */
export function createAuthCapabilitiesReader(url: string, publicKey: string, fetcher: typeof fetch = fetch) {
  return async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetcher(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: { apikey: publicKey }, credentials: 'omit', signal: controller.signal,
      });
      if (!response.ok) throw new Error('Provider settings unavailable');
      const settings = await response.json();
      if (typeof settings?.external?.google !== 'boolean') throw new Error('Invalid provider settings');
      return { google: settings.external.google as boolean };
    } finally { clearTimeout(timer); }
  };
}
