/**
 * API Scopes Catalog
 *
 * Noktanyus API platformundaki tüm endpoint'ler ve izinlerin (scopes)
 * kategorize edilmiş eksiksiz listesi.
 */

export type ApiScopeCategoryKey =
  | 'tr_official'
  | 'finance'
  | 'labor'
  | 'invoice'
  | 'calendar'
  | 'geo'
  | 'banking'
  | 'global_identity'
  | 'securities'
  | 'supply_chain'
  | 'logistics'
  | 'network_tech'
  | 'publishing'
  | 'security_crypto'
  | 'algorithms'
  | 'broad';

export interface ApiScopeCategoryInfo {
  id: ApiScopeCategoryKey;
  name: string;
  description: string;
}

export const API_SCOPE_CATEGORIES: Record<ApiScopeCategoryKey, ApiScopeCategoryInfo> = {
  broad: {
    id: 'broad',
    name: 'Geniş Kapsam & Yönetim',
    description: 'Tüm veya geniş kapsamlı API yetkilendirmeleri',
  },
  tr_official: {
    id: 'tr_official',
    name: 'TR Kimlik, Resmi & İletişim',
    description: 'TCKN, VKN, IBAN, telefon, plaka ve resmi sicil doğrulamaları',
  },
  finance: {
    id: 'finance',
    name: 'Finans, Vergi & Muhasebe',
    description: 'KDV, tevkifat, döviz, alacaklı referansı ve e-ticaret hesaplamaları',
  },
  labor: {
    id: 'labor',
    name: 'İş Kanunu & Bordro',
    description: 'Kıdem ve ihbar tazminatı yasal hesaplama motoru',
  },
  invoice: {
    id: 'invoice',
    name: 'Fatura & Belge Üretimi',
    description: 'PDF fatura, teklif ve makbuz oluşturma servisleri',
  },
  calendar: {
    id: 'calendar',
    name: 'Resmi Takvim, Süreler & Tatiller',
    description: 'İş günleri, resmi tatiller, tebligat süreleri ve BIST takvimi',
  },
  geo: {
    id: 'geo',
    name: 'Coğrafi Bilgi & Adres',
    description: 'Türkiye il, ilçe, posta kodu ve serbest metin adres ayrıştırma',
  },
  banking: {
    id: 'banking',
    name: 'Banka, Kart & Ödeme Standartları',
    description: 'Luhn kart no, BIN tespiti, SWIFT/BIC ve yabancı banka hesapları',
  },
  global_identity: {
    id: 'global_identity',
    name: 'Uluslararası Kimlik & Vergi',
    description: 'AB VAT, Brezilya CPF/CNPJ, İspanya DNI ve Hindistan Aadhaar',
  },
  securities: {
    id: 'securities',
    name: 'Menkul Kıymetler & Kodlar',
    description: 'ISIN, FIGI, SEDOL, CUSIP, LEI ve MIC borsa kodları',
  },
  supply_chain: {
    id: 'supply_chain',
    name: 'GS1, Barkod & Tedarik Zinciri',
    description: 'GTIN, GLN, SSCC, GSRN, GSIN barkod ve lojistik etiketleri',
  },
  logistics: {
    id: 'logistics',
    name: 'Taşımacılık & Araç Standartları',
    description: 'VIN şasi no, konteyner, IMO gemi, IATA/ICAO havalimanı ve AWB',
  },
  network_tech: {
    id: 'network_tech',
    name: 'Ağ, Web & Geliştirici Standartları',
    description: 'E-posta, global telefon, URL, IP, MAC, UUID, port ve SemVer',
  },
  publishing: {
    id: 'publishing',
    name: 'Yayıncılık & Akademik',
    description: 'ISBN, ISSN, DOI, ORCID ve ISNI tanımlayıcıları',
  },
  security_crypto: {
    id: 'security_crypto',
    name: 'Pasaport & Kripto Varlıklar',
    description: 'Pasaport MRZ, kimlik seri no, Bitcoin ve Ethereum cüzdan kontrolü',
  },
  algorithms: {
    id: 'algorithms',
    name: 'Algoritmik Kontroller & Standartlar',
    description: 'Damm, Verhoeff, ISO 7064, ISO ülke ve dil standartları',
  },
};

