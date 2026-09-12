'use client';

/**
 * ComplianceSiteActions — Tarama başlat + PDF rapor indir (API'ye form POST yok).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaPlay, FaFileDownload } from 'react-icons/fa';

interface ComplianceSiteActionsProps {
  siteId: string;
  workspaceId: string;
}

export function ComplianceSiteActions({ siteId, workspaceId }: ComplianceSiteActionsProps) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const startScan = async () => {
    setScanning(true);
    const toastId = toast.loading('Tarama başlatılıyor…');
    try {
      const res = await fetch(`/api/compliance/sites/${siteId}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error?.message ?? 'Tarama başlatılamadı');
      }
      toast.success('Tarama başlatıldı', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setScanning(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    const toastId = toast.loading('Rapor hazırlanıyor…');
    try {
      const url = `/api/compliance/sites/${siteId}/report.pdf?workspaceId=${encodeURIComponent(workspaceId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        let message = 'Rapor indirilemedi';
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          const json = await res.json().catch(() => null);
          message = json?.error?.message ?? message;
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const disposition = res.headers.get('content-disposition');
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      a.download = match?.[1] ?? `compliance-report-${siteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Rapor indirildi', { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İndirme hatası', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={startScan}
        disabled={scanning}
        className="admin-btn admin-btn-primary min-h-[44px] disabled:opacity-60"
      >
        <FaPlay className="w-3 h-3" aria-hidden="true" />
        {scanning ? 'Başlatılıyor…' : 'Tarama Başlat'}
      </button>
      <button
        type="button"
        onClick={downloadReport}
        disabled={downloading}
        className="admin-btn min-h-[44px] disabled:opacity-60"
      >
        <FaFileDownload className="w-3 h-3" aria-hidden="true" />
        {downloading ? 'İndiriliyor…' : 'Rapor İndir'}
      </button>
    </div>
  );
}

export default ComplianceSiteActions;
