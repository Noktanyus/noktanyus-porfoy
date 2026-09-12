/**
 * @file Admin — Template Düzenleme Sayfası
 * @description Phase 3 B.3: Template'i ID ile bulup TemplateForm'a initial data olarak aktarır.
 *              Silme islemi TemplateForm'un altindaki "Delete" butonu ile yapilir.
 */

import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import TemplateForm, { templateToFormData } from '@/components/admin/TemplateForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { FaArrowLeft } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Template Düzenle | Admin',
};

interface PageProps {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  if (session.user.role !== 'admin') redirect('/');

  let template;
  let error: string | null = null;

  try {
    template = await prisma.templateListing.findUnique({
      where: { id: params.id },
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Template yüklenemedi';
  }

  if (error) {
    return <ErrorDisplay title="Template Yüklenemedi" message={error} />;
  }
  if (!template) {
    notFound();
  }

  const initial = templateToFormData(template);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <FaArrowLeft className="w-3 h-3" />
          Template listesine dön
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Template'i Düzenle
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {template.name} <span className="text-xs">/{template.slug}</span>
            </p>
          </div>
          <DeleteButton
            endpoint={`/api/admin/templates/${template.id}`}
            confirmMessage={`"${template.name}" template'ini silmek istediğinize emin misiniz? Pasif duruma getirilir ve vitrinde görünmez.`}
            itemName={template.name}
            className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100"
          />
        </div>
      </div>

      <TemplateForm template={initial} />
    </div>
  );
}
