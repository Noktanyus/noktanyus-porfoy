/**
 * @file Dashboard — Template Lisans Tablosu (client component)
 * @description Phase 3 B.3: Kullanıcının tüm template lisanslarını tablo
 *              formatında gösterir. Lisans anahtarı kopyalama, detay
 *              sayfasına link ve kurulum CTA içerir.
 *
 *              Bos durum: marketplace'e yonlendiren CTA kartı.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaCopy, FaCheck, FaArrowRight, FaStore } from 'react-icons/fa';
import { PageStates } from '@/components/ui/PageStates';

export interface SerializedLicense {
  id: string;
  licenseKey: string;
  type: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  purchasePriceCents: number;
  currency: string;
  buyerEmail: string;
  workspaceName: string | null;
  installationsCount: number;
  template: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    category: string;
    previewImage: string | null;
    version: string;
    demoUrl: string | null;
  };
}

interface TemplateLicensesClientProps {
  licenses: SerializedLicense[];
  licenseTypeLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
  statusBadges: Record<string, { label: string; cls: string }>;
}

export function TemplateLicensesClient({
  licenses,
  licenseTypeLabels,
  categoryLabels,
  statusBadges,
}: TemplateLicensesClientProps) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLicense = async (license: SerializedLicense) => {
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopiedId(license.id);
      toast.success('Lisans anahtarı kopyalandı');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  if (licenses.length === 0) {
    return (
      <PageStates
        data={licenses}
        emptyTitle="Henüz lisansın yok"
        emptyDescription="Marketplace'ten bir template satın aldığında lisans anahtarın burada görünecek. Lisans anahtarını kullanarak template'i workspace'ine kurabilirsin."
        emptyIcon="🎨"
        emptyActionLabel="Marketplace'i Keşfet"
        emptyAction={() => router.push('/marketplace')}
      >
        {null}
      </PageStates>
    );
  }

  return (
    <div className="glass-card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Template
              </th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Lisans Anahtarı
              </th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Tip
              </th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Durum
              </th>
              <th scope="col" className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                Bitiş
              </th>
              <th scope="col" className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((l) => {
              const badge =
                statusBadges[l.status] ??
                { label: l.status, cls: 'bg-gray-100 text-gray-700' };
              const expiresAt = l.expiresAt ? new Date(l.expiresAt) : null;
              const expiresText = expiresAt
                ? expiresAt.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';

              const isExpired =
                expiresAt && expiresAt.getTime() < Date.now();
              const isActive = l.status === 'active' && !isExpired;

              return (
                <tr
                  key={l.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4">
                    <Link
                      href={`/dashboard/templates/${l.id}`}
                      className="flex items-center gap-3 group min-w-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        {l.template.previewImage ? (
                          <Image
                            src={l.template.previewImage}
                            alt={l.template.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white group-hover:text-brand-primary truncate max-w-[180px]">
                          {l.template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {categoryLabels[l.template.category] ?? l.template.category} · v{l.template.version}
                          {l.workspaceName && ` · ${l.workspaceName}`}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded max-w-[160px] truncate">
                        {l.licenseKey.slice(0, 16)}…{l.licenseKey.slice(-4)}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyLicense(l)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Lisans anahtarını kopyala"
                        title="Kopyala"
                      >
                        {copiedId === l.id ? (
                          <FaCheck className="w-3 h-3 text-green-500" />
                        ) : (
                          <FaCopy className="w-3 h-3 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {licenseTypeLabels[l.type] ?? l.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-600 dark:text-gray-400">
                    {expiresText}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {l.installationsCount > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {l.installationsCount} kurulum
                        </span>
                      )}
                      <Link
                        href={`/dashboard/templates/${l.id}`}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isActive ? 'Kur / Yönet' : 'Detay'}
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TemplateLicensesClient;
