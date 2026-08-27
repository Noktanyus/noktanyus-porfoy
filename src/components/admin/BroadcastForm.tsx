'use client';

/**
 * Admin — Newsletter Broadcast Form
 *
 * Tüm doğrulanmış + aktif abonelere email gönderir.
 * - Hazır şablonlar (template chips)
 * - Konu + HTML içerik
 * - Karakter sayacı (50.000 üst sınır)
 * - HTML önizleme
 * - Onay modalı (window.confirm)
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaEye, FaMagic } from 'react-icons/fa';

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'new-blog',
    name: 'Yeni Blog Yazısı',
    subject: 'Yeni blog yazımız yayında!',
    html: `<h2 style="color:#0078D4;margin:0 0 16px 0;">Yeni Blog Yazısı</h2>
<p>Merhaba,</p>
<p>Sitemize yeni bir blog yazısı ekledik. Hemen okumak için aşağıdaki butona tıklayabilirsin:</p>
<p style="margin:24px 0;">
  <a href="https://noktanyus.com/blog" style="display:inline-block;padding:12px 24px;background:#0078D4;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Yazıyı Oku</a>
</p>
<p>İyi okumalar!</p>
<p>— Noktanyus Ekibi</p>`,
  },
  {
    id: 'product-launch',
    name: 'Yeni Ürün',
    subject: 'Yeni ürün mağazada!',
    html: `<h2 style="color:#0078D4;margin:0 0 16px 0;">Yeni Ürün Lansmanı</h2>
<p>Merhaba,</p>
<p>Yeni bir dijital ürün ekledik. Hemen incelemek için:</p>
<p style="margin:24px 0;">
  <a href="https://noktanyus.com/magaza" style="display:inline-block;padding:12px 24px;background:#0078D4;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Mağazaya Git</a>
</p>
<p>— Noktanyus Ekibi</p>`,
  },
  {
    id: 'tips',
    name: 'İpuçları',
    subject: 'Haftalık ipuçları',
    html: `<h2 style="color:#0078D4;margin:0 0 16px 0;">Bu Hafta Öne Çıkanlar</h2>
<p>Merhaba,</p>
<p>Bu hafta en çok okunan yazılarımız ve yeni içeriklerimizi sizin için derledik.</p>
<p style="margin:24px 0;">
  <a href="https://noktanyus.com/blog" style="display:inline-block;padding:12px 24px;background:#0078D4;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Tüm Yazılar</a>
</p>
<p>— Noktanyus Ekibi</p>`,
  },
];

const MAX_HTML = 50_000;

export function BroadcastForm() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const characterCount = useMemo(() => html.length, [html]);
  const overLimit = characterCount > MAX_HTML;

  const applyTemplate = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setSubject(template.subject);
    setHtml(template.html);
    toast.success(`'${template.name}' şablonu uygulandı`);
  };

  const handleSend = async () => {
    if (!subject.trim() || !html.trim()) {
      toast.error('Konu ve içerik gerekli');
      return;
    }
    if (overLimit) {
      toast.error(`İçerik ${MAX_HTML} karakter sınırını aşıyor`);
      return;
    }
    if (
      !window.confirm(
        'Tüm doğrulanmış abonelere email gönderilecek. Bu işlem geri alınamaz. Emin misiniz?'
      )
    ) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Broadcast gönderiliyor...');

    try {
      const res = await fetch('/api/admin/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), html }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.error?.message ?? 'Gönderim başarısız';
        toast.error(msg, { id: toastId });
        return;
      }

      const { sent, failed, total } = data.data as {
        sent: number;
        failed: number;
        total: number;
      };

      if (failed === 0) {
        toast.success(`${sent} / ${total} aboneye başarıyla gönderildi`, { id: toastId });
      } else {
        toast.error(`${sent} başarılı, ${failed} başarısız (toplam ${total})`, { id: toastId });
      }

      // Form'u temizle ve geri dön
      setSubject('');
      setHtml('');
      router.push('/admin/newsletter');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="glass-card-premium p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaMagic className="text-brand-primary" />
          <h2 className="text-sm font-semibold">Hazır Şablonlar</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Hızlı başlangıç — sonra özelleştirebilirsin
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand-primary text-left text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card-premium p-6 space-y-5">
        <div>
          <label
            htmlFor="broadcast-subject"
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Konu <span className="text-red-500">*</span>
          </label>
          <input
            id="broadcast-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            className="admin-input"
            placeholder="Yeni blog yazımız yayında!"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {subject.length} / 200
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="broadcast-html"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              İçerik (HTML) <span className="text-red-500">*</span>
            </label>
            <span
              className={`text-xs ${overLimit ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {characterCount.toLocaleString('tr-TR')} / {MAX_HTML.toLocaleString('tr-TR')}
            </span>
          </div>
          <textarea
            id="broadcast-html"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            required
            rows={14}
            maxLength={MAX_HTML}
            className="admin-input font-mono text-xs resize-y"
            placeholder="<h2>Başlık</h2><p>İçerik...</p>"
            disabled={loading}
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Inline style kullan — birçok email istemcisi &lt;style&gt; tag&apos;ini kırpıyor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            disabled={!html || loading}
            className="admin-btn admin-btn-secondary"
          >
            <FaEye className="mr-2" />
            {preview ? 'Önizlemeyi Kapat' : 'Önizle'}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !subject.trim() || !html.trim() || overLimit}
            className="admin-btn admin-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="mr-2" />
            {loading ? 'Gönderiliyor...' : 'Tüm Abonelere Gönder'}
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && html && (
        <div className="glass-card-premium p-6">
          <h2 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Önizleme
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            <strong>Konu:</strong> {subject || '(boş)'}
          </p>
          <div
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white text-gray-900 overflow-auto"
            style={{ maxHeight: '480px' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}