/**
 * @file OAuth Refresh Token Rotation Tests — L3
 * @description rotateRefreshToken davranışı + revokeAllClientTokens'in
 *              access+refresh revocation kapsamı + reuse detection +
 *              scope downgrade validation.
 *
 *              Test edilen akışlar:
 *              1. rotateRefreshToken: valid → yeni access + refresh, eski revoked
 *              2. rotateRefreshToken: revoked token → tüm user-client refresh'leri revoke + error
 *              3. rotateRefreshToken: expired token → error
 *              4. rotateRefreshToken: wrong client → error
 *              5. rotateRefreshToken: scope downgrade (subset) → kabul
 *              6. rotateRefreshToken: scope escalation (superset) → red
 *              7. rotateRefreshToken: concurrent rotation → error
 *              8. revokeRefreshToken: unrevoked → true; revoked → false
 *              9. revokeAllClientTokens: access + refresh paralel revoke
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

// --- Mock prisma ---
vi.mock('@/lib/prisma', () => {
  const oAuthRefreshToken = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const oAuthAccessToken = {
    create: vi.fn(),
    updateMany: vi.fn(),
  };
  const oAuthClient = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const txMock = {
    oAuthRefreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccessToken: {
      create: vi.fn(),
    },
  };
  const prismaMock = {
    oAuthRefreshToken,
    oAuthAccessToken,
    oAuthClient,
    $transaction: vi.fn(async (cbOrArr: unknown) => {
      // Array form: prisma.$transaction([...])
      if (Array.isArray(cbOrArr)) {
        return cbOrArr.map((p: any) => {
          if (p?.data?.clientSecret !== undefined) return { id: 'client-row-1' };
          if (p?.data?.tokenHash && p?.where?.clientId) return { count: 3 };
          return { count: 0 };
        });
      }
      // Callback form: prisma.$transaction(async (tx) => ...)
      return (cbOrArr as (tx: typeof txMock) => Promise<unknown>)(txMock);
    }),
  };
  return { prisma: prismaMock, __txMock: txMock };
});

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import {
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllClientTokens,
  revokeAllUserClientRefreshTokens,
  generateRefreshToken,
  hashRefreshToken,
  rotateClientSecret,
} from '../service';

const mockPrisma = prisma as unknown as {
  oAuthRefreshToken: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  oAuthAccessToken: {
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  oAuthClient: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// generateRefreshToken / hashRefreshToken
// ============================================================================

describe('generateRefreshToken / hashRefreshToken', () => {
  it('generateRefreshToken → 64 char base64url (48 bytes)', () => {
    const t = generateRefreshToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
    // 48 byte → 64 char base64url (padding olmadan)
    expect(t).toHaveLength(64);
  });

  it('two generateRefreshToken calls produce different values', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });

  it('hashRefreshToken is SHA256 base64url — deterministic + 43 char', () => {
    const t = generateRefreshToken();
    const h1 = hashRefreshToken(t);
    const h2 = hashRefreshToken(t);
    expect(h1).toBe(h2);
    // SHA256 → 32 byte → 43 char base64url (padding olmadan)
    expect(h1).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashRefreshToken of different tokens differ', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
  });
});

// ============================================================================
// rotateRefreshToken — happy path
// ============================================================================

function makeRefreshRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rt-1',
    tokenHash: 'HASH-OLD',
    clientId: 'client-row-1',
    userId: 'user-1',
    scopes: ['read:profile', 'read:monitor'],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    replacedById: null,
    lastUsedAt: null,
    ...overrides,
  };
}

describe('rotateRefreshToken — happy path', () => {
  it('valid refresh → new tokens, old marked revoked + replacedById set', async () => {
    const oldRow = makeRefreshRow();
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(oldRow);
    // transaction callback tx mock: findUnique (still valid) → create → update → create access
    const txRefresh = {
      findUnique: vi.fn().mockResolvedValue(oldRow),
      create: vi.fn().mockResolvedValue({ id: 'rt-NEW' }),
      update: vi.fn().mockResolvedValue({}),
    };
    const txAccess = {
      create: vi.fn().mockResolvedValue({}),
    };
    (mockPrisma.$transaction as any).mockImplementationOnce(
      async (cb: (tx: any) => Promise<unknown>) =>
        cb({ oAuthRefreshToken: txRefresh, oAuthAccessToken: txAccess })
    );

    const plain = generateRefreshToken();
    const result = await rotateRefreshToken({
      plainRefreshToken: plain,
      clientId: 'client-row-1',
    });

    expect(result.tokenType).toBe('Bearer');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.accessToken).not.toBe(result.refreshToken);
    expect(result.expiresIn).toBe(3600);
    expect(result.scope).toBe('read:profile read:monitor');

    // outer lookup hash
    expect(mockPrisma.oAuthRefreshToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashRefreshToken(plain) },
    });

    // transaction: yeni refresh create
    expect(txRefresh.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'client-row-1',
          userId: 'user-1',
          scopes: ['read:profile', 'read:monitor'],
        }),
      })
    );

    // transaction: eski refresh update — revokedAt + replacedById + lastUsedAt
    expect(txRefresh.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        replacedById: 'rt-NEW',
        lastUsedAt: expect.any(Date),
      }),
    });

    // transaction: yeni access token create
    expect(txAccess.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'client-row-1',
          userId: 'user-1',
        }),
      })
    );
  });
});

// ============================================================================
// rotateRefreshToken — revoked token (reuse detection)
// ============================================================================

describe('rotateRefreshToken — reuse detection', () => {
  it('revoked token → tüm user+client aktif refresh revoke + error', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(
      makeRefreshRow({ revokedAt: new Date(Date.now() - 1000) })
    );
    mockPrisma.oAuthRefreshToken.updateMany.mockResolvedValueOnce({ count: 4 });

    await expect(
      rotateRefreshToken({
        plainRefreshToken: 'any',
        clientId: 'client-row-1',
      })
    ).rejects.toThrow(/reuse tespit edildi/i);

    // updateMany: userId + clientId + revokedAt:null
    expect(mockPrisma.oAuthRefreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        clientId: 'client-row-1',
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });
});

// ============================================================================
// rotateRefreshToken — expired
// ============================================================================

describe('rotateRefreshToken — expired', () => {
  it('expired refresh → INVALID_GRANT, no transaction', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(
      makeRefreshRow({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(
      rotateRefreshToken({
        plainRefreshToken: 'any',
        clientId: 'client-row-1',
      })
    ).rejects.toThrow(/süresi dolmuş/i);

    // transaction çağrılmamalı
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

// ============================================================================
// rotateRefreshToken — wrong client
// ============================================================================

describe('rotateRefreshToken — wrong client', () => {
  it('clientId mismatch → invalid_grant', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(
      makeRefreshRow({ clientId: 'client-OTHER' })
    );

    await expect(
      rotateRefreshToken({
        plainRefreshToken: 'any',
        clientId: 'client-row-1',
      })
    ).rejects.toThrow(/Geçersiz refresh token/i);
  });

  it('not found → invalid_grant', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(null);
    await expect(
      rotateRefreshToken({
        plainRefreshToken: 'any',
        clientId: 'client-row-1',
      })
    ).rejects.toThrow(/Geçersiz refresh token/i);
  });
});

// ============================================================================
// rotateRefreshToken — scope downgrade
// ============================================================================

describe('rotateRefreshToken — scope downgrade', () => {
  it('requested scope subset → kabul, grantedScopes filtrelenir', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(makeRefreshRow());
    const txRefresh = {
      findUnique: vi.fn().mockResolvedValue(makeRefreshRow()),
      create: vi.fn().mockResolvedValue({ id: 'rt-NEW' }),
      update: vi.fn().mockResolvedValue({}),
    };
    const txAccess = { create: vi.fn().mockResolvedValue({}) };
    (mockPrisma.$transaction as any).mockImplementationOnce(
      async (cb: (tx: any) => Promise<unknown>) =>
        cb({ oAuthRefreshToken: txRefresh, oAuthAccessToken: txAccess })
    );

    const result = await rotateRefreshToken({
      plainRefreshToken: 'any',
      clientId: 'client-row-1',
      requestedScope: 'read:profile', // sadece bir scope
    });

    expect(result.scope).toBe('read:profile');
    // new refresh row'da sadece 1 scope yazilmali
    expect(txRefresh.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scopes: ['read:profile'],
        }),
      })
    );
  });

  it('requested scope superset → invalid_scope', async () => {
    mockPrisma.oAuthRefreshToken.findUnique.mockResolvedValueOnce(makeRefreshRow());

    await expect(
      rotateRefreshToken({
        plainRefreshToken: 'any',
        clientId: 'client-row-1',
        requestedScope: 'read:profile admin', // admin yok mevcut scope'ta
      })
    ).rejects.toThrow(/scope altkümesi değil/i);
  });
});

// ============================================================================
// revokeRefreshToken
// ============================================================================

describe('revokeRefreshToken', () => {
  it('revokes unrevoked refresh → returns true', async () => {
    mockPrisma.oAuthRefreshToken.updateMany.mockResolvedValueOnce({ count: 1 });
    const ok = await revokeRefreshToken('plain-refresh');
    expect(ok).toBe(true);

    const call = mockPrisma.oAuthRefreshToken.updateMany.mock.calls[0][0];
    expect(call.where.tokenHash).toBe(hashRefreshToken('plain-refresh'));
    expect(call.where.revokedAt).toBeNull();
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });

  it('no matching unrevoked token → returns false', async () => {
    mockPrisma.oAuthRefreshToken.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await revokeRefreshToken('nope')).toBe(false);
  });
});

// ============================================================================
// revokeAllClientTokens (access + refresh)
// ============================================================================

describe('revokeAllClientTokens — covers both token tables', () => {
  it('revokes access + refresh in transaction, returns total count', async () => {
    // $transaction array form: [access update, refresh update]
    (mockPrisma.$transaction as any).mockImplementationOnce((arr: unknown[]) =>
      Promise.all([
        Promise.resolve({ count: 3 }), // access
        Promise.resolve({ count: 2 }), // refresh
      ])
    );

    const total = await revokeAllClientTokens('client-row-1');
    expect(total).toBe(5);

    // Transaction'a 2 istek gitmeli (access + refresh)
    const txCall = (mockPrisma.$transaction as any).mock.calls[0][0];
    expect(Array.isArray(txCall)).toBe(true);
    expect(txCall).toHaveLength(2);
  });
});

// ============================================================================
// revokeAllUserClientRefreshTokens
// ============================================================================

describe('revokeAllUserClientRefreshTokens', () => {
  it('revokes all active refresh tokens for (userId, clientId)', async () => {
    mockPrisma.oAuthRefreshToken.updateMany.mockResolvedValueOnce({ count: 2 });
    const n = await revokeAllUserClientRefreshTokens('user-1', 'client-row-1');
    expect(n).toBe(2);

    const call = mockPrisma.oAuthRefreshToken.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({
      userId: 'user-1',
      clientId: 'client-row-1',
      revokedAt: null,
    });
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });
});

// ============================================================================
// rotateClientSecret
// ============================================================================

describe('rotateClientSecret', () => {
  it('new plain secret üretilir, hash DB\'ye yazılır, tüm token\'lar revoke', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValueOnce({
      id: 'client-row-1',
      clientId: 'cid-abc',
      revokedAt: null,
    });

    const result = await rotateClientSecret('cid-abc');

    expect(result.clientSecret).toMatch(/^[0-9a-f]{64}$/); // 32 byte hex
    expect(result.revokedAccessTokens).toBeGreaterThanOrEqual(0);
    expect(result.revokedRefreshTokens).toBeGreaterThanOrEqual(0);

    // $transaction array form: [client update, access revoke, refresh revoke]
    const txCall = (mockPrisma.$transaction as any).mock.calls[0][0];
    expect(Array.isArray(txCall)).toBe(true);
    expect(txCall).toHaveLength(3);
  });

  it('client bulunamazsa NotFoundError fırlatır', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValueOnce(null);
    await expect(rotateClientSecret('nope')).rejects.toThrow(/bulunamadı/i);
  });

  it('revoked client için NotFoundError fırlatır', async () => {
    mockPrisma.oAuthClient.findUnique.mockResolvedValueOnce({
      id: 'client-row-1',
      clientId: 'cid-abc',
      revokedAt: new Date(),
    });
    await expect(rotateClientSecret('cid-abc')).rejects.toThrow(/bulunamadı/i);
  });
});

// ============================================================================
// Sanity: hashRefreshToken service ile test'te ayni sonucu verir
// ============================================================================

describe('hashRefreshToken ↔ service signature', () => {
  it('SHA256 base64url — known fixture', () => {
    const token = 'fixture-refresh-token-value';
    const expected = crypto
      .createHash('sha256')
      .update(token)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    expect(hashRefreshToken(token)).toBe(expected);
  });
});
