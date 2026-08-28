/**
 * ApiKeyStep — ilk API anahtarını oluşturmak için mini form.
 * POST /api/user/api-keys ile entegre. Yanıtta dönen ham anahtar gösterilir.
 */

'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCopy, FaKey, FaArrowRight } from 'react-icons/fa';

interface ApiKeyStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const SCOPES = [
  { id: 'read:monitor', label: 'Okuma' },
  { id: 'write:monitor', label: 'Yazma' },
  { id: 'read:user', label: 'Kullanıcı' },
];

export function ApiKeyStep({ onNext, onSkip }: ApiKeyStepProps) {
  const [name, setName] = useState('İlk API Key');
  const [scopes, setScopes] = useState<string[]>(['read:monitor']);
  const [rateLimit, setRateLimit] = useState(60);
  const [pending, setPending] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const toggleScope = (id: string) => {
    setScopes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Anahtar adı gerekli');
      return;
    }
    setPending(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, scopes, rateLimit }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || 'Anahtar oluşturulamadı');
      }
      const data = await res.json();
      const key: string = data?.data?.key ?? '';
      setCreatedKey(key);
      toast.success('Anahtar oluşturuldu! Kopyalamayı unutma.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setPending(false);
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      toast.success('Panoya kopyalandı');
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  if (createdKey) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-2 text-primary">
          <FaKey className="w-6 h-6" />
          <p className="text-sm">Anahtarın hazır!</p>
        </div>
        <div className="bg-black/40 rounded-lg p-3 flex items-center gap-2">
          <code className="flex-1 text-xs text-green-400 overflow-hidden text-ellipsis whitespace-nowrap">
            {createdKey}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-md hover:bg-white/10"
            aria-label="Kopyala"
          >
            <FaCopy />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Bu anahtarı şimdi kaydet. Bir daha gösterilmeyecek.
        </p>
        <button
          type="button"
          onClick={onNext}
          className="w-full admin-btn admin-btn-primary"
        >
          Devam <FaArrowRight className="ml-2 inline" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3 text-primary">
        <FaKey className="w-8 h-8" />
      </div>

      <div>
        <label htmlFor="key-name" className="block text-sm font-medium mb-1">
          Anahtar adı
        </label>
        <input
          id="key-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Production"
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">İzinler</label>
        <div className="grid grid-cols-3 gap-2">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleScope(s.id)}
              className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                scopes.includes(s.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="key-rate" className="block text-sm font-medium mb-1">
          Rate limit (req/min)
        </label>
        <input
          id="key-rate"
          type="number"
          min={1}
          max={10000}
          value={rateLimit}
          onChange={(e) => setRateLimit(Number(e.target.value) || 60)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
          {pending ? 'Oluşturuluyor...' : 'Oluştur'}
        </button>
      </div>
    </div>
  );
}

export default ApiKeyStep;