export interface ApiScopeItem {
  id: string;
  label: string;
  description: string;
  category: ApiScopeCategoryKey;
  endpoint?: string;
  dangerous?: boolean;
  isLegacy?: boolean;
}

export const API_SCOPES_CATALOG: ApiScopeItem[] = [
  // ─── Geniş Kapsam & Yönetim ───
  {
    id: 'admin',
    label: 'Tam Yetki (Tüm API’ler)',
    description: 'Platformdaki tüm mevcut ve gelecekteki API uç noktalarına sınırsız erişim.',
    category: 'broad',
    dangerous: true,
  },
  {
    id: 'tr:validate:write',
    label: 'Tüm Doğrulama API’leri (Geniş Kapsam)',
    description: 'Tüm Türkiye ve küresel doğrulama ve hesaplama servislerine tek çatı altında erişim.',
    category: 'broad',
    isLegacy: true,
  },
  {
    id: 'tr:invoice:write',
    label: 'Tüm Fatura & PDF API’leri',
    description: 'Fatura, teklif ve belge PDF üretimi izinleri.',
    category: 'broad',
    isLegacy: true,
  },
  {
    id: 'read:profile',
    label: 'Hesap Profil Okuma',
    description: 'Kullanıcı hesap bilgisi ve yetkilerini okuma izni.',
    category: 'broad',
  },

  // ─── TR Kimlik, Resmi & İletişim ───
  {
    id: 'api:validate:identity',
    label: 'TCKN / VKN Doğrulama',
    description: '11 haneli TCKN ve 10 haneli Vergi Kimlik Numarası modül 10 algoritma denetimi.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/identity',
  },
  {
    id: 'api:validate:iban',
    label: 'TR IBAN Doğrulama',
    description: 'Türkiye IBAN formatı, uzunluğu ve ISO 7064 MOD-97 sağlama kontrolü.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/iban',
  },
  {
    id: 'api:iban:bank',
    label: 'IBAN Banka Çözümleme',
    description: 'TR IBAN numarasından banka kodu ve resmi banka unvanını tespit eder.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/iban/bank',
  },
  {
    id: 'api:validate:phone',
    label: 'TR Telefon & Operatör Doğrulama',
    description: 'Türkiye cep/sabit telefon numarası format ve operatör prefix çözümlemesi.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/phone',
  },
  {
    id: 'api:validate:plate',
    label: 'TR Araç Plakası Doğrulama',
    description: 'Türkiye standart araç plaka formatı ve il kodu doğrulaması.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/plate',
  },
  {
    id: 'api:validate:mersis',
    label: 'MERSİS No Doğrulama',
    description: '16 haneli Merkezi Sicil Kayıt Sistemi numarası kontrol hanesi denetimi.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/mersis',
  },
  {
    id: 'api:validate:kep',
    label: 'KEP Adresi Doğrulama',
    description: 'Kayıtlı Elektronik Posta (KEP) adres sözdizimi ve resmi alan adı kontrolü.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/kep',
  },
  {
    id: 'api:validate:postal',
    label: 'TR Posta Kodu Doğrulama',
    description: '5 haneli Türkiye posta kodu geçerliliği ve il eşleştirmesi.',
    category: 'tr_official',
    endpoint: 'POST /api/v1/validate/postal',
  },

  // ─── Finans, Vergi & Muhasebe ───
  {
    id: 'api:finance:kdv',
    label: 'KDV Hesaplama',
    description: 'KDV dahil/hariç tutar, matrah ve vergi ayrıştırma motoru.',
    category: 'finance',
    endpoint: 'POST /api/v1/finance/kdv',
  },
  {
    id: 'api:finance:tevkifat',
    label: 'KDV Tevkifat Hesaplama',
    description: 'Resmi tevkifat oranlarına göre (2/10, 5/10, 9/10 vb.) KDV ve tevkifat ayrıştırma.',
    category: 'finance',
    endpoint: 'POST /api/v1/finance/tevkifat',
  },
  {
    id: 'api:finance:to-words',
    label: 'Sayıyı Yazıya Çevirme',
    description: 'Sayısal tutarları Türkçe resmi fatura metnine çevirme (Yalnız ... TL).',
    category: 'finance',
    endpoint: 'POST /api/v1/finance/to-words',
  },
  {
    id: 'api:finance:fx',
    label: 'TCMB Döviz Kurları',
    description: 'Türkiye Cumhuriyet Merkez Bankası güncel döviz kurları ve çapraz kur çevirici.',
    category: 'finance',
    endpoint: 'POST /api/v1/finance/fx',
  },
  {
    id: 'api:finance:creditor-ref',
    label: 'ISO 11649 Alacaklı Referansı',
    description: 'Fatura ödemelerinde kullanılan RF structured creditor reference üretimi ve doğrulama.',
    category: 'finance',
    endpoint: 'POST /api/v1/finance/creditor-ref',
  },
  {
    id: 'api:commerce:reorder-point',
    label: 'Stok Sipariş Noktası',
    description: 'E-ticaret ve depo için emniyet stoku ve yeniden sipariş noktası optimizasyonu.',
    category: 'finance',
    endpoint: 'POST /api/v1/commerce/reorder-point',
  },
  {
    id: 'api:commerce:stripe-split',
    label: 'Pazaryeri Ödeme Dağıtımı',
    description: 'Pazaryeri komisyonu, satıcı payı ve ödeme işlemci ücreti split hesaplaması.',
    category: 'finance',
    endpoint: 'POST /api/v1/commerce/stripe-split',
  },
  {
    id: 'api:convert:unit',
    label: 'Birim Dönüştürücü',
    description: 'Uzunluk, ağırlık, alan ve hacim birimleri arası metrik/emperyal dönüşüm.',
    category: 'finance',
    endpoint: 'POST /api/v1/convert/unit',
  },

  // ─── İş Kanunu & Bordro ───
  {
    id: 'api:labor:severance',
    label: 'Kıdem ve İhbar Tazminatı',
    description: '4857 sayılı İş Kanunu uyarınca yasal tavan ve damga vergisi dahil tazminat hesabı.',
    category: 'labor',
    endpoint: 'POST /api/v1/labor/severance',
  },

  // ─── Fatura & Belge Üretimi ───
  {
    id: 'api:invoice:pdf',
    label: 'Fatura / Teklif PDF Üretimi',
    description: 'Kalem detaylı, matrah ve KDV dökümlü profesyonel PDF doküman üretimi.',
    category: 'invoice',
    endpoint: 'POST /api/v1/invoice/pdf',
  },

  // ─── Resmi Takvim, Süreler & Tatiller ───
  {
    id: 'api:calendar:holidays',
    label: 'Resmi ve Dini Tatiller Listesi',
    description: 'Türkiye resmi tatilleri, bayramlar ve idari izin günleri takvimi.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/holidays',
  },
  {
    id: 'api:calendar:is-holiday',
    label: 'Tatil Günü Kontrolü',
    description: 'Belirtilen tarihin resmi/dini tatil veya yarım gün olup olmadığını döner.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/is-holiday',
  },
  {
    id: 'api:calendar:business-days',
    label: 'İş Günü Sayısı Hesaplama',
    description: 'İki tarih arasındaki resmi tatiller ve hafta sonları hariç iş günü hesabı.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/business-days',
  },
  {
    id: 'api:calendar:is-business-day',
    label: 'İş Günü Kontrolü',
    description: 'Belirli bir tarihin resmi mesai/iş günü olup olmadığını doğrular.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/is-business-day',
  },
  {
    id: 'api:calendar:next-business-day',
    label: 'Sonraki İlk İş Günü',
    description: 'Hafta sonu veya tatile denk gelen işlemler için takip eden ilk iş gününü bulur.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/next-business-day',
  },
  {
    id: 'api:calendar:add-business-days',
    label: 'İş Günü Ekleme (Termin Hesabı)',
    description: 'Başlangıç tarihine N iş günü ekleyerek resmi teslim/termin tarihini tespit eder.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/add-business-days',
  },
  {
    id: 'api:calendar:tebligat',
    label: 'Tebligat Kanunu Süre Hesabı',
    description: 'Tebligat Kanunu kurallarına göre son gün hesabı (tatil uzaması dahil).',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/tebligat',
  },
  {
    id: 'api:calendar:bist',
    label: 'Borsa İstanbul (BIST) Takvimi',
    description: 'BIST hisse ve takas işlemlerine açık/kapalı gün ve seans takvimi.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/bist',
  },
  {
    id: 'api:calendar:hijri',
    label: 'Hicri & Miladi Tarih Çevirici',
    description: 'Diyanet İşleri takvimine uyumlu Hicri ve Miladi takvim çift yönlü çevirimi.',
    category: 'calendar',
    endpoint: 'POST /api/v1/calendar/hijri',
  },

  // ─── Coğrafi Bilgi & Adres ───
  {
    id: 'api:geo:provinces',
    label: 'Türkiye İl Listesi',
    description: '81 ilin plaka kodları, isimleri ve coğrafi bölge verileri.',
    category: 'geo',
    endpoint: 'POST /api/v1/geo/provinces',
  },
  {
    id: 'api:geo:districts',
    label: 'İlçe Listesi',
    description: 'Belirtilen ile ait tüm resmi ilçe isimleri ve hiyerarşik veriler.',
    category: 'geo',
    endpoint: 'POST /api/v1/geo/districts',
  },
  {
    id: 'api:geo:postal',
    label: 'Posta Kodu Sorgulama',
    description: 'İl ve ilçe bazında posta kodu sorgulama ve doğrulama servisi.',
    category: 'geo',
    endpoint: 'POST /api/v1/geo/postal',
  },
  {
    id: 'api:parse:address',
    label: 'Doğal Dil Adres Ayrıştırıcı',
    description: 'Serbest metin Türkçe adresi il, ilçe, mahalle, cadde, kapı no olarak ayrıştırır.',
    category: 'geo',
    endpoint: 'POST /api/v1/parse/address',
  },

  // ─── Banka, Kart & Ödeme Standartları ───
  {
    id: 'api:validate:card',
    label: 'Kredi/Banka Kart No Doğrulama',
    description: 'Luhn modül-10 algoritması ile kart numarası format ve sağlama kontrolü.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/card',
  },
  {
    id: 'api:validate:card-brand',
    label: 'Kart BIN ve Marka Tespiti',
    description: 'İlk hanelerden Visa, Mastercard, Troy, Amex ve şema tespiti.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/card-brand',
  },
  {
    id: 'api:validate:bic',
    label: 'SWIFT / BIC Kodu Doğrulama',
    description: 'ISO 9362 8 veya 11 karakterlik banka tanımlayıcı kodu doğrulaması.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/bic',
  },
  {
    id: 'api:validate:aba',
    label: 'ABA Routing Transit No (ABD)',
    description: 'ABD bankacılık sistemi Fedwire/ACH 9 haneli transit numarası ve ağırlıklı mod 10.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/aba',
  },
  {
    id: 'api:validate:rib',
    label: 'Fransa RIB Hesap No',
    description: 'Fransa Relevé d’Identité Bancaire 23 haneli banka hesap kodu kontrolü.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/rib',
  },
  {
    id: 'api:validate:clabe',
    label: 'Meksika CLABE Numarası',
    description: 'Meksika 18 haneli standart banka hesap kodu ve ağırlıklı mod 10 sağlama.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/clabe',
  },
  {
    id: 'api:validate:ccc',
    label: 'İspanya CCC Hesap No',
    description: 'İspanya Código Cuenta Corriente 20 haneli banka hesap kodu ve kontrol basamağı.',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/ccc',
  },
  {
    id: 'api:validate:ogm',
    label: 'Belçika OGM Referansı',
    description: 'Belçika bankacılık sistemi 12 haneli yapılandırılmış ödeme referansı (+++...+++).',
    category: 'banking',
    endpoint: 'POST /api/v1/validate/ogm',
  },

  // ─── Uluslararası Kimlik & Vergi ───
  {
    id: 'api:validate:eu-vat',
    label: 'AB KDV (EU VAT) No Doğrulama',
    description: '27 AB üye ülkesine ait KDV numarası ülke kodu ve yerel kontrol hanesi kontrolü.',
    category: 'global_identity',
    endpoint: 'POST /api/v1/validate/eu-vat',
  },
  {
    id: 'api:validate:cpf',
    label: 'Brezilya Bireysel Vergi No (CPF)',
    description: 'Brezilya Cadastro de Pessoas Físicas 11 haneli kimlik ve çift modül 11 sağlama.',
    category: 'global_identity',
    endpoint: 'POST /api/v1/validate/cpf',
  },
  {
    id: 'api:validate:cnpj',
    label: 'Brezilya Şirket Vergi No (CNPJ)',
    description: 'Brezilya kurumsal vergi kimliği 14 haneli CNPJ ve kontrol basamakları.',
    category: 'global_identity',
    endpoint: 'POST /api/v1/validate/cnpj',
  },
  {
    id: 'api:validate:dni',
    label: 'İspanya DNI / NIE Kimlik No',
    description: 'İspanya ulusal kimlik belgesi mod 23 kontrol harfi denetimi.',
    category: 'global_identity',
    endpoint: 'POST /api/v1/validate/dni',
  },
  {
    id: 'api:validate:aadhaar',
    label: 'Hindistan Aadhaar No',
    description: '12 haneli Hindistan ulusal kimlik numarası Verhoeff algoritması kontrolü.',
    category: 'global_identity',
    endpoint: 'POST /api/v1/validate/aadhaar',
  },

  // ─── Menkul Kıymetler & Kodlar ───
  {
    id: 'api:validate:isin',
    label: 'ISO 6166 ISIN Menkul Kıymet',
    description: 'Uluslararası Menkul Kıymet Tanımlama Numarası Luhn mod 10 sağlama denetimi.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/isin',
  },
  {
    id: 'api:validate:figi',
    label: 'Bloomberg FIGI Kodu',
    description: 'Financial Instrument Global Identifier 12 alfanümerik karakter kontrolü.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/figi',
  },
  {
    id: 'api:validate:sedol',
    label: 'Londra Borsası SEDOL Kodu',
    description: 'Birleşik Krallık ve İrlanda menkul kıymetleri için 7 karakterlik SEDOL kontrolü.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/sedol',
  },
  {
    id: 'api:validate:cusip',
    label: 'ABD / Kanada CUSIP Kodu',
    description: 'Kuzey Amerika menkul kıymet 9 haneli CUSIP numarası ve ağırlıklı mod 10.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/cusip',
  },
  {
    id: 'api:validate:lei',
    label: 'ISO 17442 LEI Tüzel Kişi Kodu',
    description: 'Küresel finans piyasaları 20 karakterlik Legal Entity Identifier ISO 7064 kontrolü.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/lei',
  },
  {
    id: 'api:validate:mic',
    label: 'ISO 10383 Borsa Kodu (MIC)',
    description: 'Piyasa tanımlayıcı 4 karakterlik ISO borsa kodu (örn. XIST, XNYS, XLON).',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/mic',
  },
  {
    id: 'api:validate:wkn',
    label: 'Almanya WKN Menkul Kıymet No',
    description: 'Alman finans piyasaları Wertpapierkennnummer 6 alfanümerik karakter denetimi.',
    category: 'securities',
    endpoint: 'POST /api/v1/validate/wkn',
  },

  // ─── GS1, Barkod & Tedarik Zinciri ───
  {
    id: 'api:validate:gtin',
    label: 'GS1 GTIN / Barkod Checksum',
    description: 'GTIN-8, GTIN-12 (UPC), GTIN-13 (EAN-13), GTIN-14 ürün barkodu kontrol hanesi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/gtin',
  },
  {
    id: 'api:validate:barcode',
    label: 'Genel Barkod Sözdizimi',
    description: 'EAN, UPC, Code128 ve Code39 genel barkod format geçerliliği kontrolü.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/barcode',
  },
  {
    id: 'api:validate:gln',
    label: 'GS1 GLN Lokasyon Numarası',
    description: '13 haneli Küresel Lokasyon Numarası mod 10 sağlama denetimi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/gln',
  },
  {
    id: 'api:validate:sscc',
    label: 'GS1 SSCC Taşıma Birimi No',
    description: '18 haneli Seri Sevkiyat Konteyner Kodu lojistik barkod sağlama denetimi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/sscc',
  },
  {
    id: 'api:validate:gsrn',
    label: 'GS1 GSRN Hizmet İlişkisi No',
    description: '18 haneli Küresel Hizmet İlişkisi Numarası kontrol hanesi denetimi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/gsrn',
  },
  {
    id: 'api:validate:gsin',
    label: 'GS1 GSIN Sevkiyat Tanımlama',
    description: '17 haneli Küresel Sevkiyat Tanımlama Numarası kontrol hanesi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/gsin',
  },
  {
    id: 'api:validate:grai',
    label: 'GS1 GRAI Dönüşümlü Varlık',
    description: 'Dönüşümlü varlık tanımlayıcısı formatı ve kontrol basamağı.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/grai',
  },
  {
    id: 'api:validate:gdti',
    label: 'GS1 GDTI Doküman Tanımlayıcı',
    description: 'Küresel Doküman Tipi Tanımlayıcısı format denetimi.',
    category: 'supply_chain',
    endpoint: 'POST /api/v1/validate/gdti',
  },

  // ─── Taşımacılık & Araç Standartları ───
  {
    id: 'api:validate:vin',
    label: 'ISO 3779 Şasi Numarası (VIN)',
    description: '17 haneli araç şasi numarası ağırlıklı mod 11 kontrol basamağı doğrulaması.',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/vin',
  },
  {
    id: 'api:validate:vin-decode',
    label: 'Şasi No Çözümleyici (VIN Decode)',
    description: 'VIN numarasından üretici ülke, fabrika, model yılı ve WMI kodunu çözer.',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/vin-decode',
  },
  {
    id: 'api:validate:container',
    label: 'ISO 6346 Yük Konteyneri Kodu',
    description: '4 harf sahip kodu + 6 hane seri + 1 kontrol basamağı BIC konteyner denetimi.',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/container',
  },
  {
    id: 'api:validate:imo',
    label: 'IMO Gemi Tanımlama Numarası',
    description: 'Uluslararası Denizcilik Örgütü 7 haneli gemi IMO numarası kontrol basamağı.',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/imo',
  },
  {
    id: 'api:validate:iata',
    label: 'IATA 3 Harfli Havalimanı Kodu',
    description: 'Uluslararası Hava Taşımacılığı Birliği havalimanı ve şehir kodu denetimi (örn. IST, SAW).',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/iata',
  },
  {
    id: 'api:validate:icao',
    label: 'ICAO 4 Harfli Havalimanı Kodu',
    description: 'Uluslararası Sivil Havacılık Örgütü 4 harfli meydan kodu denetimi (örn. LTFM, LTFJ).',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/icao',
  },
  {
    id: 'api:validate:awb',
    label: 'Hava Yolu Taşıma Senedi (AWB)',
    description: '3 hane havayolu prefiksi + 8 hane mod-7 kontrol basamaklı konşimento kontrolü.',
    category: 'logistics',
    endpoint: 'POST /api/v1/validate/awb',
  },

  // ─── Ağ, Web & Geliştirici Standartları ───
  {
    id: 'api:validate:email',
    label: 'E-posta Doğrulama',
    description: 'RFC 5322 sözdizimi, MX alanı kontrolü ve yaygın alan adı yazım hataları tespiti.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/email',
  },
  {
    id: 'api:validate:phone-global',
    label: 'Uluslararası Telefon (E.164)',
    description: 'Tüm dünya ülkeleri için E.164 uluslararası telefon biçimi ve ülke kodu denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/phone-global',
  },
  {
    id: 'api:validate:url',
    label: 'URL & Web Adresi Doğrulama',
    description: 'Protokol, hostname, port, yol ve TLD kurallarına göre URL geçerlilik denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/url',
  },
  {
    id: 'api:validate:ip',
    label: 'IP Adresi (IPv4 / IPv6)',
    description: 'IPv4 oktet, IPv6 hex/sıkıştırma ve özel/yerel IP aralığı kontrolü.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/ip',
  },
  {
    id: 'api:validate:mac',
    label: 'MAC Donanım Adresi',
    description: 'IEEE 802 EUI-48 ve EUI-64 donanım fiziksel adres formatı denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/mac',
  },
  {
    id: 'api:validate:uuid',
    label: 'UUID / GUID Doğrulama',
    description: 'RFC 4122 UUID v1, v3, v4, v5 varyant ve versiyon geçerlilik denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/uuid',
  },
  {
    id: 'api:validate:port',
    label: 'TCP / UDP Ağ Portu Doğrulama',
    description: '1-65535 arası ağ portu geçerliliği ve tanınmış (well-known) servis eşleşmesi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/port',
  },
  {
    id: 'api:validate:semver',
    label: 'SemVer Sürüm Formatı',
    description: 'Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH-prerelease+build) format denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/semver',
  },
  {
    id: 'api:validate:slug',
    label: 'URL Slug Formatı Doğrulama',
    description: 'Web sayfası ve SEO dostu kebab-case slug formatı denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/slug',
  },
  {
    id: 'api:validate:timezone',
    label: 'IANA Zaman Dilimi (Timezone)',
    description: 'Olson/IANA saat dilimi veritabanı (örn. Europe/Istanbul, UTC) ismi denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/timezone',
  },
  {
    id: 'api:validate:locale',
    label: 'BCP 47 Dil & Yerel Kodu',
    description: 'IETF BCP 47 yerel kodları (örn. tr-TR, en-US, de-DE) geçerlilik kontrolü.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/locale',
  },
  {
    id: 'api:validate:tld',
    label: 'IANA Üst Düzey Alan Adı (TLD)',
    description: 'Resmi IANA kök alan adı uzantıları (.tr, .com, .io, .ai vb.) kontrolü.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/tld',
  },
  {
    id: 'api:validate:color',
    label: 'Renk Kodu (HEX, RGB, HSL)',
    description: 'Web CSS renk formatları (HEX 3/6/8 hane, rgb(), rgba(), hsl()) sözdizim denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/color',
  },
  {
    id: 'api:validate:asn',
    label: 'BGP Otonom Sistem No (ASN)',
    description: 'İnternet BGP yönlendirme 16-bit ve 32-bit AS numarası denetimi.',
    category: 'network_tech',
    endpoint: 'POST /api/v1/validate/asn',
  },

  // ─── Yayıncılık & Akademik ───
  {
    id: 'api:validate:isbn',
    label: 'ISBN Kitap Numarası',
    description: 'ISBN-10 ve ISBN-13 uluslararası standart kitap numarası mod 10/11 kontrolü.',
    category: 'publishing',
    endpoint: 'POST /api/v1/validate/isbn',
  },
  {
    id: 'api:validate:issn',
    label: 'ISSN Süreli Yayın Kodu',
    description: 'Dergi ve süreli yayınlar için 8 haneli ISSN kodu ve ağırlıklı mod 11 sağlama.',
    category: 'publishing',
    endpoint: 'POST /api/v1/validate/issn',
  },
  {
    id: 'api:validate:doi',
    label: 'DOI Dijital Nesne Tanımlayıcı',
    description: 'Akademik makale ve yayınlar için ISO 26324 DOI formatı denetimi.',
    category: 'publishing',
    endpoint: 'POST /api/v1/validate/doi',
  },
  {
    id: 'api:validate:orcid',
    label: 'ORCID Araştırmacı Kimliği',
    description: '16 haneli araştırmacı kimlik numarası ve ISO 7064 MOD 11-2 kontrol hanesi.',
    category: 'publishing',
    endpoint: 'POST /api/v1/validate/orcid',
  },
  {
    id: 'api:validate:isni',
    label: 'ISO 27729 ISNI Tanımlayıcı',
    description: 'Uluslararası Standart İsim Tanımlayıcı 16 haneli ISO 7064 MOD 11-2 kontrolü.',
    category: 'publishing',
    endpoint: 'POST /api/v1/validate/isni',
  },

  // ─── Pasaport & Kripto Varlıklar ───
  {
    id: 'api:validate:mrz',
    label: 'Pasaport MRZ Kontrol Hanesi',
    description: 'ICAO Doc 9303 standart pasaport ve kimlik kartı makineyle okunabilir alan (MRZ) denetimi.',
    category: 'security_crypto',
    endpoint: 'POST /api/v1/validate/mrz',
  },
  {
    id: 'api:validate:sci',
    label: 'Kimlik Kartı Seri / Sıra No',
    description: 'Türkiye yeni çipli kimlik kartı seri ve sıra numarası biçim kontrolü.',
    category: 'security_crypto',
    endpoint: 'POST /api/v1/validate/sci',
  },
  {
    id: 'api:validate:btc',
    label: 'Bitcoin (BTC) Cüzdan Adresi',
    description: 'Legacy (P2PKH 1...), Script (P2SH 3...) ve SegWit (Bech32 bc1...) Base58Check denetimi.',
    category: 'security_crypto',
    endpoint: 'POST /api/v1/validate/btc',
  },
  {
    id: 'api:validate:eth',
    label: 'Ethereum (ETH) Cüzdan Adresi',
    description: 'EIP-55 büyük/küçük harf Keccak-256 checksum’lı Ethereum ve ERC-20 adres denetimi.',
    category: 'security_crypto',
    endpoint: 'POST /api/v1/validate/eth',
  },

  // ─── Algoritmik Kontroller & Standartlar ───
  {
    id: 'api:validate:damm',
    label: 'Damm Algoritması Checksum',
    description: 'Kuazi-grup teorisine dayanan, tek basamak ve yan yana yer değişimlerini yakalayan sağlama.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/damm',
  },
  {
    id: 'api:validate:verhoeff',
    label: 'Verhoeff Dihedral Checksum',
    description: 'D5 dihedral grubu tabanlı, karmaşık veri giriş hatalarını yakalayan kontrol algoritması.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/verhoeff',
  },
  {
    id: 'api:validate:iso7064',
    label: 'ISO 7064 Genel Checksum',
    description: 'ISO 7064 Mod 11,2 / Mod 37,2 / Mod 97,10 algoritmik kontrol hanesi hesaplama motoru.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/iso7064',
  },
  {
    id: 'api:validate:iso-country',
    label: 'ISO 3166-1 Ülke Kodları',
    description: '2 harfli Alpha-2, 3 harfli Alpha-3 ve sayısal resmi ISO ülke kodları denetimi.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/iso-country',
  },
  {
    id: 'api:validate:iso-language',
    label: 'ISO 639 Dil Kodları',
    description: '2 harfli ISO 639-1 ve 3 harfli ISO 639-2 resmi dil kodları doğrulama servisi.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/iso-language',
  },
  {
    id: 'api:validate:batch',
    label: 'Toplu Çoklu İstek Motoru',
    description: 'Birden çok doğrulama isteğini tek HTTP POST çağrısında paralel işleme motoru.',
    category: 'algorithms',
    endpoint: 'POST /api/v1/validate/batch',
  },
];
