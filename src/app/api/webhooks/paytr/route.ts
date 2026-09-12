/**
 * POST /api/webhooks/paytr
 *
 * PayTR Bildirim URL (Direkt API 2. Adım).
 * Yanıt düz metin "OK" olmalı — JSON değil.
 *
 * Mağaza Paneli > Destek & Kurulum > Ayarlar > Bildirim URL:
 *   https://yourdomain.com/api/webhooks/paytr
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPaytrConfigured } from '@/lib/paytr';
import { paytrService } from '@/modules/commerce/paytrService';
import { commerceService } from '@/modules/commerce/service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = (await req.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, String(v ?? '')])
    );
  }
  const form = await req.formData();
  const out: Record<string, string> = {};
  form.forEach((value, key) => {
    out[key] = String(value);
  });
  return out;
}

export async function POST(req: NextRequest) {
  try {
    if (!isPaytrConfigured()) {
      logger.error('[PayTR] Callback alındı ama PayTR yapılandırılmamış');
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    const body = await parseBody(req);
    const verified = paytrService.verifyCallback(body);

    if (!verified.ok) {
      // Hash bozuksa OK dönme — PayTR tekrar dener; ama dokümantasyon
      // kötü hash için die diyor. Güvenlik için 400.
      return new NextResponse('PAYTR notification failed: bad hash', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: verified.merchantOid },
    });

    if (!order) {
      logger.warn('[PayTR] Callback: sipariş bulunamadı', {
        merchantOid: verified.merchantOid,
      });
      // PayTR'ye OK — bilinmeyen oid için sonsuz retry istemiyoruz
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    if (order.status === 'PAID' || order.status === 'REFUNDED' || order.status === 'CANCELED') {
      return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    if (verified.status === 'success') {
      const totalFromPaytr = Number(verified.totalAmount);
      // PayTR total_amount kuruş cinsinden gelebilir
      if (Number.isFinite(totalFromPaytr) && totalFromPaytr > 0) {
        const asCents =
          totalFromPaytr >= order.totalCents * 0.5
            ? Math.round(totalFromPaytr)
            : Math.round(totalFromPaytr * 100);
        if (asCents !== order.totalCents) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              totalCents: asCents,
              metadata: {
                ...((order.metadata as object) ?? {}),
                paytrTotalAmount: verified.totalAmount,
              },
            },
          });
        }
      }

      await commerceService.handleCheckoutCompleted({
        id: verified.merchantOid,
        payment_intent: `paytr_${verified.merchantOid}`,
      });
      logger.info('[PayTR] Sipariş onaylandı', {
        orderId: order.id,
        merchantOid: verified.merchantOid,
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELED',
          notes: [
            order.notes,
            verified.failedReasonMsg
              ? `PayTR fail: ${verified.failedReasonCode ?? ''} ${verified.failedReasonMsg}`
              : 'PayTR ödeme başarısız',
          ]
            .filter(Boolean)
            .join(' | '),
        },
      });
      logger.warn('[PayTR] Sipariş iptal', {
        orderId: order.id,
        reason: verified.failedReasonMsg,
      });
    }

    return new NextResponse('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  } catch (err) {
    logger.error('[PayTR] Callback hata', { error: err });
    // PayTR retry için 500 — geçici hatalarda
    return new NextResponse('ERROR', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}

/** Health / panel kontrolü */
export async function GET() {
  return new NextResponse('PayTR webhook endpoint', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
