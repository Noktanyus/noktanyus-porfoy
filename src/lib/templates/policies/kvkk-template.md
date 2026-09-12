<!--
  KVKK Aydınlatma Metni — Base Template (Phase 4 C.3)

  Bu şablon AI tarafından doldurulmak üzere placeholder içerir.
  Her {{...}} token policyGenerator.ts tarafından companyName / domain /
  contactEmail / scan sonuçları / customClauses ile replace edilir.
  Markdown-only çıktı; HTML yok.

  Yapı: 8 zorunlu bölüm — KVKK Madde 10 kapsamı.
  Düzenleyici referanslar köşeli parantezle gösterilmiştir; AI
  bu referansları policy içeriğine açıklayıcı olarak yayar.
-->

# {{COMPANY_NAME}} KİŞİSEL VERİLERİN KORUNMASI VE İŞLENMESİ AYDINLATMA METNİ

**Son güncelleme:** {{POLICY_DATE}}
**Versiyon:** {{VERSION}}
**Yayın URL:** {{PUBLISHED_URL}}

## 1. VERİ SORUMLUSU

6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, {{COMPANY_NAME}} ("Şirket" veya "Veri Sorumlusu") {{DOMAIN}} alan adlı internet sitesi ("Platform") üzerinden toplanan kişisel veriler bakımından veri sorumlusu sıfatını haizdir.

| Unvan | : | {{COMPANY_NAME}} |
| ----- | :-: | --- |
| Adres | : | {{COMPANY_ADDRESS}} |
| Mersis No | : | {{MERSIS_NO}} |
| Vergi Dairesi / No | : | {{TAX_OFFICE}} / {{TAX_NUMBER}} |
| Telefon | : | {{COMPANY_PHONE}} |
| E-posta | : | {{CONTACT_EMAIL}} |
| Web | : | https://{{DOMAIN}} |

Veri sorumlusu sıfatıyla hareket eden Şirket, KVKK'nın 12. maddesi kapsamında gerekli teknik ve idari tedbirleri almakta, veri güvenliğini sağlamak için uygun denetimleri yürütmektedir.

## 2. TOPLANAN KİŞİSEL VERİLER

Platform üzerinden kullanıcılardan aşağıdaki kategorilerde kişisel veriler toplanmaktadır:

### 2.1 Kimlik Bilgileri
- Ad, soyad
- T.C. kimlik numarası (yalnızca fatura ve yasal yükümlülük kapsamındaki işlemlerde)
- Doğum tarihi
- Cinsiyet

### 2.2 İletişim Bilgileri
- E-posta adresi
- Telefon numarası
- Adres (fatura / teslimat için)
- İl, ilçe

### 2.3 Lokasyon Verileri
- IP adresi
- Coğrafi konum (açık rıza verildiği takdirde)
- Saat dilimi, dil tercihi

### 2.4 İşlem Güvenliği Bilgileri
- Oturum (session) bilgileri
- Şifrelenmiş parola hash'leri
- İki faktörlü kimlik doğrulama (2FA) kayıtları
- Cihaz parmak izi (device fingerprint)

### 2.5 Pazarlama ve Analitik Verileri
- Çerez (cookie) kayıtları
- Sayfa görüntüleme ve etkileşim logları
- Kampanya katılım geçmişi
- Alışveriş tercihleri

### 2.6 Finansal Bilgiler
- Fatura ve ödeme bilgileri (tam kart numarası Şirket bünyesinde **saklanmaz**; ödeme hizmeti sağlayıcısı tarafından işlenir)
- Banka IBAN'ı (iade işlemleri için)

### 2.7 Özel Nitelikli Kişisel Veriler [KVKK Madde 6]
Aşağıdaki kategoriler yalnızca **açık rıza** ve gerekli hallerde toplanır:
- Sağlık verileri (sağlık beyanı gerektiren hizmetlerde)
- Biyometrik veriler (yüz tanıma / parmak izi ile giriş tercih edildiğinde)
- Sendika, din, ırk, siyasi görüş gibi hassas veriler toplanmaz.

## 3. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI

Toplanan kişisel veriler aşağıdaki amaçlarla işlenmektedir:

| # | Amaç | Hukuki Sebep |
|---|------|---------------|
| 1 | Platform'a üyelik ve hesap yönetimi | Sözleşmenin kurulması / ifası (KVKK 5/2-c) |
| 2 | Ürün / hizmet satışı, fatura ve ödeme işlemleri | Sözleşmenin ifası, yasal yükümlülük (KVKK 5/2-a, ç) |
| 3 | Teslimat / kargo süreçleri | Sözleşmenin ifası (KVKK 5/2-c) |
| 4 | Müşteri destek ve şikâyet yönetimi | Sözleşmenin ifası, meşru menfaat (KVKK 5/2-c, f) |
| 5 | KVKK Madde 5/1 uyarınca açık rıza kapsamında çerez kullanımı ve analitik | Açık rıza (KVKK 5/1) |
| 6 | Pazarlama, kampanya ve kişiselleştirme | Açık rıza (KVKK 5/1) |
| 7 | Hukuki uyuşmazlıkların çözümü, resmi makamlara bilgi verme | Hukuki yükümlülük, meşru menfaat (KVKK 5/2-a, f) |
| 8 | Sistem güvenliği, sahteciliğin önlenmesi | Meşru menfaat (KVKK 5/2-f) |
| 9 | Yasal saklama süreleri kapsamında arşivleme | Hukuki yükümlülük (KVKK 5/2-a) |

