'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { DS } from '@/lib/design-system';
import { TIP_PRESETS_TRY } from '@/lib/tipPresets';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

interface TipJarProps {
  variant?: 'compact' | 'card';
  className?: string;
}

export function TipJar({ variant = 'card', className = '' }: TipJarProps) {
  const [amountTry, setAmountTry] = useState<number>(TIP_PRESETS_TRY[1]);
  const [custom, setCustom] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paytrPayload, setPaytrPayload] = useState<PaytrFormPayload | null>(null);

  const resolvedAmount = custom ? Number(custom) : amountTry;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !Number.isFinite(resolvedAmount) || resolvedAmount < 10) {
      toast.error('Geçerli e-posta ve en az ₺10 tutar gerekli');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountTry: Math.round(resolvedAmount),
          customerEmail: email,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          message: message || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Ödeme başlatılamadı');
      }
      const data = json.data;
      if (data.url && (data.mock || !data.fields)) {
        window.location.href = data.url;
        return;
      }
      if (data.fields && data.formAction) {
        setPaytrPayload({
          formAction: data.formAction,
          fields: data.fields,
          orderNumber: data.orderNumber,
        });
        setLoading(false);
        return;
      }
      throw new Error('PayTR form yanıtı eksik');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  };

  if (paytrPayload) {
    return (
      <div className={className}>
        <PaytrCardForm payload={paytrPayload} onCancel={() => setPaytrPayload(null)} />
      </div>
    );
  }

  const inner = (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS_TRY.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setAmountTry(preset);
              setCustom('');
            }}
            className={`min-h-[44px] px-4 rounded-xl text-sm font-semibold border transition-colors ${
              !custom && amountTry === preset
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-border text-foreground hover:border-brand-primary/40'
            }`}
          >
            ₺{preset}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-muted-foreground mb-1 block">Özel tutar (₺)</span>
          <input
            type="number"
            min={10}
            max={5000}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className={DS.input}
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground mb-1 block">E-posta *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={DS.input}
          />
        </label>
      </div>

      {variant === 'card' && (
        <>
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">Ad (opsiyonel)</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={DS.input} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">Telefon (opsiyonel)</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={DS.input} />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground mb-1 block">Mesaj (opsiyonel)</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={500}
              className={DS.input}
            />
          </label>
        </>
      )}

      <button type="submit" disabled={loading} className={`${DS.button.primary} w-full px-6`}>
        {loading ? 'Hazırlanıyor…' : `PayTR ile Destek · ₺${Math.round(resolvedAmount) || '—'}`}
      </button>
      <p className="text-xs text-center text-muted-foreground">
        Güvenli ödeme PayTR ile. Kart bilgileriniz sitemizde tutulmaz.
      </p>
    </form>
  );

  if (variant === 'compact') {
    return <div className={className}>{inner}</div>;
  }

  return (
    <div className={`glass-card-premium p-6 sm:p-8 ${className}`}>
      <h2 className="text-xl font-bold mb-2 text-foreground">Projeyi Destekle</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tek seferlik destek — PayTR üzerinden güvenli ödeme.
      </p>
      {inner}
    </div>
  );
}

export default TipJar;
