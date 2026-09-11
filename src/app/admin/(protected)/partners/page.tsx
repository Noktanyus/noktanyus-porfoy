'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type PartnerRow = {
  id: string;
  companyName: string;
  slug: string;
  contactEmail: string;
  verified: boolean;
  active: boolean;
  commissionPercent: number;
  totalLeads: number;
  totalConversions: number;
  user?: { email: string | null; name: string | null } | null;
};

export default function AdminPartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/partners');
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Yüklenemedi');
      setPartners(data.data.partners);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = async (id: string, body: { verified?: boolean; active?: boolean }) => {
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Güncellenemedi');
      toast.success('Güncellendi');
      startTransition(() => {
        load();
        router.refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">İş Ortakları</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Toplam {partners.length} partner — doğrulama ve aktiflik yönetimi
        </p>
      </div>

      <div className="glass-card-premium overflow-hidden">
        {partners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Henüz partner kaydı yok</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left p-4">Şirket</th>
                  <th className="text-left p-4">İletişim</th>
                  <th className="text-right p-4">Lead</th>
                  <th className="text-right p-4">Dönüşüm</th>
                  <th className="text-left p-4">Durum</th>
                  <th className="text-right p-4">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="p-4">
                      <div className="font-medium">{p.companyName}</div>
                      <div className="text-xs text-gray-500 font-mono">@{p.slug}</div>
                    </td>
                    <td className="p-4">
                      <div>{p.contactEmail}</div>
                      <div className="text-xs text-gray-500">{p.user?.email}</div>
                    </td>
                    <td className="p-4 text-right">{p.totalLeads}</td>
                    <td className="p-4 text-right">{p.totalConversions}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs ${
                            p.verified
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.verified ? 'Doğrulandı' : 'Bekliyor'}
                        </span>
                        <span
                          className={`inline-flex w-fit px-2 py-0.5 rounded-full text-xs ${
                            p.active
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => patch(p.id, { verified: !p.verified })}
                        className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {p.verified ? 'Doğrulamayı kaldır' : 'Doğrula'}
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => patch(p.id, { active: !p.active })}
                        className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {p.active ? 'Pasifleştir' : 'Aktifleştir'}
                      </button>
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
