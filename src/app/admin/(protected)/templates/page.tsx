/**
 * @file Admin — Template Listings List Page
 * @description Phase 3 B.3: Admin template vitrin yönetim listesi.
 *              Tum template'leri (active + inactive) gosterir.
 *              Edit / delete / feature toggle islemleri tablo satirlarinda.
 *
 * Pattern: src/app/admin/(protected)/products/page.tsx
 */

import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { TemplateToggleButton } from '@/components/admin/TemplateToggleButton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { FaPlus, FaStore, FaStar } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Template Yönetimi | Admin',
};

function formatCurrency(cents: number, currency: string) {
  const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

const CATEGORY_LABEL: Record<string, string> = {
  ecommerce: 'E-Ticaret',
  saas: 'SaaS',
  portfolio: 'Portfolyo',
  blog: 'Blog',
};

export default async function AdminTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  if (session.user.role !== 'admin') redirect('/');

  let templates: Array<{
    id: string;
    slug: string;
    name: string;
    previewImages: unknown;
    version: string;
    category: string;
    priceCents: number;
    currency: string;
    active: boolean;
    featured: boolean;
    createdAt: Date;
    _count: { licenses: number; purchases: number };
  }> = [];
  let error: string | null = null;

  try {
    const rows = await prisma.templateListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { licenses: true, purchases: true } },
      },
    });
    templates = rows;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Template\'ler yüklenemedi';
  }

  if (error) {
    return <ErrorDisplay title="Template'ler Yüklenemedi" message={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Template Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Toplam {templates.length} template
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <FaStore className="w-3 h-3" />
            Vitrin
          </Link>
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
          >
            <FaPlus className="w-3 h-3" />
            Yeni Template
          </Link>
        </div>
      </div>

      <div className="glass-card-premium overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-5xl mb-3" aria-hidden="true">📦</p>
            <p className="font-medium mb-2">Henüz template yok</p>
            <p className="text-sm mb-4">İlk template'inizi oluşturarak başlayın.</p>
            <Link
              href="/admin/templates/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90"
            >
              <FaPlus className="w-3 h-3" />
              Yeni Template Oluştur
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Template
                  </th>
                  <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Kategori
                  </th>
                  <th scope="col" className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Fiyat
                  </th>
                  <th scope="col" className="text-center p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Lisans / Satış
                  </th>
                  <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Durum
                  </th>
                  <th scope="col" className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                          {Array.isArray(t.previewImages) && (t.previewImages as string[])[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={(t.previewImages as string[])[0]}
                              alt={t.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/templates/${t.id}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-brand-primary transition-colors block truncate"
                          >
                            {t.name}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            /{t.slug} · v{t.version}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800">
                        {CATEGORY_LABEL[t.category] ?? t.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                      {formatCurrency(t.priceCents, t.currency)}
                    </td>
                    <td className="p-4 text-center text-sm tabular-nums text-gray-600 dark:text-gray-400">
                      {t._count.licenses} / {t._count.purchases}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
                            Pasif
                          </span>
                        )}
                        {t.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <FaStar className="w-2.5 h-2.5" />
                            Öne Çıkan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <TemplateToggleButton
                          templateId={t.id}
                          field="featured"
                          value={t.featured}
                          tooltipOn="Öne çıkarmayı kaldır"
                          tooltipOff="Öne çıkar"
                        />
                        <TemplateToggleButton
                          templateId={t.id}
                          field="active"
                          value={t.active}
                          tooltipOn="Pasif yap"
                          tooltipOff="Aktif yap"
                        />
                        <DeleteButton
                          endpoint={`/api/admin/templates/${t.id}`}
                          confirmMessage={`"${t.name}" template'ini silmek istediğinize emin misiniz? Pasif duruma getirilir.`}
                          itemName={t.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
