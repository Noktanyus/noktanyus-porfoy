/**
 * iyzico Checkout Callback
 *
 * iyzico ödeme sonrası kullanıcıyı bu sayfaya yönlendirir.
 * Token ile ödemeyi doğrular, başarılıysa order'ı PAID yapar ve lisans üretir.
 */

import { redirect } from 'next/navigation';
import { iyzicoService } from '@/modules/commerce/iyzicoService';
import { commerceService } from '@/modules/commerce';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { token?: string; status?: string };
}

export default async function IyzicoCallbackPage({ searchParams }: PageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect('/odeme/basarili?iyzico_error=no_token');
  }

  try {
    const result = await iyzicoService.retrieveCheckout(token);

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      // Token ile eşleşen order'ı bul (token stripeSessionId alanında tutuluyor)
      const order = await prisma.order.findFirst({
        where: { stripeSessionId: token },
      });

      if (order) {
        // handleCheckoutCompleted Stripe session imzası bekliyor; mock payment_intent ile çağır
        await commerceService.handleCheckoutCompleted({
          id: token,
          payment_intent: token,
        });

        logger.info('[iyzico] Order completed', {
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
        redirect(`/odeme/basarili?iyzico=success&order=${order.orderNumber}`);
      }

      redirect('/odeme/basarili?iyzico=success');
    }

    redirect('/odeme/basarili?iyzico_error=failed');
  } catch (err) {
    logger.error('[iyzico] callback verification failed', { error: err });
    redirect('/odeme/basarili?iyzico_error=verify_failed');
  }
}