/**
 * StoreStep — kullanıcıyı mağazaya yönlendirir, plana abone olmayı önerir.
 * Direkt navigasyon ile ilerler.
 */

'use client';

import Link from 'next/link';
import { FaStore, FaArrowRight, FaCheck } from 'react-icons/fa';

interface StoreStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const PERKS = [
  'Tüm dijital ürünlere tek tıkla erişim',
  'Plan bazlı ek kredi ve kota',
  'İndirimli bundle kampanyaları',
];

export function StoreStep({ onNext, onSkip }: StoreStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3 text-primary">
        <FaStore className="w-8 h-8" />
      </div>

      <p className="text-center text-muted-foreground text-sm">
        Dijital ürünler, abonelik planları ve daha fazlasını keşfet
      </p>

      <ul className="space-y-2">
        {PERKS.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm">
            <FaCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 admin-btn admin-btn-outline"
        >
          Atla
        </button>
        <Link
          href="/magaza"
          className="flex-1 admin-btn admin-btn-primary text-center"
        >
          Mağazaya Git <FaArrowRight className="ml-2 inline" />
        </Link>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Turu tamamla →
      </button>
    </div>
  );
}

export default StoreStep;
