'use client';

import { useEffect } from 'react';
import { useCart } from '@/stores/cartStore';

/** Ödeme başarı sayfasında sepeti temizler (ödeme tamamlanmadan sepet silinmesin). */
export function CartClearOnSuccess() {
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
