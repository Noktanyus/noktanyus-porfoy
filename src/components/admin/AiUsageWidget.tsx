/**
 * @file AI Usage Widget — Admin dashboard için aylık AI token kullanım widget'ı.
 * @description Sprint 1: Server component, prisma'dan direkt aggregate sorgusu.
 *              Tailwind bar chart (recharts eklemeden), sıfır bağımlılık.
 */

import { prisma } from '@/lib/prisma';
import { getCurrentMonthUsage } from '@/lib/planGate';

interface AiUsageWidgetProps {
  /** Gösterilecek kullanıcı sayısı (top consumers listesi). Default 5. */
  topUsersLimit?: number;
}

export async function AiUsageWidget({ topUsersLimit = 5 }: AiUsageWidgetProps) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [totalUsage, byFeature, topUsers, totalCalls] = await Promise.all([
    prisma.aiUsage.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, costCents: true },
    }),
    prisma.aiUsage.groupBy({
      by: ['feature'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true },
      _count: { id: true },
    }),
    prisma.aiUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true },
      _count: { id: true },
      orderBy: { _sum: { totalTokens: 'desc' } },
      take: topUsersLimit,
    }),
    prisma.aiUsage.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  const totalTokens = totalUsage._sum.totalTokens ?? 0;
  const totalCost = totalUsage._sum.costCents ?? 0;

  // userId → email eşlemesi (top users için)
  const userIds = topUsers.map((u) => u.userId);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // En yüksek token bar genişliği için referans
  const maxUserTokens = topUsers.length ? topUsers[0]._sum.totalTokens ?? 0 : 1;

  return (
    <div className="admin-card">
      <header className="admin-header">
        <h2 className="admin-title">AI Kullanımı (Bu Ay)</h2>
        <p className="admin-subtitle">
          {totalCalls} istek · {totalTokens.toLocaleString('tr-TR')} token · tahmini{' '}
          {(totalCost / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
        </p>
      </header>

      {totalCalls === 0 ? (
        <div className="py-8 text-center text-slate-500 dark:text-gray-400">
          <p className="text-4xl mb-2" aria-hidden="true">🤖</p>
          <p>Henüz AI kullanımı yok. Blog yazma veya ürün açıklaması üretmeyi deneyin.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Feature breakdown */}
          {byFeature.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Feature Bazlı
              </h3>
              <div className="space-y-2">
                {byFeature.map((f) => {
                  const tokens = f._sum.totalTokens ?? 0;
                  const pct = totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;
                  return (
                    <div key={f.feature} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-700 dark:text-slate-300">{f.feature}</span>
                        <span className="text-slate-500 tabular-nums">
                          {f._count.id} istek · {tokens.toLocaleString('tr-TR')} token
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                          aria-label={`${f.feature}: ${pct.toFixed(1)}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top consumers */}
          {topUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                En Çok Kullananlar (Top {topUsersLimit})
              </h3>
              <div className="space-y-2">
                {topUsers.map((u) => {
                  const tokens = u._sum.totalTokens ?? 0;
                  const pct = maxUserTokens > 0 ? (tokens / maxUserTokens) * 100 : 0;
                  const user = userMap.get(u.userId);
                  return (
                    <div key={u.userId} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-700 dark:text-slate-300 truncate min-w-0">
                          {user?.name ?? user?.email ?? u.userId.slice(0, 8)}
                        </span>
                        <span className="text-slate-500 tabular-nums ml-2 shrink-0">
                          {u._count.id} istek · {tokens.toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-brand-primary"
                          style={{ width: `${pct}%` }}
                          aria-label={`${user?.email ?? u.userId}: ${pct.toFixed(1)}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
