-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT NOT NULL DEFAULT 'stripe';
