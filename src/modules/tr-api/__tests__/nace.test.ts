import { describe, it, expect } from 'vitest';
import { searchNace, getNaceByCode, NACE_CATALOG } from '../nace';

describe('NACE Kodu & İSG Tehlike Sınıfı Modülü', () => {
  it('NACE_CATALOG zengin ve eksiksiz olmalı', () => {
    expect(NACE_CATALOG.length).toBeGreaterThan(15);
    const software = NACE_CATALOG.find((n) => n.code === '62.01.01');
    expect(software).toBeDefined();
    expect(software?.name).toContain('Bilgisayar programlama');
    expect(software?.dangerLevel).toBe('az_tehlikeli');
  });

  it('Yazılım ve e-ticaret araması doğru NACE kodlarını getirmeli', () => {
    const yazilimResults = searchNace('yazılım');
    expect(yazilimResults.length).toBeGreaterThan(0);
    expect(yazilimResults.some((n) => n.code === '62.01.01')).toBe(true);

    const eticaretResults = searchNace('e-ticaret');
    expect(eticaretResults.some((n) => n.code === '47.91.14')).toBe(true);
  });

  it('Tehlike sınıfı filtrelemesi doğru çalışmalı', () => {
    const cokTehlikeli = searchNace('', { dangerLevel: 'cok_tehlikeli' });
    expect(cokTehlikeli.length).toBeGreaterThan(0);
    expect(cokTehlikeli.every((n) => n.dangerLevel === 'cok_tehlikeli')).toBe(true);
  });

  it('Kod ile doğrudan lookup çalışmalı (noktalı veya düz)', () => {
    const withDots = getNaceByCode('62.01.01');
    expect(withDots).not.toBeNull();
    expect(withDots?.code).toBe('62.01.01');

    const withoutDots = getNaceByCode('620101');
    expect(withoutDots).not.toBeNull();
    expect(withoutDots?.code).toBe('62.01.01');

    const notFound = getNaceByCode('999999');
    expect(notFound).toBeNull();
  });
});
