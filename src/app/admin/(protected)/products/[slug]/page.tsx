import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminProductForm } from '@/components/admin/AdminProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminEditProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.digitalProduct.findUnique({ where: { slug: params.slug } });
  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ürünü Düzenle</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">/{product.slug}</p>
      <AdminProductForm
        product={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          shortDescription: product.shortDescription,
          description: product.description,
          thumbnail: product.thumbnail,
          fileUrl: product.fileUrl,
          fileName: product.fileName,
          fileSize: product.fileSize,
          priceCents: product.priceCents,
          category: product.category,
          technologies: Array.isArray(product.technologies)
            ? (product.technologies as string[])
            : [],
          version: product.version,
          active: product.active,
          featured: product.featured,
        }}
      />
    </div>
  );
}
