/**
 * Dashboard — Destek merkezi (self-serve + iletişim)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  FaBook,
  FaKey,
  FaSatelliteDish,
  FaHeartbeat,
  FaEnvelope,
  FaRocket,
  FaBug,
} from 'react-icons/fa';

export const dynamic = 'force-dynamic';

const LINKS = [
  {
    href: '/baslangic',
    title: '5 dakikada başlangıç',
    desc: 'İlk API anahtarı ve örnek istek',
    icon: FaRocket,
  },
  {
    href: '/docs',
    title: 'API referansı',
    desc: 'OpenAPI / Redoc + örnekler',
    icon: FaBook,
  },
  {
    href: '/docs/hatalar',
    title: 'Hata kodları',
    desc: '402, 429 ve diğer yanıtlar',
    icon: FaBug,
  },
  {
    href: '/dashboard/api-keys',
    title: 'API anahtarları',
    desc: 'Oluştur, scope ve kota',
    icon: FaKey,
  },
  {
    href: '/dashboard/webhooks',
    title: 'Webhooks',
    desc: 'Teslimat, test ve replay',
    icon: FaSatelliteDish,
  },
  {
    href: '/dashboard/monitors',
    title: 'Monitörler',
    desc: 'Uptime ve alert kanalları',
    icon: FaHeartbeat,
  },
  {
    href: '/durum',
    title: 'Sistem durumu',
    desc: 'Anlık sağlık + rozet',
    icon: FaHeartbeat,
  },
  {
    href: '/iletisim',
    title: 'İletişim / enterprise',
    desc: 'Satış ve destek formu',
    icon: FaEnvelope,
  },
];

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/support');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Destek"
        description="Self-serve kaynaklar ve iletişim"
        actions={
          <Link href="/iletisim?konu=destek" className="admin-btn admin-btn-primary">
            Destek formu
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 gap-3">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-border bg-card/50 p-4 hover:border-brand-primary/40 transition-colors flex gap-3 min-h-[72px]"
            >
              <Icon className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
        Durum rozeti (SVG):{' '}
        <code className="text-xs">https://noktanyus.com/api/health/badge</code>
      </div>
    </div>
  );
}
