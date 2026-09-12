-- L3: OAuth Refresh Token Rotation + Revocation
-- Refresh token'lar icin ayri model. Access token'lardan bagimsiz olarak
-- rotation chain (replacedById) ve revocation semantigi izlenebilir.
-- tokenHash unique: SHA256(plain) — plain sadece response'da doner.
-- replacedById unique: bir token en fazla bir kez rotate edilebilir (chain integrity).

-- CreateTable
CREATE TABLE "oauth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "oauth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_tokens_tokenHash_key" ON "oauth_refresh_tokens"("tokenHash");
CREATE UNIQUE INDEX "oauth_refresh_tokens_replacedById_key" ON "oauth_refresh_tokens"("replacedById");
CREATE INDEX "oauth_refresh_tokens_userId_idx" ON "oauth_refresh_tokens"("userId");
CREATE INDEX "oauth_refresh_tokens_clientId_idx" ON "oauth_refresh_tokens"("clientId");
CREATE INDEX "oauth_refresh_tokens_userId_clientId_idx" ON "oauth_refresh_tokens"("userId", "clientId");
CREATE INDEX "oauth_refresh_tokens_revokedAt_idx" ON "oauth_refresh_tokens"("revokedAt");

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "OAuthClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
