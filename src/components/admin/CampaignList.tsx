'use client';

/**
 * CampaignList — Admin panel icin campaign tablosu.
 *
 * Status, tip ve istatistik rozetleri ile sirali liste.
 * Yeni campaign olusturma formu inline.
 *
 * Veri dürüstlüğü: Sent/Open/Click sayıları doğrudan `EmailCampaign` kaydından
 * gelir. Oran (%) HESAPLANMAZ ve uydurulmaz — yalnızca ham sayılar gösterilir.
 *
 * Faz D:
 *  - Sayfa yalnızca light-mode renklerle yazılmıştı (`bg-white`, `bg-gray-50`,
 *    `text-gray-500`); dark mode'da okunamıyordu. Semantik token'lara geçildi.
 *  - Başlık `PageHeader`, tablo `ResponsiveTable`, boş durum `EmptyState`,
 *    form alanları `FormField` + `DS.input`, hata `ErrorBanner`, durum rozeti
 *    `StatusBadge` ortak primitive'lerine taşındı.
 *  - Form `<h2>` başlığı ve etiketler eklendi (önceden yalnızca placeholder
 *    vardı; ekran okuyucu alanları isimlendiremiyordu).
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorDisplay';
import { FormField } from '@/components/ui/FormField';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';
import { DS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

export interface CampaignRow {
  id: string;
  name: string;
  campaignType: string;
  status: string;
  subject: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  scheduledAt: string | null;
  createdAt: string;
  _count: { executions: number };
}

/** Campaign statüsü → rozet etiketi + tonu (tek eşleme). */
const STATUS_META: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: 'Taslak', tone: 'neutral' },
  scheduled: { label: 'Zamanlandı', tone: 'info' },
  running: { label: 'Çalışıyor', tone: 'success' },
  completed: { label: 'Tamamlandı', tone: 'brand' },
  paused: { label: 'Duraklatıldı', tone: 'warning' },
};

const CAMPAIGN_TYPES = [
  { value: 'drip', label: 'Drip' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'behavioral', label: 'Behavioral' },
];

const DEFAULT_TEMPLATE = '<p>Merhaba {{name}}, hoş geldiniz!</p>';

export function CampaignList({ campaigns }: { campaigns: CampaignRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    campaignType: 'drip',
    subject: '',
    template: DEFAULT_TEMPLATE,
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? 'Kampanya oluşturulamadı');
        return;
      }

      setForm({ name: '', campaignType: 'drip', subject: '', template: DEFAULT_TEMPLATE });
      setShowForm(false);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kampanya oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || isPending;

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Email Kampanyaları"
        description="Drip, broadcast ve behavioral email kampanyaları"
        breadcrumb={<span>Admin / Kampanyalar</span>}
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            aria-controls="campaign-create-form"
            className={cn(
              'admin-btn',
              showForm ? 'admin-btn-secondary' : 'admin-btn-primary',
            )}
          >
            {showForm ? (
              <>
                <FaTimes aria-hidden="true" className="w-3 h-3" />
                Kapat
              </>
            ) : (
              <>
                <FaPlus aria-hidden="true" className="w-3 h-3" />
                Yeni Kampanya
              </>
            )}
          </button>
        }
      />

      {showForm && (
        <DashboardSection title="Yeni Kampanya" padding="lg">
          <form id="campaign-create-form" onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id="campaign-name" label="Kampanya adı" required>
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={DS.input}
                  />
                )}
              </FormField>

              <FormField id="campaign-type" label="Kampanya tipi">
                {(fieldProps) => (
                  <select
                    {...fieldProps}
                    value={form.campaignType}
                    onChange={(e) => setForm({ ...form, campaignType: e.target.value })}
                    className={DS.input}
                  >
                    {CAMPAIGN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </div>

            <FormField id="campaign-subject" label="Email konusu" required>
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  required
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={DS.input}
                />
              )}
            </FormField>

            <FormField
              id="campaign-template"
              label="HTML şablon"
              required
              helperText="{{name}} gibi değişkenler gönderim sırasında doldurulur."
            >
              {(fieldProps) => (
                <textarea
                  {...fieldProps}
                  required
                  value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                  rows={5}
                  className={cn(DS.input, 'resize-y font-mono text-sm')}
                />
              )}
            </FormField>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <div className="flex justify-end">
              <button type="submit" disabled={busy} className="admin-btn admin-btn-primary">
                {busy ? (
                  <>
                    <ButtonSpinner size="small" />
                    Oluşturuluyor…
                  </>
                ) : (
                  'Oluştur'
                )}
              </button>
            </div>
          </form>
        </DashboardSection>
      )}

      <DashboardSection padding={campaigns.length === 0 ? 'md' : 'none'} contained>
        {campaigns.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="inbox"
            title="Henüz kampanya yok"
            description="İlk email kampanyanızı oluşturarak başlayın."
            action={{ label: 'Yeni Kampanya', onClick: () => setShowForm(true) }}
          />
        ) : (
          <ResponsiveTable
            minWidth="820px"
            caption="Email kampanyaları: ad, tip, durum, gönderim/açılma/tıklama sayıları ve tarih"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Ad</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Tip</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Durum</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Gönderim</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Açılma</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Tıklama</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const meta = STATUS_META[c.status] ?? { label: c.status, tone: 'neutral' as StatusTone };
                return (
                  <tr
                    key={c.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium text-foreground">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.subject}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge size="sm" tone="neutral" label={c.campaignType} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge size="sm" tone={meta.tone} dot label={meta.label} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.totalSent}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.totalOpened}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.totalClicked}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}
