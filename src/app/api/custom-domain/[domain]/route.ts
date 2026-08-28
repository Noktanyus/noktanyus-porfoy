/**
 * @file /api/custom-domain/[domain] — public DNS doğrulama endpoint'i.
 * @description
 *   Bu endpoint herkese açıktır (auth gerektirmez). Domain'in DNS yapılandırmasının
 *   doğrulanmasında kullanılır. Gerçek implementasyonda Cloudflare/Route53 benzeri
 *   bir API ile CNAME lookup yapılır. Stub: sadece format kontrolü ile 200 döner.
 */

import { NextRequest, NextResponse } from 'next/server';
import { brandingService } from '@/modules/workspaces/brandingService';

export async function GET(
  _req: NextRequest,
  { params }: { params: { domain: string } }
) {
  const check = brandingService.validateCustomDomain(params.domain);

  if (!check.valid) {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        reason: check.reason,
        domain: params.domain,
      },
      { status: 400 }
    );
  }

  // Stub: gerçek DNS doğrulaması burada yapılır
  return NextResponse.json({
    success: true,
    verified: true,
    domain: params.domain.toLowerCase(),
    instructions:
      'CNAME kaydı ekleyin: status.example.com -> proxy.host.com. Doğrulama 5-10 dakika sürebilir.',
    ttl: 300,
    checkedAt: new Date().toISOString(),
  });
}
