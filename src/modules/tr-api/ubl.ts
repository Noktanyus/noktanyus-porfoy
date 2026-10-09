/**
 * UBL-TR e-fatura / e-arşiv XML yapısal doğrulama (şema XSD değil).
 * GİB imza/zarf doğrulaması yapmaz; entegrasyon öncesi hızlı lint.
 */

export interface UblValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface UblValidationResult {
  ok: boolean;
  documentType: 'Invoice' | 'ApplicationResponse' | 'Unknown' | null;
  profileId: string | null;
  invoiceId: string | null;
  issueDate: string | null;
  issues: UblValidationIssue[];
}

function tagText(xml: string, localName: string): string | null {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${localName}(?:\\s[^>]*)?>([^<]*)</(?:[A-Za-z0-9_]+:)?${localName}>`,
    'i'
  );
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

function hasTag(xml: string, localName: string): boolean {
  const re = new RegExp(`<(?:[A-Za-z0-9_]+:)?${localName}[\\s>]`, 'i');
  return re.test(xml);
}

function countTags(xml: string, localName: string): number {
  const re = new RegExp(`<(?:[A-Za-z0-9_]+:)?${localName}[\\s>]`, 'gi');
  return (xml.match(re) ?? []).length;
}

export function validateUblXml(input: { xml: string }): UblValidationResult {
  const xml = (input.xml ?? '').trim();
  const issues: UblValidationIssue[] = [];

  if (!xml) {
    return {
      ok: false,
      documentType: null,
      profileId: null,
      invoiceId: null,
      issueDate: null,
      issues: [{ path: '/', message: 'XML boş', severity: 'error' }],
    };
  }

  if (!xml.includes('<') || !xml.includes('>')) {
    return {
      ok: false,
      documentType: null,
      profileId: null,
      invoiceId: null,
      issueDate: null,
      issues: [{ path: '/', message: 'Geçersiz XML içeriği', severity: 'error' }],
    };
  }

  let documentType: UblValidationResult['documentType'] = 'Unknown';
  if (hasTag(xml, 'Invoice')) documentType = 'Invoice';
  else if (hasTag(xml, 'ApplicationResponse')) documentType = 'ApplicationResponse';

  if (documentType === 'Unknown') {
    issues.push({
      path: '/',
      message: 'Invoice veya ApplicationResponse kök elemanı bulunamadı',
      severity: 'error',
    });
  }

  const profileId = tagText(xml, 'ProfileID');
  const invoiceId = tagText(xml, 'ID');
  const issueDate = tagText(xml, 'IssueDate');

  if (documentType === 'Invoice') {
    if (!profileId) {
      issues.push({ path: 'cbc:ProfileID', message: 'ProfileID eksik', severity: 'error' });
    }
    if (!invoiceId) {
      issues.push({ path: 'cbc:ID', message: 'Fatura ID eksik', severity: 'error' });
    }
    if (!issueDate) {
      issues.push({ path: 'cbc:IssueDate', message: 'IssueDate eksik', severity: 'error' });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) {
      issues.push({
        path: 'cbc:IssueDate',
        message: 'IssueDate YYYY-MM-DD olmalı',
        severity: 'warning',
      });
    }

    if (!hasTag(xml, 'AccountingSupplierParty')) {
      issues.push({
        path: 'cac:AccountingSupplierParty',
        message: 'Satıcı (AccountingSupplierParty) eksik',
        severity: 'error',
      });
    }
    if (!hasTag(xml, 'AccountingCustomerParty')) {
      issues.push({
        path: 'cac:AccountingCustomerParty',
        message: 'Alıcı (AccountingCustomerParty) eksik',
        severity: 'error',
      });
    }
    if (!hasTag(xml, 'LegalMonetaryTotal')) {
      issues.push({
        path: 'cac:LegalMonetaryTotal',
        message: 'LegalMonetaryTotal eksik',
        severity: 'error',
      });
    }
    const lines = countTags(xml, 'InvoiceLine');
    if (lines < 1) {
      issues.push({
        path: 'cac:InvoiceLine',
        message: 'En az bir InvoiceLine gerekli',
        severity: 'error',
      });
    }

    if (!hasTag(xml, 'DocumentCurrencyCode')) {
      issues.push({
        path: 'cbc:DocumentCurrencyCode',
        message: 'DocumentCurrencyCode önerilir (TRY)',
        severity: 'warning',
      });
    }
  }

  const ok = issues.every((i) => i.severity !== 'error');
  return { ok, documentType, profileId, invoiceId, issueDate, issues };
}
