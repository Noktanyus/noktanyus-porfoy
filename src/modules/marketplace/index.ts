/**
 * Marketplace module barrel — template marketplace + ürün review/Q&A.
 * Multi-vendor kaldırıldı; dijital ürünler yalnızca admin yayınlar.
 */

export { reviewService } from './reviewService';
export type { CreateReviewInput, ReviewWithReviewer } from './reviewService';

export { questionService } from './questionService';

export {
  listTemplates,
  getTemplateBySlug,
  generateLicenseKey,
} from './templateService';
export type { PaginatedTemplates, PageMeta } from './templateService';
