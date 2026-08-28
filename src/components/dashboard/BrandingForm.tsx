'use client';

/**
 * @file BrandingForm — workspace branding güncelleme formu.
 * @description
 *   - Color picker: preset renkler + custom hex
 *   - Logo/favicon URL input
 *   - Custom domain input + DNS doğrulama butonu
 *   - White-label enable toggle
 *   - PATCH /api/workspaces/[id]/branding
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPalette, FaImage, FaGlobe, FaSave, FaCheckCircle } from 'react-icons/fa';
import { brandingService } from '@/modules/workspaces/brandingService';
import type { WorkspaceBranding } from '@/modules/workspaces/brandingService';

interface BrandingFormProps {
  workspaceId: string;
  initial: WorkspaceBranding;
}

const COLOR_PRESETS = Object.entries(brandingService.presets);

export function BrandingForm({ workspaceId, initial }: BrandingFormProps) {
  const [brandColor, setBrandColor] = useState(initial.brandColor);
  const [customHex, setCustomHex] = useState('');
  const [brandLogo, setBrandLogo] = useState(initial.brandLogo ?? '');
  const [brandFavicon, setBrandFavicon] = useState(initial.brandFavicon ?? '');
  const [customDomain, setCustomDomain] = useState(initial.customDomain ?? '');
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(initial.whiteLabelEnabled);
  const [pending, setPending] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<
    'idle' | 'checking' | 'verified' | 'failed'
  >('idle');
  const [dnsMessage, setDnsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customHex && brandColor in brandingService.presets) {
      // preset seçildiğinde hex input'u temizle
    }
  }, [brandColor, customHex]);

  const handleSubmit = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandColor: customHex || brandColor,
          brandLogo: brandLogo || null,
          brandFavicon: brandFavicon || null,
          customDomain: customDomain || null,
          whiteLabelEnabled,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || 'Branding güncellenemedi');
      }
      toast.success('Branding güncellendi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setPending(false);
    }
  };

  const handleCheckDns = async () => {
    if (!customDomain) {
      toast.error('Önce bir domain gir');
      return;
    }
    setDnsStatus('checking');
    setDnsMessage(null);
    try {
      const res = await fetch(`/api/custom-domain/${encodeURIComponent(customDomain)}`);
      const data = await res.json();
      if (data.success && data.verified) {
        setDnsStatus('verified');
        setDnsMessage(data.instructions);
        toast.success('Domain formatı doğrulandı');
      } else {
        setDnsStatus('failed');
        setDnsMessage(data.reason || 'Doğrulama başarısız');
        toast.error(data.reason || 'Doğrulama başarısız');
      }
    } catch {
      setDnsStatus('failed');
      setDnsMessage('Ağ hatası');
      toast.error('DNS kontrol edilemedi');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Brand Color */}
      <section className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <FaPalette /> Marka Rengi
        </h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map(([key, hex]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setBrandColor(key);
                setCustomHex('');
              }}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                brandColor === key && !customHex
                  ? 'border-foreground scale-110'
                  : 'border-white/30'
              }`}
              style={{ backgroundColor: hex }}
              aria-label={`Renk ${key}`}
              title={key}
            />
          ))}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customHex || (brandingService.presets[brandColor] ?? '#000000')}
              onChange={(e) => {
                setCustomHex(e.target.value);
                setBrandColor(e.target.value);
              }}
              className="w-9 h-9 rounded-full cursor-pointer border-0 bg-transparent"
              aria-label="Özel renk seç"
            />
            {customHex && (
              <span className="text-xs font-mono">{customHex}</span>
            )}
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <FaImage /> Logo URL
        </h3>
        <input
          type="url"
          value={brandLogo}
          onChange={(e) => setBrandLogo(e.target.value)}
          placeholder="https://example.com/logo.svg"
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </section>

      {/* Favicon */}
      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <FaImage /> Favicon URL
        </h3>
        <input
          type="url"
          value={brandFavicon}
          onChange={(e) => setBrandFavicon(e.target.value)}
          placeholder="https://example.com/favicon.ico"
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </section>

      {/* Custom domain */}
      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <FaGlobe /> Custom Domain
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="status.example.com"
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleCheckDns}
            disabled={dnsStatus === 'checking'}
            className="admin-btn admin-btn-outline flex items-center gap-2"
          >
            {dnsStatus === 'checking' ? 'Kontrol ediliyor...' : 'DNS Doğrula'}
            {dnsStatus === 'verified' && <FaCheckCircle className="text-green-500" />}
          </button>
        </div>
        {dnsMessage && (
          <p
            className={`text-xs ${
              dnsStatus === 'verified' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {dnsMessage}
          </p>
        )}
      </section>

      {/* White label toggle */}
      <section className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
        <input
          id="wl"
          type="checkbox"
          checked={whiteLabelEnabled}
          onChange={(e) => setWhiteLabelEnabled(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="wl" className="text-sm flex-1 cursor-pointer">
          <strong>White-label modu</strong>
          <span className="block text-xs text-muted-foreground">
            &quot;Powered by Noktanyus&quot; etiketini gizle, sadece kendi marka görünsün.
          </span>
        </label>
      </section>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="admin-btn admin-btn-primary flex items-center gap-2"
      >
        <FaSave />
        {pending ? 'Kaydediliyor...' : 'Kaydet'}
      </button>
    </div>
  );
}

export default BrandingForm;
