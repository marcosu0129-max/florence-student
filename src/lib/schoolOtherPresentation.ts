import type { SchoolOtherProgramKind, SchoolOtherProgramSummary } from './schoolOtherTypes';

export const otherKindLabels: Record<SchoolOtherProgramKind | 'historical_degree', string> = {
  university_master: 'Master universitari', advanced_training: 'Perfezionamento e aggiornamento',
  phd: 'Dottorati di ricerca', specialisation_school: 'Scuole di specializzazione',
  teacher_qualification: 'Abilitazione all’insegnamento', special_needs_teacher_specialisation: 'Specializzazione per il sostegno',
  historical_degree: 'Corsi di laurea storici',
};
const statusLabels: Record<string, string> = {
  not_listed_in_requested_year_registry: 'Non presente nel registro dell’anno richiesto',
  related_title_listed_alias_unverified: 'Titolo simile nel registro, corrispondenza non confermata',
  not_established_for_this_title: 'Didattica non verificata per questa denominazione',
  see_linked_programme_edition: 'Consulta la scheda annuale del percorso collegato',
  future_academic_cycle_not_published: 'Ciclo futuro non ancora pubblicato', not_listed_in_year_registry: 'Non presente nel registro di questo anno',
  official_admissions_published: 'Bando ufficiale pubblicato', officially_active_cycle: 'Ciclo ufficialmente attivato',
  officially_listed_for_year: 'Presente nel registro annuale', teaching_confirms_active_year: 'Attività didattica documentata nell’anno',
  dated_public_teaching_calendar_collected: 'Calendario pubblico con date disponibile', public_dated_teaching_calendar_collected: 'Calendario pubblico con date disponibile',
  factsheet_not_published_on_registry: 'Scheda non pubblicata nel registro', not_established_for_this_year: 'Didattica non verificata per questo anno',
  not_published: 'Non ancora pubblicato nelle fonti consultate', official_plan_with_teachers_collected: 'Piano ufficiale con indicazioni sui docenti disponibile',
  official_study_plan_collected: 'Piano di studi ufficiale disponibile', ongoing_prior_edition_verified: 'Edizione precedente ancora in svolgimento',
  public_biennial_curriculum_collected: 'Piano biennale pubblico disponibile', public_programme_material_collected: 'Materiale ufficiale del percorso disponibile',
  year_plan_not_published_on_official_offering_page: 'Piano annuale non pubblicato nella pagina ufficiale',
  year_specific_public_study_plan_collected: 'Piano pubblico per questo anno disponibile',
  year_specific_teaching_calendar_not_published_in_checked_pages: 'Calendario annuale non pubblicato nelle pagine verificate',
  no_new_cohort_official_historical_status: 'Corso storico, senza nuovo ingresso documentato',
  continuing_student_teaching_not_established: 'Didattica per gli iscritti precedenti non verificata',
  matched_current_official_registry: 'Titolo collegato al registro ufficiale',
  not_listed_in_requested_year_registries: 'Non presente nei registri degli anni verificati',
  official_admissions_and_teaching_verified: 'Bando e didattica ufficiali verificati',
  official_current_training_plan_collected: 'Piano formativo ufficiale disponibile',
  official_teach_out: 'Ad esaurimento', officially_deactivated: 'Disattivato',
  related_title_requires_alias_confirmation: 'Titolo simile: corrispondenza da confermare',
};
export function otherStatus(value: string) { return statusLabels[value] || `Stato da consultare nella fonte (${value.replaceAll('_', ' ')})`; }
export function otherYear(value: string | null): number | null {
  if (value === null) return 2026;
  return value === '2025' || value === '2026' ? Number(value) : null;
}
export function otherLink(path: string, year: number | null) {
  return `${path}?edition=${year ?? 'invalid'}`;
}
export function filterOtherPrograms(programs: SchoolOtherProgramSummary[], query: string, kind: string, year: number | null) {
  const q = query.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('it');
  return programs.filter(program => (!kind || program.program_kind === kind)
    && program.editions.some(edition => edition.academic_year_start === year)
    && (!q || [program.name, program.department, otherKindLabels[program.program_kind]].join(' ').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('it').includes(q)));
}

