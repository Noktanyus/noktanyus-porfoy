/**
 * @file /odeme — Tek seferlik ürün ödeme sayfası.
 *
 * Faz D:
 *  - Ortalanmış tek başlık yerine `PageHeader` (breadcrumb + "Mağaza" geri
 *    linki). Checkout akışında kullanıcının sepete/mağazaya dönebilmesi
 *    güvenli bir çıkış yolu sağlar.
 *  - Ödeme mantığı `CheckoutForm` içinde; DEĞİŞTİRİLMEDİ.
 */

import { Metadata } from 'next';
import { CheckoutForm } from '@/components/commerce/CheckoutForm';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const metadata: Metadata = {
  title: 'Ödeme',
};

export default function CheckoutPage() {
  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="mx-auto max-w-3xl space-y-6">
          <PageHeader
            title="Ödeme"
            description="Sipariş bilgilerinizi kontrol edip ödemeyi tamamlayın."
            backHref="/magaza"
            backLabel="Mağaza"
            breadcrumb={<span>Mağaza / Ödeme</span>}
          />
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
