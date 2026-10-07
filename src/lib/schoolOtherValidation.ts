import type { SchoolOtherAsset, SchoolOtherDirectoryDetail, SchoolOtherDirectorySummary, SchoolOtherDocument, SchoolOtherIndex, SchoolOtherManifest, SchoolOtherProgramDetail, SchoolOtherProgramSummary, SchoolOtherProvenance, SchoolOtherScope } from './schoolOtherTypes';

export class SchoolOtherLoadError extends Error {
  constructor(message = 'Impossibile caricare questi programmi. Controlla la connessione e riprova.') { super(message); this.name = 'SchoolOtherLoadError'; }
}
const UUID = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}';
const kinds = ['university_master', 'advanced_training', 'phd', 'specialisation_school', 'teacher_qualification', 'special_needs_teacher_specialisation'];
const fail = () => { throw new SchoolOtherLoadError('I dati dei programmi sono incompleti o non corrispondono alla versione pubblicata. Riprova.'); };
const obj = (value: unknown): Record<string, any> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : fail();
const list = (value: unknown): any[] => Array.isArray(value) ? value : fail();
const str = (value: unknown): string => typeof value === 'string' && value.length > 0 ? value : fail();
const integer = (value: unknown): number => Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : fail();
const id = (value: unknown) => new RegExp(`^${UUID}$`).test(str(value)) ? str(value) : fail();
const unique = (values: unknown[]) => { if (new Set(values).size !== values.length) fail(); };
const hash = (value: unknown) => /^[a-f0-9]{64}$/.test(str(value)) ? str(value) : fail();
const year = (value: unknown) => integer(value) >= 1900 ? Number(value) : fail();
export function validateSchoolOtherUrl(url: string) {
  if (typeof url !== 'string' || /\s/.test(url)) fail();
  if (url === '/catalog/school-other/index.json' || url === '/catalog/school-other/manifest.json') return url;
  if (!new RegExp(`^/catalog/school-other/releases/[a-f0-9]{20}/(?:(?:scope|provenance|manifest|index)\\.json|(?:programs|directory|documents)/${UUID}\\.json)$`).test(url)) fail();
  return url;
}
function ref(value: unknown, release: string, relative?: string): SchoolOtherAsset {
  const valueObj = obj(value); const url = validateSchoolOtherUrl(str(valueObj.url)); hash(valueObj.sha256);
  if (integer(valueObj.bytes) === 0 || valueObj.bytes > 8 * 1024 * 1024 || !url.startsWith(`/catalog/school-other/releases/${release}/`) || (relative && !url.endsWith(`/${relative}`))) fail();
  return valueObj as SchoolOtherAsset;
}
function envelope(value: unknown, kind: string, index?: SchoolOtherIndex): Record<string, any> {
  const v = obj(value);
  if (v.schema_version !== 1 || v.kind !== kind || !/^[a-f0-9]{20}$/.test(str(v.release_id))) fail();
  hash(v.source_sha256);
  if (index && (v.release_id !== index.release_id || v.source_sha256 !== index.source_sha256)) fail();
  return v;
}
function yearCheck(v: any) { obj(v); year(v.academic_year_start); str(v.admissions_status); str(v.teaching_status); }
function conflict(v: any) { obj(v); str(v.id); str(v.programme_name); year(v.academic_year_start); str(v.status); str(v.description); str(v.source_url); id(v.source_id); hash(v.source_sha256); }
function activity(v: any) {
  obj(v); id(v.id); str(v.name); id(v.source_id); obj(v.evidence);
  if (v.reviewable !== false || !(v.credits === null || typeof v.credits === 'number' && Number.isFinite(v.credits) && v.credits > 0) || !(v.official_code === null || typeof v.official_code === 'string') || !(v.teachers_raw === null || typeof v.teachers_raw === 'string')) fail();
  if (v.modules !== undefined) list(v.modules).forEach(m => { str(m.name); id(m.source_id); if (!(m.credits === null || typeof m.credits === 'number' && m.credits > 0)) fail(); });
}
export function validateSchoolOtherIndex(value: unknown): SchoolOtherIndex {
  const v = envelope(value, 'school-other-index'); str(v.generated_at); list(v.requested_academic_years).forEach(str);
  const counts = obj(v.counts); ['programs','directory_entries','editions','activities','tracks','track_activities','calendar_cells','conflicts'].forEach(k => integer(counts[k]));
  const programs = list(v.programs), entries = list(v.directory_entries); unique(programs.map(p => id(p.id))); unique(entries.map(e => id(e.id)));
  programs.forEach(p => {
    str(p.name); if (!kinds.includes(p.program_kind)) fail(); list(p.directory_entry_indices).forEach(integer); list(p.conflict_ids).forEach(str);
    if (!(p.department === null || typeof p.department === 'string') || !(p.master_level === null || p.master_level === 1 || p.master_level === 2)) fail();
    unique(p.conflict_ids);
    const editions = list(p.editions); unique(editions.map(e => year(e.academic_year_start)));
    editions.forEach(e => { yearCheck(e); str(e.academic_year); if (!(e.running_edition === null || typeof e.running_edition === 'string')) fail(); ['activities','tracks','calendar_cells','limitations'].forEach(k => integer(e[k])); });
    ref(p.detail, v.release_id, `programs/${p.id}.json`);
  });
  entries.forEach(e => {
    str(e.name); str(e.resolution); integer(e.directory_entry_index); if (![...kinds,'historical_degree'].includes(e.program_kind)) fail();
    list(e.related_program_ids).forEach(p => { if (!programs.some(candidate => candidate.id === p)) fail(); });
    list(e.year_checks).forEach(yearCheck); unique(e.year_checks.map(y => y.academic_year_start)); ref(e.detail, v.release_id, `directory/${e.id}.json`);
  });
  if (counts.programs !== programs.length || counts.directory_entries !== entries.length || counts.editions !== programs.reduce((n,p)=>n+p.editions.length,0)) fail();
  for(const [countKey,editionKey] of [['activities','activities'],['tracks','tracks'],['calendar_cells','calendar_cells']]) if (counts[countKey] !== programs.reduce((n,p)=>n+p.editions.reduce((m,e)=>m+e[editionKey],0),0)) fail();
  ref(v.scope,v.release_id,'scope.json'); ref(v.provenance,v.release_id,'provenance.json');
  if (v.manifest_url !== `/catalog/school-other/releases/${v.release_id}/manifest.json`) fail();
  return v as SchoolOtherIndex;
}
export function validateSchoolOtherProgram(value: unknown, index: SchoolOtherIndex, expected: SchoolOtherProgramSummary): SchoolOtherProgramDetail {
  const v = envelope(value,'school-other-program',index), p=obj(v.program); const editions=list(p.editions);
  if (p.id !== expected.id || p.name !== expected.name || p.program_kind !== expected.program_kind || editions.length !== expected.editions.length) fail();
  unique(editions.map(e=>year(e.academic_year_start)));
  editions.forEach(e=>{
    yearCheck(e); const summary=expected.editions.find(y=>y.academic_year_start===e.academic_year_start); if(!summary || summary.academic_year!==e.academic_year || summary.admissions_status!==e.admissions_status || summary.teaching_status!==e.teaching_status || summary.running_edition!==(e.running_edition??null)) fail();
    const activities=list(e.activities), tracks=e.tracks===undefined?[]:list(e.tracks), cells=e.calendar_cells===undefined?[]:list(e.calendar_cells);
    if(activities.length!==summary.activities || tracks.length!==summary.tracks || cells.length!==summary.calendar_cells || list(e.limitations).length!==summary.limitations) fail();
    activities.forEach(activity); unique(activities.map(a=>a.id)); unique(tracks.map(t=>str(t.id)));
    tracks.forEach(t=>{ const activities=list(t.activities); activities.forEach(activity); unique(activities.map(a=>a.id)); if (!Number.isFinite(t.credit_total) || !Number.isFinite(t.expected_path_credits)) fail();
      if (activities.reduce((n,a)=>n+a.credits,0)!==t.credit_total || !['verified','source_conflict'].includes(t.credit_check_status)) fail();
      if(t.credit_check_status==='verified' && t.credit_total!==t.expected_path_credits) fail();
      if(t.credit_check_status==='source_conflict' && (t.can_assert_completion!==false || !expected.conflict_ids.includes(t.source_conflict_id))) fail();
    });
    list(e.documents).forEach(d=>{ obj(d); str(d.url); str(d.role); if(d.status!==200 || !(d.full_text===null || typeof d.full_text==='string')) fail(); id(d.source_id); hash(d.sha256); });
    list(e.source_evidence); list(e.people).forEach(person=>{ str(person.name_text); str(person.role); if(person.not_course_assignment!==true) fail(); });
    cells.forEach(c=>{ str(c.text); id(c.source_id); str(c.semantic_status); const position=obj(c.evidence); ['page','table','row','column'].forEach(k=>integer(position[k])); });
  });
  list(v.source_conflicts).forEach(conflict); unique(v.source_conflicts.map(c=>c.id));
  if (v.source_conflicts.length!==expected.conflict_ids.length || v.source_conflicts.some(c=>!expected.conflict_ids.includes(c.id))) fail();
  return v as SchoolOtherProgramDetail;
}
export function validateSchoolOtherDirectory(value: unknown, index: SchoolOtherIndex, expected: SchoolOtherDirectorySummary): SchoolOtherDirectoryDetail {
  const v=envelope(value,'school-other-directory-entry',index), e=obj(v.entry);
  if(e.id!==expected.id || e.name!==expected.name || e.program_kind!==expected.program_kind || e.resolution!==expected.resolution || e.directory_entry_index!==expected.directory_entry_index) fail();
  const years=list(e.year_checks); years.forEach(yearCheck); unique(years.map(y=>y.academic_year_start)); if(years.length!==expected.year_checks.length) fail();
  years.forEach(y=>{ const match=expected.year_checks.find(c=>c.academic_year_start===y.academic_year_start); if(!match || match.admissions_status!==y.admissions_status || match.teaching_status!==y.teaching_status) fail(); });
  const related=list(e.related_program_ids); if(related.length!==expected.related_program_ids.length || related.some(id=>!expected.related_program_ids.includes(id))) fail(); list(e.source_evidence);
  return v as SchoolOtherDirectoryDetail;
}
export function validateSchoolOtherScope(value: unknown,index: SchoolOtherIndex): SchoolOtherScope {
  const v=envelope(value,'school-other-scope',index), m=obj(v.metadata);
  if(m.kind!=='school-other-programs'||m.schema_version!==1) fail();obj(m.coverage);obj(m.scope_policy);list(m.source_failures);obj(m.registry_evidence);list(m.registry_evidence.cards);list(m.registry_evidence.registries);
  list(m.source_conflicts).forEach(conflict); if(m.source_conflicts.length!==index.counts.conflicts)fail(); return v as SchoolOtherScope;
}
export function validateSchoolOtherProvenance(value: unknown,index: SchoolOtherIndex): SchoolOtherProvenance {
  const v=envelope(value,'school-other-provenance',index); list(obj(v.source_manifest).sources).forEach(s=>{id(s.id);str(s.url);hash(s.sha256);}); obj(v.document_evidence_metadata);
  const documents=list(v.documents);unique(documents.map(d=>id(d.id)));documents.forEach(d=>{id(d.source_id);str(d.source_url);ref(d,index.release_id,`documents/${d.id}.json`);});return v as SchoolOtherProvenance;
}
export function validateSchoolOtherDocument(value: unknown,index: SchoolOtherIndex,expected: SchoolOtherProvenance['documents'][number]): SchoolOtherDocument {
  const v=envelope(value,'school-other-document',index), d=obj(v.document);
  if(d.id!==expected.id || d.source_id!==expected.source_id || d.source_url!==expected.source_url)fail();hash(d.source_sha256);
  list(d.pages).forEach(p=>{integer(p.page);if(typeof p.text!=='string')fail();list(p.tables).forEach(t=>list(t).forEach(r=>list(r).forEach(c=>{if(c!==null && typeof c!=='string')fail();})));});list(d.activities).forEach(activity);return v as SchoolOtherDocument;
}
export function validateSchoolOtherManifest(value: unknown,index: SchoolOtherIndex): SchoolOtherManifest {
  const v=envelope(value,'school-other-manifest',index);obj(v.counts);const inputs=obj(v.inputs);['source','source_manifest','document_evidence'].forEach(k=>{hash(obj(inputs[k]).sha256);integer(inputs[k].bytes);});if(inputs.source.sha256!==index.source_sha256)fail();
  Object.entries(index.counts).forEach(([key,count])=>{if(v.counts[key]!==count)fail();});integer(v.counts.document_evidence);integer(v.counts.source_snapshots);
  const files=list(v.files);unique(files.map(f=>str(f.url)));files.forEach(f=>{ref(f,index.release_id);str(f.kind);});
  for(const reference of [index.scope,index.provenance,...index.programs.map(p=>p.detail),...index.directory_entries.map(e=>e.detail)]) {
    const listed=files.find(f=>f.url===reference.url); if(!listed||listed.sha256!==reference.sha256||listed.bytes!==reference.bytes)fail();
  }
  return v as SchoolOtherManifest;
}
