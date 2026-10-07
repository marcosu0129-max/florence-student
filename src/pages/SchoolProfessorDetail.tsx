import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SchoolCommunityReviews from '../components/SchoolCommunityReviews';
import SchoolOfferingCard from '../components/SchoolOfferingCard';
import { CatalogError, CatalogLoading, PlanYearSelect } from '../components/CatalogNotice';
import { useCatalog } from '../contexts/CatalogContext';
import { schoolCatalog } from '../lib/schoolCatalog';
import { useSchoolData } from '../lib/useSchoolData';
import { useSchoolCourseStats } from '../lib/useSchoolCourseStats';
import { useSavedCourses } from '../lib/useSavedCourses';
import { schoolLink, officialLink } from '../lib/schoolLinks';

export default function SchoolProfessorDetail() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const { planYear } = useCatalog();
  const context = { programKey: params.get('program') || 'B385', cohortYear: Number(planYear.slice(0,4)) };
  const requestedYear = params.has('profileYear') ? Number(params.get('profileYear')) : null;
  const state = useSchoolData(`professor:${id}:${JSON.stringify(context)}:${requestedYear}`, async retry => {
    const cohort = await schoolCatalog.cohort(context, { retry });
    const canonicalId = cohort.aliases.professors[id] || id;
    const profiles = cohort.professor_profiles.filter(profile => profile.id === canonicalId || profile.official_id === canonicalId);
    const profile = requestedYear !== null ? profiles.find(item => item.profile_year === requestedYear) : profiles.length === 1 ? profiles[0] : null;
    const offerings = profile ? cohort.offerings.filter(offering => offering.assignments.some(assignment => assignment.professor_id === profile.id && assignment.profile_year === profile.profile_year)) : [];
    return { cohort, profile, profiles, offerings };
  });
  const saved = useSavedCourses();
  const courseStats = useSchoolCourseStats(state.data?.offerings);
  const { cohort, profile, profiles, offerings } = state.data || {};
  const official = officialLink(profile?.official_url);
  return <Layout catalogNotice={false} backTo={schoolLink('/professors', context)}><div className="space-y-7">
    <header><p className="text-sm text-text mb-3">{profile?.department || cohort?.program.name || 'Docente UNIFI'}</p><h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-pretty">{profile?.name || profiles?.[0]?.name || 'Scheda docente'}</h1></header>
    <PlanYearSelect />
    {state.loading ? <CatalogLoading /> : state.error ? <CatalogError message={state.error} retry={state.reload} /> : !profile ? <section className="space-y-4"><h2 className="text-xl font-semibold">{profiles?.length ? 'Scegli l’anno della scheda' : 'Docente non presente nel piano'}</h2>{requestedYear !== null && <p className="text-sm text-text">La scheda richiesta per {requestedYear}/{requestedYear + 1} non è disponibile nelle fonti verificate.</p>}<div className="flex flex-wrap gap-3">{profiles?.map(item => <Link state={location.state} key={item.profile_year} to={schoolLink(`/professors/${item.id}`, context, { profileYear: item.profile_year })} className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-5 text-sm">{item.profile_year}/{item.profile_year + 1}</Link>)}</div><Link to={schoolLink('/professors', context)} className="inline-flex min-h-11 items-center underline text-sm">Torna ai docenti</Link></section> : <>
      <aside className="rounded-xl border border-outline-variant bg-card-base p-5 text-sm text-text"><p>Scheda ufficiale per {profile.profile_year}/{profile.profile_year + 1} · piano di ingresso {planYear}.</p>{official && <a href={official} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center mt-2 underline">Profilo ufficiale UNIFI<span className="sr-only"> (nuova scheda)</span></a>}</aside>
      {profiles && profiles.length > 1 && <div className="flex flex-wrap gap-3" aria-label="Altri anni della scheda docente">{profiles.map(item => <Link state={location.state} aria-current={item.profile_year === profile.profile_year ? 'page' : undefined} key={item.profile_year} to={schoolLink(`/professors/${item.id}`, context, { profileYear: item.profile_year })} className={`inline-flex min-h-11 items-center rounded-full border border-outline-variant px-4 text-sm ${item.profile_year === profile.profile_year ? 'bg-ink text-canvas' : ''}`}>{item.profile_year}/{item.profile_year + 1}</Link>)}</div>}
      {profile.bio && <p className="max-w-3xl whitespace-pre-line text-sm sm:text-base leading-relaxed text-text">{profile.bio}</p>}
      {profile.email && <dl className="text-sm"><dt className="font-semibold">Email istituzionale</dt><dd className="mt-2 break-all"><a href={`mailto:${profile.email}`} className="underline">{profile.email}</a></dd></dl>}
      <section className="space-y-4"><h2 className="text-2xl font-semibold">Insegnamenti nel piano selezionato</h2><p className="text-sm text-text">Associazioni verificate per l’anno {profile.profile_year}/{profile.profile_year + 1}. I moduli e le sezioni sono indicati nelle relative schede dei corsi.</p>{offerings?.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{offerings.map(offering => <SchoolOfferingCard key={offering.id} offering={offering} stats={courseStats.get(offering.course_id)} cohort={cohort!} saved={saved} />)}</div> : <p className="text-sm text-text">Nessuna assegnazione diretta a un insegnamento nel piano selezionato. Consulta le schede dei corsi per eventuali moduli o sezioni.</p>}</section>
      <SchoolCommunityReviews subject="professor" subjectId={profile.id} schoolContext={context} profileYear={profile.profile_year} />
    </>}
  </div></Layout>;
}
