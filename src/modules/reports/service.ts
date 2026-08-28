/**
 * Custom Report Service
 *
 * Phase: G3 Custom Report Builder
 * - Kullanicinin kendi raporlarini olusturup yonetmesi
 * - Rapor tiplerine gore query dispatch
 * - Execution history (timing + result cache)
 * - Zamanlanmis calistirma (schedule + recipients)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NotFoundError, UnauthorizedError } from '@/modules/shared/errors';

export type ReportType = 'orders' | 'users' | 'monitors' | 'revenue';
export type ReportFormat = 'table' | 'bar' | 'line' | 'pie';
export type ReportSchedule = 'daily' | 'weekly' | 'monthly';
export type ExecutionStatus = 'running' | 'success' | 'failed';

export interface CreateReportInput {
  name: string;
  description?: string;
  reportType: ReportType | string;
  config?: Record<string, any>;
  schedule?: ReportSchedule | null;
  recipients?: string[];
  format?: ReportFormat;
}

export interface ReportExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  result: any;
  durationMs: number;
  errorMessage?: string;
}

export const reportService = {
  /**
   * Kullanicinin olusturdugu raporlari listele (yeniden eskiye).
   */
  async list(userId: string) {
    return prisma.customReport.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * ID ile tek rapor getir.
   */
  async getById(id: string) {
    const report = await prisma.customReport.findUnique({
      where: { id },
    });
    if (!report) throw new NotFoundError('Rapor');
    return report;
  },

  /**
   * Yeni rapor olustur.
   */
  async create(userId: string, input: CreateReportInput) {
    const report = await prisma.customReport.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        reportType: input.reportType,
        config: input.config ?? {},
        schedule: input.schedule ?? null,
        recipients: input.recipients ?? [],
        format: input.format ?? 'table',
        createdById: userId,
      },
    });
    logger.info('Custom report created', {
      reportId: report.id,
      userId,
      reportType: report.reportType,
    });
    return report;
  },

  /**
   * Raporu calistir — execution history'ye yaz, sonucu cache'le.
   */
  async execute(reportId: string): Promise<ReportExecutionResult> {
    const report = await prisma.customReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundError('Rapor');

    const startTime = Date.now();
    const execution = await prisma.reportExecution.create({
      data: { reportId, status: 'running' },
    });

    let result: any = {};
    let errorMessage: string | undefined;
    let status: ExecutionStatus = 'success';

    try {
      result = await this.runQuery(report);
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'success',
          result,
          durationMs: Date.now() - startTime,
        },
      });
      await prisma.customReport.update({
        where: { id: reportId },
        data: { lastRunAt: new Date(), lastRunResult: result },
      });
      logger.info('Custom report executed', {
        reportId,
        executionId: execution.id,
        durationMs: Date.now() - startTime,
      });
    } catch (err: any) {
      errorMessage = err?.message ?? 'Bilinmeyen hata';
      status = 'failed';
      await prisma.reportExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errorMessage,
          durationMs: Date.now() - startTime,
        },
      });
      logger.error('Custom report execution failed', {
        reportId,
        executionId: execution.id,
        error: errorMessage,
      });
    }

    return {
      executionId: execution.id,
      status,
      result,
      durationMs: Date.now() - startTime,
      ...(errorMessage ? { errorMessage } : {}),
    };
  },

  /**
   * Report type'a gore query dispatch.
   */
  async runQuery(report: any): Promise<any> {
    switch (report.reportType) {
      case 'orders':
        return prisma.order.findMany({
          where: {
            status: 'PAID',
            ...(report.config?.dateRange || {}),
          },
          take: 1000,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            totalCents: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        });

      case 'users':
        return prisma.user.findMany({
          take: 1000,
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'monitors':
        return prisma.monitor.findMany({
          take: 1000,
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
            uptimePct30d: true,
            lastCheckedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });

      case 'revenue': {
        const aggregate = await prisma.order.aggregate({
          where: { status: 'PAID' },
          _sum: { totalCents: true },
          _count: { _all: true },
          _avg: { totalCents: true },
        });
        return {
          totalRevenueCents: aggregate._sum.totalCents ?? 0,
          orderCount: aggregate._count._all ?? 0,
          averageOrderCents: aggregate._avg.totalCents ?? 0,
        };
      }

      default:
        return [];
    }
  },

  /**
   * Raporu sil — sadece sahibi.
   */
  async delete(id: string, userId: string) {
    const report = await prisma.customReport.findUnique({ where: { id } });
    if (!report) throw new NotFoundError('Rapor');
    if (report.createdById !== userId) {
      throw new UnauthorizedError('Bu raporu silme yetkiniz yok');
    }
    await prisma.customReport.delete({ where: { id } });
    logger.info('Custom report deleted', { reportId: id, userId });
    return { id, deleted: true };
  },

  /**
   * Bir raporun son N execution kaydini getir.
   */
  async getExecutions(reportId: string, limit = 20) {
    return prisma.reportExecution.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};