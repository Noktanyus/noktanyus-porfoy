/**
 * Admin — Newsletter Broadcast Sayfası
 *
 * Tüm doğrulanmış abonelere email gönderim ekranı.
 * Server component, force-dynamic (admin auth her zaman güncel olmalı).
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { BroadcastForm } from '@/components/admin/BroadcastForm';
import { FaArrowLeft } from 'react-icons/fa';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Broadcast | Admin' };

export default function BroadcastPage() {
  return (
    <div className="admin-content-spacing">
      <div className="admin-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-primary mb-2 transition-colors"
          >
            <FaArrowLeft /> Abonelere dön
          </Link>
          <h1 className="admin-title">Newsletter Broadcast</h1>
          <p className="admin-subtitle">
            Tüm doğrulanmış ve aktif abonelere email gönder
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <BroadcastForm />
      </div>
    </div>
  );
}