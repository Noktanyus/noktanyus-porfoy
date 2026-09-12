-- Remove multi-vendor marketplace: VendorProfile + vendorId FKs
-- Admin-only store: DigitalProduct published by admin only

-- Drop review -> vendor FK and column
ALTER TABLE "ProductReview" DROP CONSTRAINT IF EXISTS "ProductReview_vendorId_fkey";
DROP INDEX IF EXISTS "ProductReview_vendorId_idx";
ALTER TABLE "ProductReview" DROP COLUMN IF EXISTS "vendorId";

-- Drop product -> vendor FK and column
ALTER TABLE "DigitalProduct" DROP CONSTRAINT IF EXISTS "DigitalProduct_vendorId_fkey";
DROP INDEX IF EXISTS "DigitalProduct_vendorId_idx";
ALTER TABLE "DigitalProduct" DROP COLUMN IF EXISTS "vendorId";

-- Drop VendorProfile table
DROP TABLE IF EXISTS "VendorProfile";