## 4. KİŞİSEL VERİLERİN AKTARIMI

### 4.1 Yurt İçi Aktarımlar
Toplanan kişisel veriler, yukarıdaki amaçların yerine getirilmesi için sınırlı olarak aşağıdaki taraflara aktarılabilir:
- İş ortakları, tedarikçiler ve hizmet sağlayıcılar (kargo, ödeme, bulut barındırma, e-posta gönderimi)
- Hukuk, mali müşavirlik ve denetim danışmanları
- Yetkili kamu kurum ve kuruluşları (vergi dairesi, SGK, KİŞİSEL VERİLERİ KORUMA KURUMU vb.)

### 4.2 Yurt Dışı Aktarımlar [KVKK Madde 9]
Yurt dışına veri aktarımı, KVKK Madde 9 kapsamında aşağıdaki koşullardan birinin varlığı halinde gerçekleştirilir:
- Açık rıza alınması
- Aktarımın sözleşmenin kurulması / ifası için zorunlu olması
- Aktarımın kayıt altına alınmış standart sözleşme (sözleşmeye ek ve güvenlik tedbirleri içeren taahhütname) kapsamında yapılması

Tespit edilen üçüncü taraf hizmet sağlayıcıları (cloud / analytics):
{{SCAN_THIRD_PARTY_LIST}}

## 5. VERİ TOPLAMA YÖNTEMİ VE HUKUKİ SEBEP

Kişisel veriler, Platform üzerindeki formlar, çerezler, API çağrıları, e-posta iletişimi, destek talepleri ve sair otomatik / otomatik olmayan yöntemlerle toplanmaktadır. Hukuki sebepler yukarıdaki tabloda her amaç için ayrı ayrı belirtilmiştir.

**Çerez Politikası:** Platform'da kullanılan çerezler ve üçüncü taraf izleyiciler hakkında detaylı bilgi {{COOKIE_POLICY_URL}} adresinde yayımlanmaktadır. Tespit edilen çerezler:

{{COOKIE_LIST}}

## 6. KVKK MADDE 11 — İLGİLİ KİŞİNİN HAKLARI

KVKK Madde 11 uyarınca ilgili kişiler aşağıdaki haklara sahiptir:

1. Kişisel verilerinin işlenip işlenmediğini öğrenme
2. İşlenmişse buna ilişkin bilgi talep etme
3. İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
4. Yurt içinde / dışında aktarıldığı üçüncü kişileri öğrenme
5. Eksik veya yanlış işlenen verilerin düzeltilmesini isteme
6. Şartlar oluştuğunda verilerin silinmesini veya yok edilmesini isteme
7. Otomatik sistemlerle alınan kararlara itiraz etme
8. Kanuna aykırı işleme sebebiyle zararın giderilmesini talep etme

### 6.1 Başvuru Yöntemi
Yukarıdaki haklarınızı kullanmak için aşağıdaki yöntemlerle Şirketimize başvurabilirsiniz:
- **E-posta:** {{CONTACT_EMAIL}} (konu: "KVKK Başvurusu")
- **KEP (Kayıtlı Elektronik Posta):** {{KEP_ADDRESS}}
- **Yazılı başvuru:** {{COMPANY_ADDRESS}} (Kimlik tespiti gerekir)
- **Web formu:** https://{{DOMAIN}}/kvkk-basvuru

KVKK Madde 13 uyarınca talebiniz en geç **30 (otuz) gün** içinde sonuçlandırılır. İşlemin ayrıca bir maliyeti gerektirmesi halinde, Kurulun belirlediği tarifedeki ücret alınabilir.

## 7. VERBİS KAYDI

Şirket, KVKK Madde 16 ve Veri Sorumluları Sicili Hakkında Yönetmelik kapsamında VERBİS (Veri Sorumluları Sicil Bilgi Sistemi)'ne kayıtlıdır.

| Bilgi | Değer |
|-------|-------|
| VERBİS Sicil No | {{VERBIS_NO}} |
| Kayıt Tarihi | {{VERBIS_DATE}} |
| Kategori | {{VERBIS_CATEGORY}} |

VERBİS kaydı, veri sorumlusunun işlediği veri kategorilerini, amaçlarını, aktarım alıcılarını ve silme sürelerini içermekte olup, güncel haliyle {{VERBIS_PUBLIC_URL}} adresinden görüntülenebilir.

## 8. İLETİŞİM

KVKK ve işbu Aydınlatma Metni ile ilgili tüm sorularınız, başvurularınız ve şikâyetleriniz için aşağıdaki kanallardan bizimle iletişime geçebilirsiniz:

| Kanal | Bilgi |
|-------|-------|
| Veri Sorumlusu İrtibat | {{DPO_NAME}} |
| E-posta | {{CONTACT_EMAIL}} |
| Telefon | {{COMPANY_PHONE}} |
| Adres | {{COMPANY_ADDRESS}} |
| Yanıt Süresi | En geç 30 gün (KVKK Madde 13) |

---

**Yürürlük:** Bu Aydınlatma Metni yayımlandığı tarihte yürürlüğe girer; önemli değişikliklerde kullanıcılar önceden bilgilendirilir.

**Değişiklik Geçmişi**

| Versiyon | Tarih | Değişiklik |
|----------|-------|------------|
| {{VERSION}} | {{POLICY_DATE}} | İlk yayın (AI tarafından üretildi) |
