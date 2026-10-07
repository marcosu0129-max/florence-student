type Provenance = {
  officialCode?: string;
  sourceUrl?: string | null;
  sourceUrls?: string[];
  verifiedAt?: string | null;
  lastVerifiedAt?: string | null;
  academicYear?: string;
  cohortYear?: number | string | null;
  offeringStatus?: string;
  missingFields?: string[];
};

export default function CatalogSource({ record, yearLabel = 'Anno di attività' }: { record: Provenance; yearLabel?: string }) {
  const urls = [...new Set([record.sourceUrl, ...(record.sourceUrls || [])].filter((value): value is string => Boolean(value)))];
  const verified = record.lastVerifiedAt || record.verifiedAt;
  return <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-canvas-soft p-4 text-sm text-text">
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {record.officialCode && <span>Codice ufficiale <b className="text-ink">{record.officialCode}</b></span>}
      {record.academicYear && <span>{yearLabel} {record.academicYear}</span>}
      {record.cohortYear && <span>Coorte {record.cohortYear}</span>}
    </div>
    {urls.length > 0 && <div className="flex flex-wrap gap-x-4 gap-y-2">{urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4">{index === 0 ? 'Fonte ufficiale UNIFI' : `Fonte ufficiale ${index + 1}`}<span className="sr-only"> (si apre in una nuova scheda)</span></a>)}</div>}
    {verified && <p>Data di riferimento delle fonti: <time dateTime={verified}>{new Date(verified).toLocaleDateString('it-IT')}</time>.</p>}
    {record.offeringStatus === 'scheduled' && <p>Attività prevista dal piano per un anno futuro. Il calendario, gli incarichi e il programma saranno mostrati quando pubblicati dall’Ateneo.</p>}
    {record.missingFields && record.missingFields.length > 0 && <p>Alcune informazioni non sono pubblicate dalla fonte. I campi mancanti restano indicati, senza integrazioni presunte.</p>}
  </div>;
}
