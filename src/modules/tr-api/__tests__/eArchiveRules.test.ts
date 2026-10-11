import { describe, it, expect } from 'vitest';
import {
  checkEArchiveRequirement,
  searchVatExemptionCodes,
  OFFICIAL_THRESHOLDS,
  VAT_EXEMPTION_CODES,
} from '../eArchiveRules';

describe('GİB E-Archive Threshold & VAT Exemption Engine', () => {
  it('should correctly flag mandatory e-archive when taxpayer exceeds 5000 TL', () => {
    // 6.000 TL fatura kesiliyor (vergi mükellefine)
    const res = checkEArchiveRequirement({
      totalAmountIncludingVat: 6000,
      recipientType: 'taxpayer',
    });

    expect(res.evaluatedTotalAmount).toBe(6000);
    expect(res.thresholdLimit).toBe(5000);
    expect(res.isEArchiveMandatory).toBe(true);
    expect(res.remainingLimit).toBe(0);
    expect(res.recommendedInvoiceType).toBe('e_archive_portal');
    expect(res.legalNotice.status).toBe('mandatory');
  });

  it('should allow paper invoice when below 5000 TL for taxpayer', () => {
    // 4.500 TL fatura
    const res = checkEArchiveRequirement({
      totalAmountIncludingVat: 4500,
      recipientType: 'taxpayer',
    });

    expect(res.isEArchiveMandatory).toBe(false);
    expect(res.remainingLimit).toBe(500);
    expect(res.recommendedInvoiceType).toBe('paper_or_e_archive');
    expect(res.legalNotice.status).toBe('optional');
  });

  it('should flag mandatory when same day multiple invoices sum exceeds limit for consumer (3000 TL)', () => {
    // Tüketiciye 2.000 TL + önceki fatura 1.500 TL = 3.500 TL
    const res = checkEArchiveRequirement({
      totalAmountIncludingVat: 2000,
      sameDayPreviousInvoicesTotal: 1500,
      recipientType: 'consumer',
    });

    expect(res.evaluatedTotalAmount).toBe(3500);
    expect(res.thresholdLimit).toBe(3000);
    expect(res.isEArchiveMandatory).toBe(true);
  });

  it('should search VAT exemption codes correctly', () => {
    const exports = searchVatExemptionCodes('ihracat');
    expect(exports.length).toBeGreaterThanOrEqual(2);
    expect(exports.some(e => e.code === '301')).toBe(true); // Mal ihracatı
    expect(exports.some(e => e.code === '302')).toBe(true); // Hizmet ihracatı

    const technopark = searchVatExemptionCodes('teknokent');
    expect(technopark.length).toBeGreaterThanOrEqual(1);
    expect(technopark[0].code).toBe('321');
  });
});
