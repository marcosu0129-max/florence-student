import { createReturnState } from '../lib/navigation';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import type { SchoolCohort, SchoolRequirement } from '../lib/schoolCatalogTypes';
import { offeringLink, officialLink } from '../lib/schoolLinks';

function ruleTitle(rule: SchoolRequirement) {
  if (rule.description === 'Activities listed under the study year before a choice heading') return 'Attività previste dal piano';
  return rule.description || 'Attività del piano';
}

export function SchoolCoverageNotice({ cohort }: { cohort: SchoolCohort }) {
  const conflicting = cohort.coverage.plan_status === 'source_conflict';
  return <aside aria-label="Completezza delle informazioni" className="rounded-xl border border-outline-variant bg-card-base p-4 sm:p-5 text-sm text-text leading-relaxed">
    <p className="font-semibold text-ink">{conflicting ? 'Alcune indicazioni ufficiali non coincidono' : 'Piano di studi e insegnamenti ufficiali'}</p>
    <p className="mt-2">{conflicting
      ? 'Le fonti presentano differenze nei CFU o nelle regole di scelta. Conserviamo le indicazioni originali: consulta il piano ufficiale e la segreteria prima di compilare il tuo piano.'
      : 'Il piano comprende anche attività future. Docenti, periodi e programmi vengono mostrati solo per l’anno di insegnamento verificato.'}</p>
    <p className="mt-2">Le alternative non vanno sommate tutte. Combinazioni linguistiche, propedeuticità e condizioni particolari restano soggette alle regole del piano ufficiale.</p>
    {cohort.counts.plan_only > 0 && <p className="mt-2 tabular-nums">{cohort.counts.plan_only} attività hanno per ora soltanto le informazioni del piano di studi.</p>}
  </aside>;
}

/** PDF groups remain independent from teaching curricula and individual offerings. */
export default function SchoolPlan({ cohort, curriculumCode = '' }: { cohort: SchoolCohort; curriculumCode?: string }) {
  const location = useLocation();
  const returnState = createReturnState(location.pathname + location.search, location.state);
  const offeringMap = useMemo(() => new Map(cohort.offerings.map(item => [item.id, item])), [cohort]);
  const activities = useMemo(() => new Map(cohort.plan_activities.map(item => [item.id, item])), [cohort]);
  const groups = cohort.requirements.filter(rule => !curriculumCode || rule.curriculum_code === curriculumCode);
  return <section aria-label="Regole e attività del piano" className="flex flex-col gap-4">
    <h2 className="text-xl sm:text-2xl font-semibold text-ink text-balance">Il piano, gruppo per gruppo</h2>
    {!groups.length && <p className="text-text">Nessun gruppo del piano corrisponde a questo percorso.</p>}
    {groups.map((rule, index) => {
      const rows = rule.activity_row_ids.map(id => activities.get(id)).filter(item => item !== undefined);
      const conditions = rule.conditions.map(condition => typeof condition === 'string' ? condition
        : condition && typeof condition === 'object' && 'text' in condition && typeof condition.text === 'string' ? condition.text : '').filter(Boolean);
      const source = officialLink(rule.source_url);
      return <details key={rule.id} className="group/plan rounded-xl border border-outline-variant bg-card-base" open={index === 0 || undefined}>
        <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <span className="flex-1 min-w-0">
            <span className="block text-xs text-text mb-1">{rule.year_level ? `${rule.year_level}° anno · ` : ''}{rule.degree_class_track || rule.curriculum_code}</span>
            <span className="block text-base font-semibold text-ink text-pretty">{ruleTitle(rule)}</span>
            <span className="block text-sm text-text mt-2 tabular-nums">{rule.credits_to_choose === null ? 'Quota CFU da verificare nelle fonti' : `${rule.credits_to_choose} CFU previsti per il gruppo`}{rule.courses_to_choose != null ? ` · ${rule.courses_to_choose} attività da scegliere` : ''}</span>
          </span>
          <Icon name="expand_more" size={20} className="shrink-0 group-open/plan:rotate-180 motion-safe:transition-transform motion-safe:duration-150" />
        </summary>
        <div className="border-t border-outline-variant px-4 pb-4 sm:px-5 sm:pb-5">
          {conditions.length > 0 && <div className="pt-4 text-sm text-text leading-relaxed space-y-2">{conditions.map((text, i) => <p key={i}>{text}</p>)}</div>}
          <ul className="divide-y divide-outline-variant">
            {rows.map(row => {
              const contexts = row.offering_ids.map(id => offeringMap.get(id)).filter(item => item !== undefined);
              return <li key={row.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0"><p className="text-sm font-semibold text-ink text-pretty">{row.name}</p>
                    <p className="mt-1 text-xs text-text">{row.official_code ? `${row.official_code} · ` : ''}{row.academic_year_start}/{row.academic_year_start + 1}{row.module_of ? ' · Modulo dell’insegnamento' : ''}</p></div>
                  <span className="shrink-0 text-sm tabular-nums text-text">{row.credits === null ? 'CFU n.d.' : `${row.credits} CFU`}</span>
                </div>
                {contexts.length > 0 ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{contexts.map(offering => <Link key={offering.id} state={returnState} to={offeringLink(offering)} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink underline underline-offset-4">
                  {contexts.length === 1 ? 'Dettagli dell’attività' : `${offering.curriculum_name || offering.curriculum_code} · ${offering.academic_year}`}
                  <Icon name="arrow_forward" size={16} />
                </Link>)}</div> : <p className="mt-2 text-xs text-text">Attività descritta nel piano ufficiale; nessuna scheda di insegnamento associata.</p>}
              </li>;
            })}
          </ul>
          {!rows.length && <p className="pt-4 text-sm text-text">Consulta il piano ufficiale per le attività ammesse e le condizioni di scelta.</p>}
          {source && <a href={rule.source_page ? `${source.split('#')[0]}#page=${rule.source_page}` : source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-ink underline underline-offset-4">Piano ufficiale{rule.source_page ? ` · pagina ${rule.source_page}` : ''}<Icon name="open_in_new" size={16} /><span className="sr-only"> (nuova scheda)</span></a>}
        </div>
      </details>;
    })}
  </section>;
}
