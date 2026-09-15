# Noktanyus TR API — Official TypeScript / Node.js SDK

Türkiye e-ticaret, finans, takvim ve resmi doğrulama mikroservisleri için resmi sıfır-bağımlılık (zero-dependency) TypeScript/JavaScript istemci kütüphanesi.

---

## 🚀 Hızlı Başlangıç

### Kurulum / İçe Aktarma

```typescript
import { NoktanyusTrClient, NoktanyusApiError } from '@/sdk';

// İstemciyi API anahtarınız ile başlatın
const client = new NoktanyusTrClient({
  apiKey: process.env.NOKTANYUS_API_KEY || 'nok_live_...',
});
```

---

## 📖 Kullanım Örnekleri

### 1. TR IBAN Doğrulama & Banka Adı Çözümleme
```typescript
try {
  const result = await client.validateIban('TR330006100511123456789012');
  console.log('Geçerli mi:', result.valid);
  console.log('Banka Adı:', result.bankName);
  console.log('Formatlı:', result.formatted);
} catch (err) {
  if (err instanceof NoktanyusApiError) {
    console.error('Hata Kodu:', err.code); // VALIDATION, UNAUTHORIZED, QUOTA_EXCEEDED vb.
    console.error('Mesaj:', err.message);
  }
}
```

### 2. TCKN veya VKN Algoritma Doğrulama
```typescript
const result = await client.validateIdentity({
  type: 'tckn',
  value: '10000000146',
});

if (result.valid) {
  console.log('TC Kimlik Numarası geçerli.');
}
```

### 3. KDV ve Tevkifat Hesaplama
```typescript
// Net 1.000 TL üzerinden %20 KDV ve 5/10 Tevkifat
const result = await client.calculateTevkifat({
  amountCents: 100000, // 1.000,00 TL
  vatRate: 20,
  mode: 'net',
  withholding: '5/10',
});

console.log('Satıcıya Ödenecek (TL):', result.buyerPaysSellerCents / 100);
console.log('Tevkif Edilen KDV (TL):', result.withholdingCents / 100);
```

### 4. Türkiye İş Günü Hesabı
```typescript
// İki tarih arasındaki resmi tatil ve hafta sonlarını düşerek net iş günü bulma
const days = await client.calculateBusinessDays({
  startDate: '2026-10-01',
  endDate: '2026-10-15',
  includeStart: true,
  includeEnd: true,
});

console.log('Net İş Günü:', days.businessDays);
console.log('Hafta Sonu:', days.weekendDays);
console.log('Resmi Tatil:', days.holidayDays);
```

### 5. Toplu Doğrulama (Batch Validation)
```typescript
const batchResult = await client.batchValidate({
  type: 'iban',
  values: [
    'TR330006100511123456789012',
    'TR990000000000000000000000',
  ],
});

for (const item of batchResult) {
  console.log(`${item.value}: ${item.valid ? 'GEÇERLİ' : 'GEÇERSİZ'}`);
}
```

---

## 🛡️ Hata Yönetimi (`NoktanyusApiError`)

Tüm API hataları yapılandırılmış `NoktanyusApiError` sınıfı ile fırlatılır:

```typescript
try {
  await client.validateIban('hatali_deger');
} catch (err) {
  if (err instanceof NoktanyusApiError) {
    console.error('HTTP Kodu:', err.statusCode); // 400, 401, 402, 429, 500
    console.error('Hata Kodu:', err.code);       // 'VALIDATION', 'QUOTA_EXCEEDED' vb.
    console.error('Form Hataları:', err.fieldErrors);
  }
}
```

---

## 🔑 Lisans & Destek
- API Dokümantasyonu: [https://noktanyus.com/docs](https://noktanyus.com/docs)
- Destek E-postası: `destek@noktanyus.com`
