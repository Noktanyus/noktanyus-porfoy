/**
 * @file Dashboard — Yeni Ürün Ekleme Sayfası
 * @description Kullanıcıların SaaS marketplace'a kendi dijital ürünlerini
 *              yüklemelerini sağlar. Auth zorunlu.
 *
 * Form: NewProductForm (client component)
 * API: POST /api/user/products
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NewProductForm } from '@/components/dashboard/NewProductForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Yeni Ürün | Dashboard' };

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Yeni Ürün Ekle</h1>
        <p className="text-sm text-muted-foreground">
          Mağazada yayınlayacağın bir dijital ürün oluştur
        </p>
      </div>
      <NewProductForm />
    </div>
  );
}