import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import { CatalogError, CatalogLoading } from './CatalogNotice';
import { schoolCatalog } from '../lib/schoolCatalog';
import { schoolCommunityIdentity } from '../lib/schoolCommunityIdentity';
import { useSchoolData } from '../lib/useSchoolData';
import { useCatalog } from '../contexts/CatalogContext';

/** Resolve old/bookmarked community URLs without guessing a programme or teaching version. */
export default function SchoolSubjectResolver({ subject, fallback }: { subject: 'course' | 'professor'; fallback: ReactNode }) {
  const { id = '' } = useParams();
  const location = useLocation();
  const { planYear } = useCatalog();
  const cohortYear = Number(planYear.slice(0, 4));
  const result = useSchoolData(`locate:${subject}:${id}:${cohortYear}`, async retry => {
    const index = await schoolCatalog.index({ retry });
    if (retry) await schoolCatalog.search({ retry: true });
    const item = subject === 'course' ? await schoolCommunityIdentity.resolveCourse(id) : await schoolCommunityIdentity.resolveProfessor(id);
    if (!item) return null;
    const inYear = item.contexts.filter(context => context.cohort_year === cohortYear);
    const available = inYear.length ? inYear : item.contexts;
    const choices = new Map<string, { href: string; label: string; year: string }>();
    for (const context of available) {
      const profileYear = 'profile_year' in context ? context.profile_year : undefined;
      const key = `${context.program_key}:${context.cohort_year}:${profileYear || ''}`;
      if (choices.has(key)) continue;
      const params = new URLSearchParams(location.search);
      params.set('program', context.program_key);
      params.set('year', `${context.cohort_year}/${context.cohort_year + 1}`);
      ['offering','curriculum','academicYear','profileYear'].forEach(name => params.delete(name));
      if (profileYear !== undefined) params.set('profileYear', String(profileYear));
      const suffix = location.pathname.endsWith('/review') ? '/review' : '';
      const href = `/${subject === 'course' ? 'courses' : 'professors'}/${item.id}${suffix}?${params}`;
      const program = index.programs.find(program => program.program_key === context.program_key);
      choices.set(key, { href, label: program?.name || context.program_key, year: `Piano ${context.cohort_year}/${context.cohort_year + 1}${profileYear ? ` · scheda ${profileYear}/${profileYear + 1}` : ''}` });
    }
    return { item, choices: [...choices.values()], otherYear: !inYear.length };
  });
  if (result.loading) return <Layout catalogNotice={false}><CatalogLoading /></Layout>;
  if (result.error) return <Layout catalogNotice={false}><CatalogError message={result.error} retry={result.reload} /></Layout>;
  if (!result.data) return fallback;
  if (result.data.choices.length === 1 && !result.data.otherYear) return <Navigate to={result.data.choices[0].href} replace state={location.state} />;
  return <Layout catalogNotice={false}><div className="space-y-6"><header><h1 className="text-3xl sm:text-4xl font-semibold text-pretty">{result.data.item.name}</h1><p className="mt-3 text-sm text-text">{result.data.otherYear ? 'Nessuna scheda nel piano selezionato. Scegli uno dei piani disponibili.' : 'Scegli il corso di laurea e la versione da consultare.'}</p></header><div className="grid gap-4 md:grid-cols-2">{result.data.choices.map(choice => <Link key={choice.href} to={choice.href} state={location.state} className="rounded-xl border border-outline-variant bg-card-base p-5"><span className="block font-semibold text-pretty">{choice.label}</span><span className="block mt-2 text-sm text-text">{choice.year}</span></Link>)}</div></div></Layout>;
}
