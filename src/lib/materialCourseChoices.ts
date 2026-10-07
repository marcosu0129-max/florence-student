export interface MaterialCourseChoice {
  id: string;
  name: string;
  officialCode?: string | null;
}

const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('it');

/** Keep the current URL selection available while bounding the full-school menu. */
export function materialCourseChoices(courses: MaterialCourseChoice[], query: string, selectedId: string, selectedFallback = 'Corso del collegamento') {
  const text = normalize(query);
  const matches = courses.filter(course => normalize(`${course.name} ${course.officialCode || ''}`).includes(text));
  const selected = selectedId ? courses.find(course => course.id === selectedId) || { id: selectedId, name: selectedFallback } : undefined;
  const shortlist = matches.slice(0, 50);
  if (selected && !shortlist.some(course => course.id === selected.id)) {
    if (shortlist.length === 50) shortlist.pop();
    shortlist.unshift(selected);
  }
  const matchingIds = new Set(matches.map(course => course.id));
  return {
    options: [{ value: '', label: 'Tutti i corsi' }, ...shortlist.map(course => ({
      value: course.id,
      label: course.officialCode ? `${course.officialCode} · ${course.name}` : course.name,
    }))],
    matchCount: matches.length,
    shownMatchCount: shortlist.filter(course => matchingIds.has(course.id)).length,
    selectionOutsideMatches: Boolean(selected && !matchingIds.has(selected.id)),
  };
}
