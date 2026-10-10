import { describe, it, expect } from 'vitest';
import {
  searchTaxOffices,
  getTaxOfficeByCode,
  listTaxOfficesByProvince,
  generateUblTaxSchemeSnippet,
  TAX_OFFICES,
} from '../taxOffices';

describe('GİB Vergi Daireleri (Tax Offices) Modülü', () => {
  it('TAX_OFFICES veritabanı boş olmamalı ve gerekli alanları içermelidir', () => {
    expect(TAX_OFFICES.length).toBeGreaterThan(50);
    const kadikoy = TAX_OFFICES.find((t) => t.code === '034262');
    expect(kadikoy).toBeDefined();
    expect(kadikoy?.name).toBe('Kadıköy Vergi Dairesi Müdürlüğü');
    expect(kadikoy?.provinceName).toBe('İstanbul');
    expect(kadikoy?.district).toBe('Kadıköy');
  });

  it('Türkçe karakter duyarsız arama (fuzzy search) doğru sonuç vermelidir', () => {
    // "kadikoy" araması "Kadıköy"ü bulmalıdır
    const results = searchTaxOffices('kadikoy');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Kadıköy');

    // "bogazici" -> "Boğaziçi"
    const bogazici = searchTaxOffices('bogazici');
    expect(bogazici.some((t) => t.name.includes('Boğaziçi'))).toBe(true);

    // "cankaya" -> "Çankaya"
    const cankaya = searchTaxOffices('cankaya');
    expect(cankaya.some((t) => t.name.includes('Çankaya'))).toBe(true);
  });

  it('İl filtreleme doğru çalışmalıdır', () => {
    const ankaraOffices = searchTaxOffices('', { provinceCode: '06' });
    expect(ankaraOffices.length).toBeGreaterThan(10);
    expect(ankaraOffices.every((t) => t.provinceCode === '06')).toBe(true);

    const izmirList = listTaxOfficesByProvince('35');
    expect(izmirList.length).toBeGreaterThan(10);
    expect(izmirList.every((t) => t.provinceCode === '35')).toBe(true);
  });

  it('Vergi dairesi kodu ile doğrudan lookup çalışmalıdır', () => {
    const office = getTaxOfficeByCode('034262');
    expect(office).not.toBeNull();
    expect(office?.name).toBe('Kadıköy Vergi Dairesi Müdürlüğü');

    // 5 haneli kısa kod ile de bulabilmeli
    const shortLookup = getTaxOfficeByCode('34262');
    expect(shortLookup).not.toBeNull();
    expect(shortLookup?.code).toBe('034262');

    const notFound = getTaxOfficeByCode('999999');
    expect(notFound).toBeNull();
  });

  it('UBL-TR e-Fatura XML parçacığı geçerli XML şeması üretmelidir', () => {
    const office = getTaxOfficeByCode('034262')!;
    const snippet = generateUblTaxSchemeSnippet(office);
    expect(snippet).toContain('<cac:PartyTaxScheme>');
    expect(snippet).toContain('<cbc:Name>Kadıköy Vergi Dairesi Müdürlüğü</cbc:Name>');
    expect(snippet).toContain('<cbc:TaxTypeCode listAgencyID="GIB" listID="VERGİ DAİRESİ KODU">034262</cbc:TaxTypeCode>');
    expect(snippet).toContain('</cac:PartyTaxScheme>');
  });
});
