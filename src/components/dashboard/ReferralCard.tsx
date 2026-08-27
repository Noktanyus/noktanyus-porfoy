'use client';

/**
 * Referral Card
 *
 * Kullanicinin referral kodunu gosterir, kopyalama ve paylasma
 * imkani saglar. Arkadas davet ettik Kazan seklinde.
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaCopy, FaGift, FaShare } from 'react-icons/fa';

interface ReferralData {
  referralCode: string | null;
  stats: {
    count: number;
    earned: number;
  };
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/referral')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success && d.data) {
          setData({
            referralCode: d.data.referralCode ?? null,
            stats: d.data.stats ?? { count: 0, earned: 0 },
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = () => {
    if (!data?.referralCode) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://noktanyus.com'}?ref=${data.referralCode}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Link kopyalandı'))
      .catch(() => toast.error('Kopyalama başarısız'));
  };

  const share = async () => {
    if (!data?.referralCode) return;
    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://noktanyus.com'}?ref=${data.referralCode}`;
    const text = 'Arkadaşlarını davet et, birlikte kazanın!';

    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({ title: 'Davet', text, url });
      } catch {
        // Kullanıcı paylaşımı iptal etti — sessizce geç
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="glass-card-premium p-6 animate-pulse">
        <div className="h-6 w-1/2 bg-muted rounded mb-4" />
        <div className="h-4 w-full bg-muted rounded mb-2" />
        <div className="h-10 w-full bg-muted rounded" />
      </div>
    );
  }

  if (!data?.referralCode) {
    return (
      <div className="glass-card-premium p-6">
        <div className="flex items-center gap-2 mb-2">
          <FaGift className="text-primary" />
          <h2 className="text-lg font-bold">Arkadaşlarını Davet Et</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Davet sistemi şu anda kullanılamıyor.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-premium p-6">
      <div className="flex items-center gap-2 mb-3">
        <FaGift className="text-primary" />
        <h2 className="text-lg font-bold">Arkadaşlarını Davet Et</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Referans kodun ile arkadaşlarını davet et. Her başarılı kayıt için indirim kazan.
      </p>

      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
        <code className="flex-1 font-mono text-sm truncate">{data.referralCode}</code>
        <button
          onClick={copyLink}
          className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          aria-label="Referans linkini kopyala"
          type="button"
        >
          <FaCopy />
        </button>
        <button
          onClick={share}
          className="px-3 py-1 rounded bg-secondary text-secondary-foreground text-sm hover:bg-secondary/90 transition-colors"
          aria-label="Paylaş"
          type="button"
        >
          <FaShare />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 bg-muted/50 rounded">
          <p className="text-2xl font-bold">{data.stats.count}</p>
          <p className="text-xs text-muted-foreground">Davet</p>
        </div>
        <div className="p-3 bg-muted/50 rounded">
          <p className="text-2xl font-bold text-green-600">
            ₺{(data.stats.earned / 100).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Kazanç</p>
        </div>
      </div>
    </div>
  );
}

export default ReferralCard;
