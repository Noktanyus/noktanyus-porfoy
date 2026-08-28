'use client';

/**
 * Custom Report Builder — Client Component
 *
 * Phase: G3 Custom Report Builder
 * - Form-based report builder (drag & drop yerine basit form)
 * - Report tipi + format + alici + zamanlama secimi
 * - Mevcut raporlarin listesi (calistir / sil)
 * - Son calistirma sonucu gosterimi (cached lastRunResult)
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaChartBar,
  FaPlus,
  FaPlay,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaCalendarAlt,
  FaEnvelope,
  FaClock,
} from 'react-icons/fa';
import { formatDateTime } from '@/lib/utils';

interface CustomReport {
  id: string;
  name: string;
  description: string | null;
  reportType: string;
  config: any;
  schedule: string | null;
  recipients: string[];
  format: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastRunResult: any;
  createdAt: string;
}

const REPORT_TYPES = [
  { value: 'orders', label: 'Siparişler' },
  { value: 'users', label: 'Kullanıcılar' },
  { value: 'monitors', label: 'Monitörler' },
  { value: 'revenue', label: 'Gelir' },
];

const REPORT_FORMATS = [
  { value: 'table', label: 'Tablo' },
  { value: 'bar', label: 'Çubuk Grafik' },
  { value: 'line', label: 'Çizgi Grafik' },
  { value: 'pie', label: 'Pasta Grafik' },
];

const SCHEDULES = [
  { value: '', label: 'Manuel' },
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
];

const SCHEDULE_LABEL: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
};

export function ReportBuilder({ initialReports }: { initialReports: CustomReport[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [resultModal, setResultModal] = useState<{
    name: string;
    result: any;
    runAt: string;
  } | null>(null);
  const [form, setForm] = useState({
    name: '',
    reportType: 'orders',
    format: 'table',
    schedule: '',
    recipients: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const recipients = form.recipients
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/user/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          reportType: form.reportType,
          config: {},
          format: form.format,
          schedule: form.schedule || undefined,
          recipients,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? 'Rapor oluşturulamadı');
      }
      toast.success('Rapor oluşturuldu');
      setShowForm(false);
      setForm({
        name: '',
        reportType: 'orders',
        format: 'table',
        schedule: '',
        recipients: '',
        description: '',
      });
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (report: CustomReport) => {
    setExecutingId(report.id);
    try {
      const res = await fetch(`/api/user/reports/${report.id}/execute`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? 'Rapor çalıştırılamadı');
      }
      toast.success('Rapor çalıştırıldı');
      setResultModal({
        name: report.name,
        result: data.data.result,
        runAt: new Date().toISOString(),
      });
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu rapor kalıcı olarak silinsin mi?')) return;
    try {
      const res = await fetch(`/api/user/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message ?? 'Silinemedi');
      }
      toast.success('Rapor silindi');
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    }
  };

  const showResult = (report: CustomReport) => {
    if (!report.lastRunResult) return;
    setResultModal({
      name: report.name,
      result: report.lastRunResult,
      runAt: report.lastRunAt ?? new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaChartBar className="text-brand-primary" />
            Özel Raporlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kendi raporlarını oluştur, zamanlı çalıştır veya manuel tetikle.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="admin-btn admin-btn-primary"
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? 'Kapat' : 'Yeni Rapor'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-card-premium p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FaPlus className="text-brand-primary" />
            Yeni Rapor Tanımı
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">İsim *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="admin-input"
              placeholder="Örn: Aylık Gelir Raporu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Açıklama (opsiyonel)</label>
            <input
              type="text"
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="admin-input"
              placeholder="Raporun amacı..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Veri Kaynağı *</label>
              <select
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                className="admin-input"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Format</label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="admin-input"
              >
                {REPORT_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaCalendarAlt className="text-xs text-muted-foreground" />
              Zamanlama
            </label>
            <select
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              className="admin-input"
            >
              {SCHEDULES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaEnvelope className="text-xs text-muted-foreground" />
              Alıcılar (virgülle, opsiyonel)
            </label>
            <input
              type="text"
              value={form.recipients}
              onChange={(e) => setForm({ ...form, recipients: e.target.value })}
              className="admin-input"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
            >
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="admin-btn admin-btn-secondary"
            >
              İptal
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      {initialReports.length === 0 ? (
        <div className="glass-card-premium p-12 text-center">
          <FaChartBar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="font-medium">Henüz raporunuz yok</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yukarıdaki &quot;Yeni Rapor&quot; butonuyla başlayın.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialReports.map((r) => {
            const isExecuting = executingId === r.id;
            return (
              <div key={r.id} className="glass-card-premium p-5">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{r.name}</h3>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted whitespace-nowrap">
                    {r.reportType}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {r.schedule && (
                    <p className="flex items-center gap-1.5">
                      <FaCalendarAlt />
                      Zamanlama: <strong className="text-foreground">{SCHEDULE_LABEL[r.schedule] ?? r.schedule}</strong>
                    </p>
                  )}
                  {Array.isArray(r.recipients) && r.recipients.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <FaEnvelope />
                      {r.recipients.length} alıcı
                    </p>
                  )}
                  {r.lastRunAt && (
                    <p className="flex items-center gap-1.5">
                      <FaClock />
                      Son çalıştırma: {formatDateTime(r.lastRunAt)}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <FaCheckCircle className={r.lastRunResult ? 'text-green-500' : ''} />
                    Format: {REPORT_FORMATS.find((f) => f.value === r.format)?.label ?? r.format}
                  </p>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => handleExecute(r)}
                    disabled={isExecuting}
                    className="admin-btn admin-btn-primary text-xs flex-1"
                  >
                    <FaPlay />
                    {isExecuting ? 'Çalışıyor...' : 'Çalıştır'}
                  </button>
                  {r.lastRunResult && (
                    <button
                      onClick={() => showResult(r)}
                      className="admin-btn admin-btn-secondary text-xs"
                    >
                      Sonuç
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="admin-btn text-xs text-destructive hover:bg-destructive/10"
                    title="Sil"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setResultModal(null)}
        >
          <div
            className="glass-card-premium p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FaChartBar className="text-brand-primary" />
                  {resultModal.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(resultModal.runAt)}
                </p>
              </div>
              <button
                onClick={() => setResultModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs overflow-auto max-h-96">
              <pre>{JSON.stringify(resultModal.result, null, 2)}</pre>
            </div>

            <button
              onClick={() => setResultModal(null)}
              className="w-full mt-4 admin-btn admin-btn-primary"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}