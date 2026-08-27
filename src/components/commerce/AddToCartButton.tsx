'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '@/stores/cartStore';
import type { DigitalProduct } from '@prisma/client';

export function AddToCartButton({ product }: { product: DigitalProduct }) {
  const addItem = useCart((s) => s.addItem);
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    setLoading(true);
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      priceCents: product.priceCents,
      thumbnail: product.thumbnail ?? undefined,
    });
    toast.success('Sepete eklendi!');
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Ekleniyor...' : '🛒 Sepete Ekle'}
    </button>
  );
}
