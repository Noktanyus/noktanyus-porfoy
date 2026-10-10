import { describe, it, expect } from 'vitest';
import {
  REPLAYABLE_DELIVERY_STATUSES,
  isReplayableDeliveryStatus,
  formatDeliveryStatusTr,
  formatDeliveryAttemptsTr,
  formatDeliveryLastError,
} from '../deliveryUi';

describe('deliveryUi helpers', () => {
  it('marks failed / retrying / dead-letter as replayable', () => {
    for (const status of REPLAYABLE_DELIVERY_STATUSES) {
      expect(isReplayableDeliveryStatus(status)).toBe(true);
    }
    expect(isReplayableDeliveryStatus('SUCCESS')).toBe(false);
    expect(isReplayableDeliveryStatus('PENDING')).toBe(false);
  });

  it('formats delivery status in Turkish', () => {
    expect(formatDeliveryStatusTr('SUCCESS')).toBe('Başarılı');
    expect(formatDeliveryStatusTr('FAILED')).toBe('Başarısız');
    expect(formatDeliveryStatusTr('RETRYING')).toBe('Yeniden deneniyor');
    expect(formatDeliveryStatusTr('DEAD_LETTER')).toBe('Dead letter');
    expect(formatDeliveryStatusTr('PENDING')).toBe('Bekliyor');
    expect(formatDeliveryStatusTr('CUSTOM')).toBe('CUSTOM');
  });

  it('formats attempt counts', () => {
    expect(formatDeliveryAttemptsTr(3, 5)).toBe('3/5 deneme');
    expect(formatDeliveryAttemptsTr(2)).toBe('2 deneme');
    expect(formatDeliveryAttemptsTr(0)).toBe('0 deneme');
    expect(formatDeliveryAttemptsTr(-1)).toBe('0 deneme');
  });

  it('prefers errorMessage then HTTP status for last error', () => {
    expect(formatDeliveryLastError('Connection refused', 502)).toBe('Connection refused');
    expect(formatDeliveryLastError('  ', 503)).toBe('HTTP 503');
    expect(formatDeliveryLastError(null, 500)).toBe('HTTP 500');
    expect(formatDeliveryLastError(undefined, null)).toBe('Hata ayrıntısı yok');
  });
});
