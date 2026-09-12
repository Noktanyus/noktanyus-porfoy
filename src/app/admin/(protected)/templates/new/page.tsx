/**
 * @file Admin — Yeni Template Oluşturma Sayfası
 * @description Phase 3 B.3: Bos initial state ile TemplateForm render.
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import TemplateForm from '@/components/admin/TemplateForm';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Yeni Template | Admin',
};

export default async function NewTemplatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris');
  if (session.user.role !== 'admin') redirect('/');

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Yeni Template
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Yeni bir template listing oluşturun. Slug, vitrin URL'sinde kalıcı olacaktır.
        </p>
      </div>

      <TemplateForm />
    </div>
  );
}
