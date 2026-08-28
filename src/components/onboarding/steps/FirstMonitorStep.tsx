/**
 * FirstMonitorStep — ilk monitör oluşturmak için mini form.
 * POST /api/monitors ile entegre.
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaArrowRight, FaSatelliteDish } from 'react-icons/fa';

interface FirstMonitorStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const MONITOR_TYPES = [
  { value: 'HTTPS', label: 'HTTPS' },
  { value: 'HTTP', label: 'HTTP' },
  { value: 'PING', label: 'PING' },
  { value: 'JSON', label: 'JSON API' },
] as const;

export function FirstMonitorStep({ onNext, onSkip }: FirstMonitorStepProps) {
  const [url, setUrl] = useState('https://');
  const [type, setType] = useState<(typeof MONITOR_TYPES)[number]['value']>('HTTPS');
  const [name, setName] = useState('İlk monitör');
  const [pending, setPending] = useState(false);

  const handleSubmit = async () => {
    if (!url || url === 'https://') {
      toast.error('Lütfen geçerli bir URL gir');
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, type, intervalSec: 60 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || 'Monitör oluşturulamadı');
      }
      toast.success('İlk monitör oluşturuldu!');
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3 text-primary">
        <FaSatelliteDish className="w-8 h-8" />
        <p className="text-sm text-muted-foreground">
          Web siteni veya API&apos;ni izlemeye başla
        </p>
      </div>

      <div>
        <label htmlFor="mon-name" className="block text-sm font-medium mb-1">
          Monitör adı
        </label>
        <input
          id="mon-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Ana sayfa"
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="mon-url" className="block text-sm font-medium mb-1">
          URL
        </label>
        <input
          id="mon-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tip</label>
        <div className="grid grid-cols-4 gap-2">
          {MONITOR_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                type === t.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          disabled={pending}
          className="flex-1 admin-btn admin-btn-outline"
        >
          Atla
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="flex-1 admin-btn admin-btn-primary"
        >
          {pending ? 'Ekleniyor...' : 'İzle'} <FaArrowRight className="ml-2 inline" />
        </button>
      </div>
    </div>
  );
}

export default FirstMonitorStep;
