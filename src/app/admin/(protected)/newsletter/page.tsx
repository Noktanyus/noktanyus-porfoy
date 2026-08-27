/**
 * Admin — Newsletter Yönetim Sayfası
 *
 * Abone istatistikleri ve son N abone listesi.
 * Server component — Prisma üzerinden doğrudan sorgu.
 */

import Link from 'next/link';
import { FaPaperPlane } from 'react-icons/fa';
import { newsletterService } from '@/modules/newsletter';
import { NewsletterSubscriber } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const [stats, subscribers] = await Promise.all([
    newsletterService.getStats(),
    newsletterService.listSubscribers(50),
  ]);

  return (
    <div className="admin-content-spacing">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Newsletter Aboneleri</h1>
          <p className="admin-subtitle">
            Blog email abone sistemi — istatistikler ve abone listesi
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href="/admin/newsletter/broadcast"
            className="admin-btn admin-btn-primary"
          >
            <FaPaperPlane className="mr-2" />
            Broadcast Gönder
          </Link>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Toplam Abone" value={stats.total} accent="default" />
        <StatCard
          label="Aktif"
          value={stats.active}
          accent="success"
        />
        <StatCard
          label="Doğrulanmış"
          value={stats.verified}
          accent="info"
        />
      </div>

      {/* Abone Listesi */}
      <div className="admin-section">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="admin-section-header">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                  İsim
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                  Kaynak
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                  Durum
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 dark:text-gray-300">
                  Kayıt Tarihi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-4xl">📧</div>
                      <div>
                        <p className="text-lg font-medium">
                          Henüz abone yok
                        </p>
                        <p className="text-sm mt-1">
                          Footer veya blog üzerinden ilk abone geldiğinde
                          burada görünecek
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <SubscriberRow key={sub.id} sub={sub} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  accent: 'default' | 'success' | 'info' | 'warning';
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentClasses = {
    default: 'text-gray-900 dark:text-white',
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-orange-600 dark:text-orange-400',
  } as const;

  return (
    <div className="admin-card">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accentClasses[accent]}`}>{value}</p>
    </div>
  );
}

function SubscriberRow({ sub }: { sub: NewsletterSubscriber }) {
  const isActive = sub.active && !sub.unsubscribedAt;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200">
      <td className="py-4 px-6 font-mono text-sm text-gray-900 dark:text-gray-100">
        {sub.email}
      </td>
      <td className="py-4 px-6 text-gray-700 dark:text-gray-300">
        {sub.name ?? (
          <span className="text-gray-400 dark:text-gray-500 italic">—</span>
        )}
      </td>
      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
        {sub.source ?? (
          <span className="text-gray-400 dark:text-gray-500 italic">—</span>
        )}
      </td>
      <td className="py-4 px-6">
        {isActive ? (
          <span className="admin-status-active">Aktif</span>
        ) : (
          <span className="admin-status-inactive">Pasif</span>
        )}
        {sub.verifiedAt && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
            ✓ Doğrulandı
          </span>
        )}
      </td>
      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
        {new Date(sub.createdAt).toLocaleString('tr-TR')}
      </td>
    </tr>
  );
}