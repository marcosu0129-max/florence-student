import type { SchoolContext, SchoolOffering, SchoolProgram } from './schoolCatalogTypes';

export const degreeLabels: Record<SchoolProgram['degree_level'], string> = {
  bachelor: 'Laurea triennale', master: 'Laurea magistrale', single_cycle: 'Laurea magistrale a ciclo unico',
};

export function schoolLink(path: string, context: SchoolContext, extra: Record<string, string | number | undefined> = {}) {
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('program', context.programKey);
  params.set('year', `${context.cohortYear}/${context.cohortYear + 1}`);
  if (context.curriculumCode) params.set('curriculum', context.curriculumCode);
  if (context.academicYearStart) params.set('academicYear', String(context.academicYearStart));
  for (const [key, value] of Object.entries(extra)) if (value !== undefined) params.set(key, String(value));
  return `${pathname}?${params}`;
}

export function offeringLink(offering: SchoolOffering) {
  return schoolLink(`/courses/${offering.course_id}`, {
    programKey: offering.program_key, cohortYear: offering.cohort_year,
    curriculumCode: offering.curriculum_code, academicYearStart: offering.academic_year_start,
  }, { offering: offering.id });
}

export function officialLink(value: string | null | undefined) {
  if (!value) return undefined;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
