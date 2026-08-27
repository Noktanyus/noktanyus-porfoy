/**
 * @file Admin Audit Log Viewer (sunucu tarafı)
 * @description Admin panelinden yapılan kritik işlemleri listeleyen sayfa.
 *              Audit verileri `auditService` üzerinden DB'den çekilir.
 */

import { auditService } from '@/modules/admin/audit';
import { AuditClientPage } from '@/components/admin/AuditClientPage';

// Her istekte yeniden render — DB'den canlı veri çekmek için
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * URL parametrelerini normalize eder.
 */
function getFilters(searchParams: PageProps['searchParams']) {
  const get = (k: string) => {
    const v = searchParams[k];
    return typeof v === 'string' && v.length > 0 ? v : undefined;
  };

  const page = Math.max(1, parseInt(get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(200, Math.max(10, parseInt(get('pageSize') ?? '50', 10) || 50));

  return {
    action: get('action'),
    resource: get('resource'),
    userId: get('userId'),
    status: get('status'),
    page,
    pageSize,
  };
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const filters = getFilters(searchParams);

  const [paginated, stats] = await Promise.all([
    auditService.paginate(filters),
    auditService.getStats(),
  ]);

  // Serialize edilemeyecek alanları sadeleştir
  const items = paginated.items.map((log) => ({
    id: log.id,
    userId: log.userId,
    userEmail: log.userEmail,
    action: log.action,
    resource: log.resource,
    resourceId: log.resourceId,
    details: log.details as Record<string, unknown> | null,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    status: log.status,
    errorMessage: log.errorMessage,
    timestamp: log.timestamp.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Denetim Kayıtları (Audit Log)</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Admin panelinden yapılan kritik işlemlerin kayıtları. Toplam{' '}
        <strong>{stats.total}</strong> kayıt, bugün <strong>{stats.today}</strong> işlem,
        başarısız işlem sayısı <strong className="text-red-600">{stats.failures}</strong>.
      </p>

      <AuditClientPage
        items={items}
        total={paginated.total}
        page={paginated.page}
        pageSize={paginated.pageSize}
        totalPages={paginated.totalPages}
        stats={stats}
        currentFilters={{
          action: filters.action ?? '',
          resource: filters.resource ?? '',
          userId: filters.userId ?? '',
          status: filters.status ?? '',
        }}
      />
    </div>
  );
}
