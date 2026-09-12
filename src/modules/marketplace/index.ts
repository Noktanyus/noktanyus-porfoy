/**
 * Marketplace 2.0 + Template Marketplace — Module barrel export
 *
 * Sub-modules:
 *  - Vendor profile, reviews, Q&A (Marketplace 2.0 — DigitalProduct)
 *  - Template listings, licenses, installations (Phase 3 B.1 — TemplateListing)
 */

export { vendorService } from './vendorService';
export type { CreateVendorInput, UpdateVendorInput } from './vendorService';

export { reviewService } from './reviewService';
export type { CreateReviewInput, ReviewWithReviewer } from './reviewService';

export { questionService } from './questionService';

// Phase 3 B.1 — Template Marketplace service functions (B.2 UI consumers use these)
export {
  listTemplates,
  getTemplateBySlug,
  generateLicenseKey,
} from './templateService';
export type { PaginatedTemplates, PageMeta } from './templateService';