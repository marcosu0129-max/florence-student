import { schoolCommunityIdentity } from './schoolCommunityIdentity';
import type { ReviewSubject } from './reviewsApi';

/** Keep local drafts keyed to their catalogue record; resolve the cloud FK only for cloud operations. */
export function createSchoolReviewSubject(identity = schoolCommunityIdentity) {
  return {
    async cloudId(subject: ReviewSubject, id: string) {
      const confirmed = subject === 'course' ? await identity.requireCourse(id) : await identity.requireProfessor(id);
      return confirmed.identity.communityId;
    },
    async matches(subject: ReviewSubject, left: string, right: string) {
      const resolved = subject === 'course'
        ? await identity.resolveCourses([left, right])
        : await Promise.all([identity.resolveProfessor(left), identity.resolveProfessor(right)]);
      return Boolean(resolved[0] && resolved[1] && resolved[0].id === resolved[1].id);
    },
  };
}
export const schoolReviewSubject = createSchoolReviewSubject();
