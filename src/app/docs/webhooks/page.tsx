import type { Metadata } from 'next';
import Link from 'next/link';
import { FaBell, FaShieldAlt, FaKey, FaRedo } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Webhooks & Olay Bildirimleri — Noktanyus',
  description:
    'HMAC-SHA256 imza doğrulama, olay tipleri, retry mantığı ve webhook yönetim rehberi.',
  alternates: { canonical: '/docs/webhooks' },
};

const VERIFY_NODE = `import crypto from 'crypto';

// Gelen isteği doğrula
function verifyWebhookSignature(rawBody: string, signatureHeader: string, webhookSecret: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody, 'utf-8')
    .digest('hex');

  // Zamanlama saldırılarını (timing attacks) engellemek için timingSafeEqual kullanın
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}`;

const VERIFY_PY = `import hmac
import hashlib

def verify_webhook_signature(raw_body_bytes: bytes, signature_header: str, webhook_secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body_bytes,
        hashlib.sha256
    ).hexdigest()
    
    # Timing-safe karşılaştırma
    return hmac.compare_digest(expected, signature_header)`;

export default function WebhooksDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wide uppercase">
          <FaBell className="text-[10px]" />
          <span>Asenkron Olay Bildirimleri</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Webhooks &amp; Olay Akışı
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Sipariş tamamlama, abonelik yenileme ve servis uptime monitör olaylarını anlık olarak kendi sunucunuza güvenli
          POST istekleri olarak alın. Tüm bildirimler HMAC-SHA256 ile imzalanır.
        </p>
      </header>

      {/* HTTP Başlıkları */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaKey className="text-brand-primary" />
          <span>Webhook İstek Başlıkları</span>
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-3">
            <code className="font-mono font-bold text-brand-primary">X-Webhook-Signature</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">sha256=&lt;hmac-hex&gt;</code> — Ham (raw) JSON gövdesi üzerinden gizli anahtarınızla üretilen dijital imza.
            </p>
          </div>
          <div className="py-3">
            <code className="font-mono font-bold text-brand-primary">X-Webhook-Event</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Olay tipi (örn:{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">order.paid</code>,{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">monitor.down</code>,{' '}
              <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">monitor.up</code>).
            </p>
          </div>
          <div className="py-3">
            <code className="font-mono font-bold text-brand-primary">X-Webhook-Delivery-Id</code>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Her teslimat için benzersiz UUID. Çift işlem yapılmasını önlemek (idempotency) için saklayın.
            </p>
          </div>
        </div>
      </section>

      {/* İmza Doğrulama Kodları */}
      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FaShieldAlt className="text-emerald-500" />
          <span>İmza Doğrulama (HMAC-SHA256)</span>
        </h2>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Node.js / TypeScript
          </span>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
            {VERIFY_NODE}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Python 3
          </span>
          <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
            {VERIFY_PY}
          </pre>
        </div>
      </section>

      {/* Yeniden Deneme (Retry) Politikası */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 mb-8">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <FaRedo className="text-amber-500" />
          <span>Yeniden Deneme (Retry &amp; Backoff) Politikası</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Uç noktanız 2xx durum kodu dönmezse veya 10 saniye içinde yanıt vermezse, sistem üstel geri çekilme (exponential backoff)
          algoritması ile en fazla 5 kez isteği tekrarlar. 5 başarısız denemenin ardından olay &ldquo;Dead-Letter&rdquo; durumuna alınır.
        </p>
      </section>

      {/* Webhook Yönet Paneli CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs sm:text-sm">
        <span className="text-slate-700 dark:text-slate-300">
          Endpoint adresinizi tanımlamak ve test olayı göndermek için Dashboard webhook merkezini kullanabilirsiniz.
        </span>
        <Link
          href="/dashboard/webhooks"
          className="px-4 py-2 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          Webhook Uç Noktalarını Yönet →
        </Link>
      </div>
    </div>
  );
}
