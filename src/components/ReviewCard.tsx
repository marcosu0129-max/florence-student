interface ReviewCardProps {
  id: string;
  author: string;
  authorInitial: string;
  date: string;
  ratingDifficulty: number;
  ratingTeaching: number;
  grade?: number;
  content: string;
  helpfulCount?: number;
  onHelpful?: () => void;
  courseName?: string;
  tip?: string;
  tipType?: 'success' | 'warning';
  subjectType?: 'course' | 'professor';
  chiarezzaScore?: number;
  disponibilitaScore?: number;
  equitaScore?: number;
  isDemo?: boolean;
  planYear?: string;
}

export default function ReviewCard({
  id, author, authorInitial, date, ratingDifficulty, ratingTeaching, grade, content, tip,
  courseName, subjectType = 'course', chiarezzaScore, disponibilitaScore, equitaScore, isDemo, planYear,
}: ReviewCardProps) {
  const scores: Array<[string, number | undefined]> = subjectType === 'professor'
    ? [['Chiarezza', chiarezzaScore ?? ratingTeaching], ['Disponibilità', disponibilitaScore], ['Equità', equitaScore ?? ratingDifficulty]]
    : [['Difficoltà', ratingDifficulty], ['Didattica', ratingTeaching], ['Equità dei voti', grade]];
  return <article className="min-w-0 rounded-xl border border-border-card bg-card-base p-4 shadow-card sm:p-card-padding">
    <div className="mb-4 flex items-start gap-3">
      <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-base font-semibold text-ink">{authorInitial || 'S'}</div>
      <div className="min-w-0 flex-1"><p className="break-words text-base font-semibold text-ink">{author || 'Studente'}</p><p className="mt-1 text-xs text-text">{date}</p></div>
      {(isDemo || id.startsWith('demo-')) && <span className="shrink-0 rounded-full border border-outline-variant px-2 py-1 text-xs text-text">Bozza privata</span>}
    </div>
    {courseName && <h2 className="mb-3 break-words text-base font-semibold leading-snug text-ink text-balance">{courseName}</h2>}
    {planYear && <p className="mb-3 text-xs text-text">Piano {planYear}</p>}
    <p className="mb-4 whitespace-pre-wrap break-words text-base leading-relaxed text-text text-pretty">{content}</p>
    {tip && <p className="mb-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-text text-pretty"><strong>Consiglio:</strong> {tip}</p>}
    <dl className="flex flex-wrap gap-2">{scores.filter(([, score]) => typeof score === 'number' && Number.isFinite(score) && score >= 1 && score <= 5).map(([label, score]) => <div key={label} className="flex gap-1 rounded-md border border-outline-variant bg-canvas px-2 py-1 text-xs text-text"><dt>{label}:</dt><dd className="font-semibold tabular-nums">{score}/5</dd></div>)}</dl>
  </article>;
}
