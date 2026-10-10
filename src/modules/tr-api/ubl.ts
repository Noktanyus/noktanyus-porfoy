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

export interface UblInvoiceSummary {
  invoiceId: string | null;
  issueDate: string | null;
  profileId: string | null;
  invoiceTypeCode: string | null;
  currency: string | null;
  supplierName: string | null;
  supplierVkn: string | null;
  customerName: string | null;
  customerVkn: string | null;
  lineExtensionAmount: number | null;
  taxAmount: number | null;
  payableAmount: number | null;
  lineCount: number;
}

/**
 * UBL faturasının temel ticari alanlarını ayrıştırır
 */
export function parseUblInvoiceSummary(xml: string): UblInvoiceSummary {
  const invoiceId = tagText(xml, 'ID');
  const issueDate = tagText(xml, 'IssueDate');
  const profileId = tagText(xml, 'ProfileID');
  const invoiceTypeCode = tagText(xml, 'InvoiceTypeCode');
  const currency = tagText(xml, 'DocumentCurrencyCode');

  // Supplier & Customer extraction
  const supplierMatch = xml.match(/<cac:AccountingSupplierParty[\s\S]*?<\/cac:AccountingSupplierParty>/i);
  const supplierXml = supplierMatch ? supplierMatch[0] : '';
  const supplierName = tagText(supplierXml, 'RegistrationName') || tagText(supplierXml, 'FamilyName');
  const supplierVkn = tagText(supplierXml, 'VKN') || tagText(supplierXml, 'TCKN') || tagText(supplierXml, 'ID');

  const customerMatch = xml.match(/<cac:AccountingCustomerParty[\s\S]*?<\/cac:AccountingCustomerParty>/i);
  const customerXml = customerMatch ? customerMatch[0] : '';
  const customerName = tagText(customerXml, 'RegistrationName') || tagText(customerXml, 'FamilyName');
  const customerVkn = tagText(customerXml, 'VKN') || tagText(customerXml, 'TCKN') || tagText(customerXml, 'ID');

  // Totals
  const parseNum = (str: string | null) => (str ? parseFloat(str.replace(/,/g, '.')) || null : null);
  const lineExtensionAmount = parseNum(tagText(xml, 'LineExtensionAmount'));
  const taxAmount = parseNum(tagText(xml, 'TaxAmount'));
  const payableAmount = parseNum(tagText(xml, 'PayableAmount'));
  const lineCount = countTags(xml, 'InvoiceLine');

  return {
    invoiceId,
    issueDate,
    profileId,
    invoiceTypeCode,
    currency,
    supplierName,
    supplierVkn,
    customerName,
    customerVkn,
    lineExtensionAmount,
    taxAmount,
    payableAmount,
    lineCount,
  };
}

export const SAMPLE_UBL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>NOK2026000000042</cbc:ID>
  <cbc:IssueDate>2026-10-10</cbc:IssueDate>
  <cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>1</cbc:LineCountNumeric>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">1234567890</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Noktanyus Bulut Teknolojileri A.Ş.</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:CitySubdivisionName>Kadıköy</cbc:CitySubdivisionName>
        <cbc:CityName>İstanbul</cbc:CityName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>Kadıköy Vergi Dairesi Müdürlüğü</cbc:Name>
          <cbc:TaxTypeCode listAgencyID="GIB">034262</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">9876543210</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Örnek Müşteri Yazılım Ltd. Şti.</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:CitySubdivisionName>Çankaya</cbc:CitySubdivisionName>
        <cbc:CityName>Ankara</cbc:CityName>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="TRY">200.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="TRY">1000.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="TRY">200.00</cbc:TaxAmount>
      <cbc:Percent>20</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="TRY">1000.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="TRY">1000.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="TRY">1200.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="TRY">1200.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="TRY">1000.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>SaaS Bulut API Aboneliği - 1 Yıllık</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="TRY">1000.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>`;

