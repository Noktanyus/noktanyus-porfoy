/**
 * Webhook delivery UI helpers — saf (DB/fetch yok).
 * Dashboard etiketleri ve replay uygunluğu.
 */

export const REPLAYABLE_DELIVERY_STATUSES = [
  'FAILED',
  'RETRYING',
  'DEAD_LETTER',
] as const;

export type ReplayableDeliveryStatus = (typeof REPLAYABLE_DELIVERY_STATUSES)[number];

const REPLAYABLE_SET = new Set<string>(REPLAYABLE_DELIVERY_STATUSES);

const STATUS_TR: Record<string, string> = {
  PENDING: 'Bekliyor',
  SUCCESS: 'Başarılı',
  FAILED: 'Başarısız',
  RETRYING: 'Yeniden deneniyor',
  DEAD_LETTER: 'Dead letter',
};

export function isReplayableDeliveryStatus(status: string): boolean {
  return REPLAYABLE_SET.has(status);
}

export function formatDeliveryStatusTr(status: string): string {
  return STATUS_TR[status] ?? status;
}

export function formatDeliveryAttemptsTr(
  attempts: number,
  maxAttempts?: number | null
): string {
  const n = Number.isFinite(attempts) ? Math.max(0, Math.floor(attempts)) : 0;
  if (maxAttempts != null && Number.isFinite(maxAttempts)) {
    return `${n}/${Math.floor(maxAttempts)} deneme`;
  }
  return `${n} deneme`;
}

/** Son hata metni — errorMessage yoksa HTTP koduna düş. */
export function formatDeliveryLastError(
  errorMessage: string | null | undefined,
  responseStatus?: number | null
): string {
  const trimmed = errorMessage?.trim();
  if (trimmed) return trimmed;
  if (responseStatus != null) return `HTTP ${responseStatus}`;
  return 'Hata ayrıntısı yok';
}
