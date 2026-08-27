/**
 * Content Module — Barrel Export
 *
 * Public API: servis, repository ve şemalar tek noktadan export edilir.
 * API route'lar `@/modules/content` üzerinden import eder.
 */
export * as contentService from './service';
export * from './schemas';
export {
  blogRepository,
  projectRepository,
  popupRepository,
  aboutRepository,
  homeSettingsRepository,
  seoSettingsRepository,
  BlogRepository,
  ProjectRepository,
  PopupRepository,
  AboutRepository,
  HomeSettingsRepository,
  SeoSettingsRepository,
} from './repository';
export type { AboutWithRelations } from './repository';