-- Account-based admin: User.role ("user" | "admin")
-- Env ADMIN_EMAIL/ADMIN_PASSWORD remains a break-glass login.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
