-- Sprint 1: Production Hardening — Index Additions
-- Production audit kapsaminda missing/eksik olan kritik indeksler ekleniyor.
-- Amac: N+1 query, slow scan ve cron cleanup performansi.
--
-- Etkilenen tablolar:
--   template_purchases    — workspace dashboard + pending purchase cleanup
--   oauth_access_tokens   — cleanup cron + active-token lookups
--   api_keys              — revoked key cleanup
--   api_key_usages        — status code bazli monitoring raporlari
--   chat_messages         — kullanici bazli mesaj arama

-- template_purchases
CREATE INDEX IF NOT EXISTS "template_purchases_workspaceId_idx" ON "template_purchases"("workspaceId");
CREATE INDEX IF NOT EXISTS "template_purchases_status_createdAt_idx" ON "template_purchases"("status", "createdAt");

-- oauth_access_tokens
CREATE INDEX IF NOT EXISTS "OAuthAccessToken_revokedAt_idx" ON "OAuthAccessToken"("revokedAt");
CREATE INDEX IF NOT EXISTS "OAuthAccessToken_expiresAt_idx" ON "OAuthAccessToken"("expiresAt");

-- api_keys
CREATE INDEX IF NOT EXISTS "api_keys_revokedAt_idx" ON "api_keys"("revokedAt");

-- api_key_usages
CREATE INDEX IF NOT EXISTS "api_key_usages_statusCode_idx" ON "api_key_usages"("statusCode");

-- chat_messages
CREATE INDEX IF NOT EXISTS "chat_messages_senderId_createdAt_idx" ON "chat_messages"("senderId", "createdAt");
