/**
 * POST /api/webhooks/paytr
 *
 * PayTR Bildirim URL (iFrame API 2. Adım / Direkt API 2. Adım).
 * Yanıt düz metin "OK" olmalı — JSON değil.
 *
 * Mağaza Paneli > Destek & Kurulum > Ayarlar > Bildirim URL:
 *   Protokol: https://
 *   URL:      noktanyus.com/api/webhooks/paytr
 *   Tam:      https://noktanyus.com/api/webhooks/paytr
 *
 * Not: Bu endpoint oturum gerektirmez; PayTR server-to-server POST yapar.
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
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = String(value);
    });
    return out;
  }
  try {
    const form = await req.formData();
    const out: Record<string, string> = {};
    form.forEach((value, key) => {
      out[key] = String(value);
    });
    return out;
  } catch {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const out: Record<string, string> = {};
    params.forEach((value, key) => {
      out[key] = String(value);
    });
    return out;
  }
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
      const totalFromPaytr = Math.round(Number(verified.totalAmount));
      // PayTR total_amount kuruş cinsinden gönderilir ve order.totalCents ile tam eşleşmelidir
      if (!Number.isFinite(totalFromPaytr) || totalFromPaytr !== order.totalCents) {
        logger.error('[PayTR] Güvenlik: Callback tutar uyuşmazlığı tespit edildi!', {
          orderId: order.id,
          merchantOid: verified.merchantOid,
          expectedTotalCents: order.totalCents,
          paytrTotalAmount: verified.totalAmount,
        });
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELED',
            notes: [
              order.notes,
              `Güvenlik Uyarısı: Tutar uyuşmazlığı. Beklenen: ${order.totalCents} kuruş, PayTR gelen: ${verified.totalAmount} kuruş.`,
            ]
              .filter(Boolean)
              .join(' | '),
          },
        });
        return new NextResponse('PAYTR notification failed: amount mismatch', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
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
