/**
 * Marketplace 2.0 — Module barrel export
 *
 * Vendor (satıcı) profili, ürün review/puan sistemi ve Q&A modülü.
 */

export { vendorService } from './vendorService';
export type { CreateVendorInput, UpdateVendorInput } from './vendorService';

export { reviewService } from './reviewService';
export type { CreateReviewInput, ReviewWithReviewer } from './reviewService';

export { questionService } from './questionService';