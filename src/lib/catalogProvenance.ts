/** Rebuilding a catalogue must never make saved HTTP evidence appear newer. */
export function earliestSourceDate(
  sources: ReadonlyArray<{ url: string; fetched_at: string }>,
  sourceUrls: readonly string[],
): string | null {
  if (!sourceUrls.length) return null;
  const byUrl = new Map(sources.map(source => [source.url, source.fetched_at]));
  const dates = sourceUrls.map(url => byUrl.get(url));
  if (dates.some(date => !date || !Number.isFinite(Date.parse(date)))) return null;
  return (dates as string[]).reduce((oldest, date) => Date.parse(date) < Date.parse(oldest) ? date : oldest);
}