const limitationLabels: Record<string,string> = {
  no_year_specific_public_calendar_found: 'Ammissione e curricula di ricerca verificati. Le pagine didattiche pubbliche consultate non riportano un calendario riferito a questo anno. I membri del collegio non vengono considerati docenti dei singoli corsi.',
  individual_courses_not_enumerated_in_public_factsheet: 'La scheda pubblica conserva contenuti e obiettivi del percorso, ma non contiene un elenco annuale separato di insegnamenti con i rispettivi docenti.',
  absence_not_closure: 'Questo titolo non compare nel registro dell’anno. L’assenza non dimostra la chiusura del percorso e non esclude attività per gli iscritti alle edizioni precedenti.',
  biennial_edition: 'Il sito ufficiale distingue le edizioni 2024/2026 e 2026/2028. La didattica svolta nel 2025/2026 appartiene all’edizione precedente, non a un nuovo ingresso nel 2025.',
  public_document_not_published: 'La scheda del registro ufficiale per questo anno non contiene un collegamento alla scheda informativa o al piano di studi. I documenti di altri anni non vengono usati al loro posto.',
  future_plan_not_published: 'Le ammissioni 2026/2027 sono pubblicate, ma nella pagina ufficiale dell’offerta didattica il piano più recente è quello del 2025/2026. Le docenze precedenti non sono attribuite al nuovo anno.',
  teachers_not_publicly_assigned_in_plan: 'Il piano di studi pubblico indica attività e crediti, ma non assegna docenti ai singoli corsi. Nelle pagine consultate non è disponibile un calendario pubblico con queste assegnazioni.',
  academic_cycle_not_published: 'La pagina ufficiale indica come attivo il ciclo 2025/2026, anche quando alcune lezioni si svolgono nel 2026/2027. Le date delle lezioni non identificano un nuovo ciclo di ammissione.',
};
export function otherLimitation(kind: string) { return limitationLabels[kind] || 'Le fonti presentano un limite di disponibilità o interpretazione. Consulta la nota di verifica originale.'; }
const conflictLabels: Record<string,string> = {
  'archive-master-2024-archivistico-total': 'Nel percorso Archivistico 2024/2026 le attività frontali elencate sommano 63 CFU, mentre la tabella ne indica 60. Sommando 14 CFU di seminari, 25 di tirocinio e 21 di prova finale si ottengono 123 CFU anziché i 120 dichiarati. Il percorso Biblioteconomico somma invece 120 CFU. I valori della fonte sono conservati senza correzioni.',
  'forpsi-calendar-41-year-heading': 'La copertina del calendario riporta «2025–2025 / 41° ciclo», mentre le lezioni datate vanno da novembre 2025 al 2026 e la pagina didattica ufficiale lo identifica come calendario 2025/2026. Le due indicazioni originali sono conservate e non costituiscono due cicli distinti.',
  'pedagogia-medica-period-disagreement': 'Il campo relativo alla durata indica giugno–ottobre 2026, mentre il programma datato inizia a ottobre 2026 e comprende incontri successivi. Le date discordanti sono conservate senza scegliere una correzione.',
};
export function otherConflict(id: string) { return conflictLabels[id] || 'Le informazioni delle fonti ufficiali non coincidono. Consulta la nota di verifica e il documento originale.'; }
export function otherPersonRole(role: string) { return ({ programme_coordinator: 'Coordinamento del percorso', programme_director: 'Direzione del percorso' } as Record<string,string>)[role] || 'Ruolo indicato nella fonte'; }

/** Split only explicit historical-degree metadata; ambiguous titles remain verbatim. */
export function otherDirectoryHeading(name: string, kind: string) {
  if (kind !== 'historical_degree') return { title: name, metadata: [] as string[] };
  let title = name;
  const metadata: string[] = [];
  // The code must be a complete suffix, optionally followed by the directory's "Classe" prose.
  const degree = /^(.*?)\s+((?:LM|L)[ -]\d+(?:\s+e\s+(?:LM|L)[ -]\d+)*)(?:\s*-\s*|\s+)?(Classe\b[\s\S]*)?$/.exec(title);
  if (degree && degree[1].trim()) {
    metadata.unshift(title.slice(degree[1].length).trim());
    title = degree[1];
  }
  // Other parentheses, including genuine title qualifiers, must not be stripped.
  const faculty = /^(.*?)\s+(\(interfacoltà(?:\s|:)[^()]*\))$/i.exec(title);
  if (faculty && faculty[1].trim()) {
    metadata.unshift(faculty[2]);
    title = faculty[1];
  }
  return { title, metadata };
}
