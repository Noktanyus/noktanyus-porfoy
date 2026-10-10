import { describe, it, expect } from 'vitest';
import { validateUblXml, parseUblInvoiceSummary, SAMPLE_UBL_XML } from '../ubl';
import { calculateGrossToNet, calculateNetToGross } from '../extras';

describe('validateUblXml', () => {
  it('accepts minimal Invoice skeleton', () => {
    const xml = `<?xml version="1.0"?>
      <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
        xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
        xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
        <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
        <cbc:ID>ABC2026000000001</cbc:ID>
        <cbc:IssueDate>2026-10-09</cbc:IssueDate>
        <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
        <cac:AccountingSupplierParty></cac:AccountingSupplierParty>
        <cac:AccountingCustomerParty></cac:AccountingCustomerParty>
        <cac:LegalMonetaryTotal></cac:LegalMonetaryTotal>
        <cac:InvoiceLine></cac:InvoiceLine>
      </Invoice>`;
    const r = validateUblXml({ xml });
    expect(r.ok).toBe(true);
    expect(r.documentType).toBe('Invoice');
    expect(r.invoiceId).toBe('ABC2026000000001');
  });

  it('flags missing parties', () => {
    const r = validateUblXml({
      xml: '<Invoice><cbc:ID>1</cbc:ID><cbc:IssueDate>2026-01-01</cbc:IssueDate><cbc:ProfileID>X</cbc:ProfileID></Invoice>',
    });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.path.includes('AccountingSupplierParty'))).toBe(true);
  });

  it('validates SAMPLE_UBL_XML and parses invoice summary', () => {
    const r = validateUblXml({ xml: SAMPLE_UBL_XML });
    expect(r.ok).toBe(true);
    expect(r.invoiceId).toBe('NOK2026000000042');
    expect(r.profileId).toBe('TICARIFATURA');

    const summary = parseUblInvoiceSummary(SAMPLE_UBL_XML);
    expect(summary.invoiceId).toBe('NOK2026000000042');
    expect(summary.supplierVkn).toBe('1234567890');
    expect(summary.customerVkn).toBe('9876543210');
    expect(summary.payableAmount).toBe(1200);
    expect(summary.taxAmount).toBe(200);
    expect(summary.currency).toBe('TRY');
    expect(summary.lineCount).toBe(1);
  });
});

describe('calculateGrossToNet', () => {
  it('deducts sgk and yields net below gross', () => {
    const r = calculateGrossToNet({ monthlyGrossCents: 5_000_000, monthIndex: 1 });
    expect(r.sgkEmployeeCents).toBe(700_000);
    expect(r.unemploymentEmployeeCents).toBe(50_000);
    expect(r.netCents).toBeLessThan(r.monthlyGrossCents);
    expect(r.netCents).toBeGreaterThan(0);
  });
});

describe('calculateNetToGross', () => {
  it('round-trips near target net', () => {
    const target = 3_500_000;
    const r = calculateNetToGross({ monthlyNetCents: target, monthIndex: 1 });
    expect(Math.abs(r.computedNetCents - target)).toBeLessThan(200);
    expect(r.monthlyGrossCents).toBeGreaterThan(target);
  });
});
