/**
 * @file OAuth 2.0 + PKCE service tests — Phase D OAuth service.
 * @description Tests for client secret bcrypt roundtrip, PKCE S256 valid/invalid,
 *              authorization code single-use semantics, access token
 *              validation + revocation. Uses prisma mock; bcryptjs gerçek
 *              (production ile aynı cost olmasa da roundtrip kontrolü yeterli).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

// --- Mocks ---

vi.mock('@/lib/prisma', () => {
  const oAuthClient = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const oAuthAuthorizationCode = {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  };
  const oAuthAccessToken = {
    create: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  };
  const oAuthRefreshToken = {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const txMock = {
    oAuthAuthorizationCode: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    oAuthAccessToken: { create: vi.fn().mockResolvedValue({}) },
    oAuthRefreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'rt-new' }),
    },
  };
  const prismaMock = {
    oAuthClient,
    oAuthAuthorizationCode,
    oAuthAccessToken,
    oAuthRefreshToken,
    $transaction: vi.fn(async (cbOrArr: unknown) => {
      // Array form (revokeAllClientTokens, rotateClientSecret): her bir prismaPromise'i
      // kendi mockResolvedValue'si ile resolve edilip sonuclar toplanir.
      if (Array.isArray(cbOrArr)) {
        return Promise.all(cbOrArr as Promise<unknown>[]);
      }
      // Callback form: prisma.$transaction(async (tx) => ...)
      return (cbOrArr as (tx: typeof txMock) => Promise<unknown>)(txMock);
    }),
  };
  return { prisma: prismaMock, __prismaMock: prismaMock, __txMock: txMock };
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import {
  generateClientId,
  generateClientSecret,
  hashClientSecret,
  verifyClientSecret,
  verifyPkce,
  createClient,
  findActiveClient,
  validateRedirectUri,
  validateScopes,
  createAuthorizationCode,
  exchangeAuthorizationCode,
  validateAccessToken,
  revokeAccessToken,
  revokeAllClientTokens,
} from '../service';

const mockPrisma = prisma as unknown as {
  oAuthClient: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  oAuthAuthorizationCode: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  oAuthAccessToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  oAuthRefreshToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// Bcrypt client secret roundtrip
// =====================================================================

describe('bcrypt client secret roundtrip', () => {
  it('generateClientId returns unique hex strings of expected length', () => {
    const a = generateClientId();
    const b = generateClientId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]+$/);
    expect(a).toHaveLength(48); // 24 bytes
  });

  it('generateClientSecret returns unique hex strings of expected length', () => {
    const a = generateClientSecret();
    const b = generateClientSecret();
    expect(a).not.toBe(b);
    expect(a).toHaveLength(64); // 32 bytes
  });

  it('hashClientSecret produces bcrypt hash', async () => {
    const secret = generateClientSecret();
    const hash = await hashClientSecret(secret);
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toBe(secret);
  });

  it('verifyClientSecret accepts matching secret, rejects wrong one', async () => {
    const secret = generateClientSecret();
    const hash = await hashClientSecret(secret);

    expect(await verifyClientSecret(secret, hash)).toBe(true);
    expect(await verifyClientSecret('wrong-secret-value', hash)).toBe(false);
  });

  it('two hashes of same secret differ (salt) but both verify', async () => {
    const secret = generateClientSecret();
    const h1 = await hashClientSecret(secret);
    const h2 = await hashClientSecret(secret);
    expect(h1).not.toBe(h2);
    expect(await verifyClientSecret(secret, h1)).toBe(true);
    expect(await verifyClientSecret(secret, h2)).toBe(true);
  });
});

// =====================================================================
// PKCE S256 valid / invalid
// =====================================================================

describe('PKCE verifyPkce (S256)', () => {
  function base64url(buf: Buffer): string {
    return buf
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  it('method=S256: matching verifier yields true', () => {
    const verifier = 'kJpQ6yIBlsgt0wKqFjlqdWvlrnD8fTz9Rc2mH_kE7mA';
    const challenge = base64url(
      crypto.createHash('sha256').update(verifier).digest()
    );
    expect(verifyPkce(verifier, challenge, 'S256')).toBe(true);
  });

  it('method=S256: wrong verifier yields false', () => {
    const verifier = 'kJpQ6yIBlsgt0wKqFjlqdWvlrnD8fTz9Rc2mH_kE7mA';
    const challenge = base64url(
      crypto.createHash('sha256').update(verifier).digest()
    );
    expect(verifyPkce('a-different-verifier-zzzzzzzzzzzzzzzzz', challenge, 'S256')).toBe(false);
  });

  it('method=S256 default (no method arg) still works', () => {
    const verifier = 'default-method-test-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const challenge = base64url(
      crypto.createHash('sha256').update(verifier).digest()
    );
    expect(verifyPkce(verifier, challenge)).toBe(true);
  });

  it('method=plain: string equality only', () => {
    const verifier = 'plain-text-verifier-aaaaaaaaaaaaaaaaaaaaa';
    expect(verifyPkce(verifier, verifier, 'plain')).toBe(true);
    expect(verifyPkce(verifier, 'different', 'plain')).toBe(false);
  });

  it('method=S256: different lengths yield false (timingSafeEqual short-circuit)', () => {
    expect(verifyPkce('short', 'a-much-longer-challenge-here', 'S256')).toBe(
      false
    );
  });
});

// =====================================================================
// Client management
// =====================================================================

describe('createClient', () => {
  it('persists client with hashed secret (plain not stored)', async () => {
    mockPrisma.oAuthClient.create.mockResolvedValue({
      id: 'client-row-1',
      clientId: 'a'.repeat(48), // mock data — gercek clientId 48 char hex uretilir
      clientSecret: 'HASH',
    });

    const result = await createClient('user-1', {
      name: 'Test App',
      redirectUris: ['https://app.example.com/cb'],
      scopes: ['read:profile'],
    });

    expect(result.clientSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(result.clientSecret).not.toMatch(/^\$2/); // plain, not hash
    expect(result.client.clientId).toMatch(/^[0-9a-f]{48}$/);

    const call = mockPrisma.oAuthClient.create.mock.calls[0][0];
    expect(call.data.clientSecret).toMatch(/^\$2[aby]\$/); // hash stored
    expect(call.data.clientSecret).not.toBe(result.clientSecret);
  });
});

describe('findActiveClient', () => {
  it('returns client when found and not revoked', async () => {
    const client = { clientId: 'c1', revokedAt: null };
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(client);
    expect(await findActiveClient('c1')).toBe(client);
  });

  it('returns null when revoked', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValue({
      clientId: 'c1',
      revokedAt: new Date(),
    });
    expect(await findActiveClient('c1')).toBeNull();
  });

  it('returns null when not found', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(null);
    expect(await findActiveClient('c1')).toBeNull();
  });
});

describe('validateRedirectUri', () => {
  const client = {
    redirectUris: ['https://app.example.com/cb', 'https://app.example.com/cb2'],
  };

  it('matches whitelisted URI exactly', () => {
    expect(validateRedirectUri(client, 'https://app.example.com/cb')).toBe(true);
  });

  it('rejects unknown URI', () => {
    expect(validateRedirectUri(client, 'https://evil.example.com/cb')).toBe(false);
  });

  it('rejects when client has no redirectUris list', () => {
    expect(validateRedirectUri({ redirectUris: null }, 'https://x')).toBe(false);
  });
});

describe('validateScopes', () => {
  const client = {
    scopes: ['read:profile', 'read:monitor'],
  };

  it('grants subset when all requested scopes allowed', () => {
    const r = validateScopes(client, ['read:profile']);
    expect(r.valid).toBe(true);
    expect(r.granted).toEqual(['read:profile']);
  });

  it('rejects when any scope not allowed', () => {
    const r = validateScopes(client, ['read:profile', 'admin']);
    expect(r.valid).toBe(false);
    expect(r.granted).toEqual(['read:profile']);
  });
});

// =====================================================================
// Authorization code single-use
// =====================================================================

describe('createAuthorizationCode', () => {
  it('persists code with challenge + expiresAt', async () => {
    mockPrisma.oAuthAuthorizationCode.create.mockResolvedValue({});
    const { code, expiresAt } = await createAuthorizationCode({
      clientId: 'c1',
      userId: 'u1',
      redirectUri: 'https://app/cb',
      scopes: ['read:profile'],
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
    });

    expect(code).toMatch(/^[0-9a-f]{64}$/);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    expect(mockPrisma.oAuthAuthorizationCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code,
          clientId: 'c1',
          userId: 'u1',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S256',
        }),
      })
    );
  });
});

describe('exchangeAuthorizationCode — single-use + happy path', () => {
  function base64url(buf: Buffer): string {
    return buf
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  const verifier = 'kJpQ6yIBlsgt0wKqFjlqdWvlrnD8fTz9Rc2mH_kE7mA';
  const challenge = base64url(
    crypto.createHash('sha256').update(verifier).digest()
  );
  const clientSecretPlain = 'plain-secret-32-byte-hex-aaaaaaaaaaaaaaaaaaa';
  // We'll mock verifyClientSecret path by precomputing a known bcrypt hash;
  // simpler: stub findActiveClient + verifyClientSecret is internal — so we
  // mock the bcrypt call via prisma-oAuthClient.findUnique return + a real
  // hash produced from the same plain secret.
  let secretHash = '';

  beforeEach(async () => {
    const bcrypt = await import('bcryptjs');
    secretHash = await bcrypt.hash(clientSecretPlain, 4); // low cost for tests
  });

  function setupHappyPath(usedAt: Date | null = null) {
    const client = {
      clientId: 'cid',
      clientSecret: secretHash,
      revokedAt: null,
    };
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(client);
    mockPrisma.oAuthAuthorizationCode.findUnique.mockResolvedValue({
      code: 'auth-code-1',
      clientId: 'cid',
      userId: 'user-1',
      redirectUri: 'https://app/cb',
      scopes: ['read:profile'],
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt,
    });
  }

  it('exchanges valid code → tokens', async () => {
    setupHappyPath(null);

    const result = await exchangeAuthorizationCode({
      clientId: 'cid',
      clientSecret: clientSecretPlain,
      code: 'auth-code-1',
      redirectUri: 'https://app/cb',
      codeVerifier: verifier,
    });

    expect(result.tokenType).toBe('Bearer');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.accessToken).not.toBe(result.refreshToken);
    expect(result.expiresIn).toBe(3600);
    expect(result.scope).toBe('read:profile');
  });

  it('rejects when code already used (single-use)', async () => {
    setupHappyPath(new Date(Date.now() - 1000)); // used

    await expect(
      exchangeAuthorizationCode({
        clientId: 'cid',
        clientSecret: clientSecretPlain,
        code: 'auth-code-1',
        redirectUri: 'https://app/cb',
        codeVerifier: verifier,
      })
    ).rejects.toThrow(/zaten kullanılmış/i);
  });

  it('rejects expired code', async () => {
    const client = {
      clientId: 'cid',
      clientSecret: secretHash,
      revokedAt: null,
    };
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(client);
    mockPrisma.oAuthAuthorizationCode.findUnique.mockResolvedValue({
      code: 'auth-code-1',
      clientId: 'cid',
      userId: 'user-1',
      redirectUri: 'https://app/cb',
      scopes: ['read:profile'],
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });

    await expect(
      exchangeAuthorizationCode({
        clientId: 'cid',
        clientSecret: clientSecretPlain,
        code: 'auth-code-1',
        redirectUri: 'https://app/cb',
        codeVerifier: verifier,
      })
    ).rejects.toThrow(/süresi dolmuş/i);
  });

  it('rejects redirect_uri mismatch', async () => {
    const client = {
      clientId: 'cid',
      clientSecret: secretHash,
      revokedAt: null,
    };
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(client);
    mockPrisma.oAuthAuthorizationCode.findUnique.mockResolvedValue({
      code: 'auth-code-1',
      clientId: 'cid',
      userId: 'user-1',
      redirectUri: 'https://app/cb',
      scopes: ['read:profile'],
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });

    await expect(
      exchangeAuthorizationCode({
        clientId: 'cid',
        clientSecret: clientSecretPlain,
        code: 'auth-code-1',
        redirectUri: 'https://attacker.example/cb',
        codeVerifier: verifier,
      })
    ).rejects.toThrow(/redirect_uri uyuşmuyor/i);
  });

  it('rejects invalid PKCE verifier', async () => {
    setupHappyPath(null);

    await expect(
      exchangeAuthorizationCode({
        clientId: 'cid',
        clientSecret: clientSecretPlain,
        code: 'auth-code-1',
        redirectUri: 'https://app/cb',
        codeVerifier: 'totally-wrong-verifier-aaaaaaaaaaaaaaa',
      })
    ).rejects.toThrow(/PKCE doğrulaması başarısız/i);
  });

  it('rejects unknown client', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValue(null);
    await expect(
      exchangeAuthorizationCode({
        clientId: 'unknown',
        clientSecret: 'whatever',
        code: 'x',
        redirectUri: 'https://x',
        codeVerifier: verifier,
      })
    ).rejects.toThrow(/Geçersiz client/i);
  });
});

// =====================================================================
// Access token validate / revoke
// =====================================================================

function makeAccessTokenRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tok-1',
    tokenHash: 'H',
    clientId: 'cid',
    userId: 'user-1',
    scopes: ['read:profile'],
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

describe('validateAccessToken', () => {
  it('returns userId+clientId+scopes for valid token', async () => {
    const row = makeAccessTokenRow();
    mockPrisma.oAuthAccessToken.findUnique.mockResolvedValue(row);

    // Compute expected hash via same algorithm as service.hashAccessToken
    const expectedHash = crypto
      .createHash('sha256')
      .update('plain-token')
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    mockPrisma.oAuthAccessToken.findUnique.mockImplementationOnce(
      async (args: { where: { tokenHash: string } }) => {
        expect(args.where.tokenHash).toBe(expectedHash);
        return row;
      }
    );

    const result = await validateAccessToken('plain-token');
    expect(result?.userId).toBe('user-1');
    expect(result?.clientId).toBe('cid');
    expect(result?.scopes).toEqual(['read:profile']);
  });

  it('returns null when token not found', async () => {
    mockPrisma.oAuthAccessToken.findUnique.mockResolvedValue(null);
    expect(await validateAccessToken('nope')).toBeNull();
  });

  it('returns null when token expiresAt in past', async () => {
    mockPrisma.oAuthAccessToken.findUnique.mockResolvedValue(
      makeAccessTokenRow({ expiresAt: new Date(Date.now() - 1000) })
    );
    expect(await validateAccessToken('plain-token')).toBeNull();
  });

  it('returns null when token revoked', async () => {
    mockPrisma.oAuthAccessToken.findUnique.mockResolvedValue(
      makeAccessTokenRow({ revokedAt: new Date() })
    );
    expect(await validateAccessToken('plain-token')).toBeNull();
  });
});

describe('revokeAccessToken', () => {
  it('returns true when an unrevoked token exists', async () => {
    mockPrisma.oAuthAccessToken.updateMany.mockResolvedValue({ count: 1 });
    const ok = await revokeAccessToken('plain-token');
    expect(ok).toBe(true);

    const call = mockPrisma.oAuthAccessToken.updateMany.mock.calls[0][0];
    expect(call.where.revokedAt).toBeNull();
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });

  it('returns false when no unrevoked token matches', async () => {
    mockPrisma.oAuthAccessToken.updateMany.mockResolvedValue({ count: 0 });
    expect(await revokeAccessToken('plain-token')).toBe(false);
  });
});

describe('revokeAllClientTokens', () => {
  it('returns total count of revoked access + refresh tokens', async () => {
    mockPrisma.oAuthAccessToken.updateMany.mockResolvedValueOnce({ count: 7 });
    mockPrisma.oAuthRefreshToken.updateMany.mockResolvedValueOnce({ count: 5 });
    const n = await revokeAllClientTokens('cid');
    expect(n).toBe(12); // 7 access + 5 refresh

    // $transaction array form cagirildi
    const txCall = mockPrisma.$transaction.mock.calls[0][0];
    expect(Array.isArray(txCall)).toBe(true);
    expect(txCall).toHaveLength(2); // access + refresh

    // access update many WHERE clause
    expect(mockPrisma.oAuthAccessToken.updateMany).toHaveBeenCalledWith({
      where: { clientId: 'cid', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    // refresh update many WHERE clause
    expect(mockPrisma.oAuthRefreshToken.updateMany).toHaveBeenCalledWith({
      where: { clientId: 'cid', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
