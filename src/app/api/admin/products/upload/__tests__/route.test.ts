import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSession = vi.hoisted(() => ({
  current: { user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' } } as any,
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession.current),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/audit', () => ({ logAudit: vi.fn() }));
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

import { POST as uploadProductFile } from '../route';

describe('Admin Product File Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = {
      user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' },
    };
  });

  it('admin olmayan kullanıcının dosya yüklemesini engeller (403)', async () => {
    mockSession.current = {
      user: { id: 'user-1', email: 'user@example.com', role: 'user' },
    };

    const formData = new FormData();
    formData.append('file', new Blob(['test content']), 'test.zip');

    const req = new NextRequest('http://localhost/api/admin/products/upload', {
      method: 'POST',
    });
    req.formData = vi.fn().mockResolvedValue(formData);

    const res = await uploadProductFile(req);
    expect(res.status).toBe(403);
  });

  it('geçerli dosya yüklendiğinde url, fileName ve fileSize döner', async () => {
    const file = new File(['content-binary'], 'MyDesktopApp-Setup.exe', {
      type: 'application/octet-stream',
    });

    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/admin/products/upload', {
      method: 'POST',
    });
    req.formData = vi.fn().mockResolvedValue(formData);

    const res = await uploadProductFile(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.fileName).toBe('MyDesktopApp-Setup.exe');
    expect(json.data.fileSize).toBe(14);
    expect(json.data.url).toContain('/api/static/uploads/products/');
  });
});
