import { createSchoolCatalogRepository } from './schoolCatalogRepository';
import { createSchoolCatalogJsonReader } from './schoolCatalogTransport';

/** Separate from the legacy LM-92 repository: importing this module fetches no data. */
export const schoolCatalog = createSchoolCatalogRepository({ read: createSchoolCatalogJsonReader() });
export { createSchoolCatalogRepository, createSchoolCatalogRequestScope, selectSchoolOfferings, SchoolCatalogSupersededError, SCHOOL_CATALOG_INDEX_URL } from './schoolCatalogRepository';
export { SchoolCatalogLoadError } from './schoolCatalogTransport';
export { SchoolCatalogValidationError } from './schoolCatalogValidation';
export type * from './schoolCatalogTypes';
