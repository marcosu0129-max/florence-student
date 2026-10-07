import { createSchoolOtherRepository } from './schoolOtherRepository';
import { createSchoolOtherJsonReader } from './schoolOtherTransport';

/** No network request or source dataset import until an API method is called. */
export const schoolOtherCatalog = createSchoolOtherRepository({ read: createSchoolOtherJsonReader() });
export { createSchoolOtherRepository, createSchoolOtherRequestScope, SchoolOtherSupersededError, SCHOOL_OTHER_INDEX_URL } from './schoolOtherRepository';
export { SchoolOtherLoadError } from './schoolOtherValidation';
export type * from './schoolOtherTypes';
