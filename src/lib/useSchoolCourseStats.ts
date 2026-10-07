import { useEffect, useState } from 'react';
import { attachCourseStats } from './schoolCommunityStats';
import { useSchoolData } from './useSchoolData';
import type { SchoolOffering } from './schoolCatalogTypes';

/** One batch per rendered catalogue, shared by all curriculum/year variants. */
export function useSchoolCourseStats(offerings: SchoolOffering[] | undefined) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('florence:reviews-change', refresh);
    return () => window.removeEventListener('florence:reviews-change', refresh);
  }, []);
  const unique = [...new Map((offerings || []).map(item => [item.course_id, { id: item.course_id, officialCode: item.official_code }])).values()];
  const state = useSchoolData(`course-stats:${revision}:${JSON.stringify(unique)}`, () => attachCourseStats(unique));
  return new Map((state.data || []).map(item => [item.id, item]));
}
