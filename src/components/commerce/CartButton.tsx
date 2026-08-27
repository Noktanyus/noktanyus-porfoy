'use client';

import { useState } from 'react';
import { useCart } from '@/stores/cartStore';
import { CartDrawer } from './CartDrawer';

export function CartButton() {
  const [open, setOpen] = useState(false);
  const itemCount = useCart((s) => s.itemCount());

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:scale-110 focus-ring"
        aria-label={`Sepet (${itemCount} ürün)`}
      >
        <span className="text-xl" aria-hidden="true">
          🛒
        </span>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {open && <CartDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
