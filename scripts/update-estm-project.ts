#!/usr/bin/env tsx
/**
 * ESTM Proje İçeriği Güncelleme Script'i
 * 
 * Mevcut veritabanındaki `estm-spor-tesisleri` projesini
 * satış odaklı case study içeriğiyle günceller.
 * 
 * Kullanım:
 *   npx tsx scripts/update-estm-project.ts
 * 
 * NOT: Bu script idempotent'tir - birden fazla çalıştırılabilir.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ESTM_SLUG = 'estm-spor-tesisleri';

const UPDATED_DATA = {
  title: 'ESTM Spor Tesisleri Yönetim Sistemi',
  description: 'Akdeniz Üniversitesi Eğitim, Sosyal ve Spor Tesisleri Müdürlüğü için geliştirilen kapsamlı tesis yönetim yazılımı. Kurumsal spor kompleksleri, belediye tesisleri ve üniversite sosyal tesisleri için tam entegre rezervasyon, ödeme ve geçiş kontrol sistemi.',
  technologies: [
    'ASP.NET Core MVC',
    '.NET / C#',
    'Entity Framework Core',
    'SQL Server',
    'SignalR',
    'TypeScript',
    'Bootstrap',
    'NestPay/Asseco 3D Secure',
    'LDAP',
    'RFID/QR'
  ],
  content: `# ESTM Spor Tesisleri Yönetim Sistemi (eSAS)

**Akdeniz Üniversitesi** Eğitim, Sosyal ve Spor Tesisleri Müdürlüğü için geliştirdiğimiz **ESTM Spor Tesisleri Yazılımı**, üniversite spor komplekslerinin dijital dönüşümünü gerçekleştirdi. Tenis kortlarından halı sahalara, yüzme havuzundan fitness salonlarına kadar tüm tesislerin tek platformda yönetilmesini sağlıyor.

---

## 🎯 Sorun: Manuel Süreçler, Dağınık Veri, Kontrol Zorlukları

Projeye başlamadan önce tesisin işletme süreçleri klasik yöntemlerle yürütülüyordu:

- **Rezervasyon:** Telefon veya fiziksel başvuru ile yapılıyor, Excel'de takip ediliyordu — çifte rezervasyon, çakışma ve hatalar sıkça yaşanıyordu.
- **Ödeme tahsilatı:** Nakit veya havale ile alınıyor, muhasebe takibi manuel yapılıyordu.
- **Geçiş kontrolü:** Kart/üyelik doğrulaması personel tarafından elle kontrol ediliyordu — kayıt tutma ve raporlama zordu.
- **Kurs ve abonelik yönetimi:** Dağınık Excel ve kağıt kayıtlar; yoklama, derslere katılım takibi net değildi.
- **Raporlama:** Günlük, haftalık, aylık raporlar elle hazırlanıyor — idarenin karar verme süreci yavaşlıyordu.

---

## ✅ Çözüm: Tek Platform, Uçtan Uca Entegrasyon

**ESTM Spor Tesisleri Yazılımı**, tesisin operasyonel ihtiyaçlarına göre modüler bir mimari ile geliştirildi:

### Temel Modüller

#### 🎾 Online Kort & Salon Rezervasyonu
- Web ve mobil uyumlu rezervasyon takvimi (**SignalR** ile gerçek zamanlı güncelleme — iki kullanıcı aynı anda aynı saati seçemez).
- Öğrenci/personel/misafir kullanıcı gruplarına göre farklılaştırılmış ücretlendirme ve kontenjan yönetimi.

#### 💳 Güvenli Online Ödeme (3D Secure)
- **NestPay / Asseco** altyapısı üzerinden **Türkiye bankalarına uyumlu 3D Secure** ödeme entegrasyonu.
- Otomatik fatura kesimi ve e-posta ile bildirim.
- Ödeme geçmişi, iade ve iptal süreçlerinin sistem üzerinden takibi.

#### 👤 LDAP Entegrasyonu & Kullanıcı Yönetimi
- Üniversite Active Directory altyapısı ile **LDAP** üzerinden tek oturum açma (SSO benzeri entegrasyon).
- Öğrenci numarası veya personel sicil numarası ile otomatik kullanıcı tanımlama — manuel kayıt gerektirmiyor.
- Rol bazlı yetkilendirme: Öğrenci, Personel, İdari Personel, Sistem Yöneticisi.

#### 🎓 Kurs & Abonelik Yönetimi
- Yüzme, tenis, pilates, yoga gibi kursların online kayıt, ücretlendirme ve takibi.
- Abonelik paketleri (aylık/dönemlik) tanımlama ve otomatik yenileme.
- Kurs takvimi, kontenjan yönetimi, bekleme listesi.

#### 📲 RFID Kart & QR Kod ile Geçiş Kontrolü
- Öğrencilere/personele verilen **RFID kartlar** veya mobil uygulamadan oluşturulan **QR kodlar** ile tesis girişlerinde fiziksel geçiş kontrolü.
- Giriş-çıkış logları, yoklama takibi, geçersiz kartların engellenmesi.

#### 📢 Duyuru & Bildirim Sistemi
- SMS ve **WhatsApp** (WAHA entegrasyonu) ile rezervasyon onay/hatırlatma mesajları.
- E-posta ile kurs başlangıç, iptal, ödeme bildirimlerinin otomasyonu.

#### 📊 Gelişmiş Raporlama & İstatistikler
- Günlük, haftalık, aylık gelir raporları.
- Tesis kullanım oranları, en çok tercih edilen saatler, demografik istatistikler.
- İdari karar destek raporları (Excel export, filtreleme, tarih aralığı seçimi).

---

## 🛠️ Teknoloji Altyapısı

Kurumsal yazılım standartlarında, güvenli ve ölçeklenebilir bir mimari kullanıldı:

- **Backend Framework:** ASP.NET Core MVC (Clean Architecture prensibi)
- **Programlama Dili:** C# (.NET)
- **Veritabanı:** Microsoft SQL Server
- **ORM:** Entity Framework Core (Code-First yaklaşım, migration yönetimi)
- **Gerçek Zamanlı İletişim:** SignalR (rezervasyon takvimi canlı güncelleme)
- **Ödeme Altyapısı:** NestPay / Asseco 3D Secure (Türkiye bankacılık standartlarına uyumlu)
- **Kimlik Doğrulama:** Cookie-based Authentication + LDAP entegrasyonu
- **Frontend:** Razor Pages + TypeScript, Bootstrap UI Framework
- **Bildirim:** SMS Gateway + WhatsApp Business API (WAHA)
- **Geçiş Sistemi:** RFID okuyucu entegrasyonu, QR kod oluşturma/doğrulama

---

## 📈 Kazanımlar & Değer Önerisi

Bu yazılımın devreye alınmasıyla tesis yönetiminde köklü bir dönüşüm sağlandı:

✅ **Operasyonel Verimlilik**  
Manuel rezervasyon ve tahsilat süreçleri otomasyona kavuştu — personel iş yükü ciddi oranda azaldı.

✅ **7/24 Erişim**  
Öğrenciler ve personeller istedikleri zaman online rezervasyon yapabiliyorlar, işlem yapmak için fiziksel olarak tesise gelmeye gerek yok.

✅ **Hata ve Çifte Rezervasyon Sıfırlandı**  
SignalR ile gerçek zamanlı güncelleme sayesinde sistem çakışmalarını otomatik önlüyor.

✅ **Güvenli Ödeme & Raporlama**  
3D Secure ödeme, kullanıcılar için güvenli; idare için şeffaf gelir takibi ve raporlama sağlıyor.

✅ **Kurumsal Entegrasyon**  
LDAP ile üniversite altyapısına entegre, öğrenci/personel verisi senkron tutuluyor.

✅ **Fiziksel Geçiş Kontrolü**  
RFID ve QR kod destekli geçiş sistemi ile yetkisiz kullanım engellendi, giriş logları tutarlı şekilde kaydediliyor.

✅ **Kullanıcı Memnuniyeti**  
Platform üzerinden gelen geri bildirimler olumlu — kullanıcılar süreci hızlı ve şeffaf buluyor.

---

## 🏢 Kimler İçin Uygun?

Bu çözüm, **kurumsal spor ve sosyal tesis işletmelerinde** benzer ihtiyaçları olan kurumlara da adapte edilebilir:

- **Üniversiteler** (kampüs spor kompleksleri, öğrenci kulüpleri)
- **Belediyeler** (sosyal tesisler, halı saha, yüzme havuzu işletmeleri)
- **Özel Spor Kompleksleri** (üye yönetimi, online rezervasyon ihtiyacı olan işletmeler)
- **Kamu Kurumları** (rekreasyon alanları, sosyal tesis yönetimleri)

---

## 📞 Demo ve Teklif

Benzer bir tesis yönetim yazılımı ihtiyacınız varsa, **ESTM sistemi** referans alınarak kurumunuza özel çözüm geliştirebiliriz.

👉 **[Canlı sistemi inceleyin](https://sporalanlari.akdeniz.edu.tr)**  
📧 **İletişim:** Demo talebi ve ön görüşme için [iletişim sayfamızdan](/iletisim) bize ulaşabilirsiniz.`,
};

async function main() {
  console.log(`🔍 '${ESTM_SLUG}' projesi aranıyor...`);

  const existingProject = await prisma.project.findUnique({
    where: { slug: ESTM_SLUG },
  });

  if (!existingProject) {
    console.error(`❌ HATA: '${ESTM_SLUG}' projesi veritabanında bulunamadı.`);
    console.log('   Önce seed çalıştırın: npm run db:seed');
    process.exit(1);
  }

  console.log(`✅ Proje bulundu: "${existingProject.title}"`);
  console.log(`🔄 Satış odaklı case study içeriğiyle güncelleniyor...`);

  const updated = await prisma.project.update({
    where: { slug: ESTM_SLUG },
    data: UPDATED_DATA,
  });

  console.log('✅ Güncelleme başarılı!');
  console.log(`   - Yeni başlık: "${updated.title}"`);
  console.log(`   - Teknolojiler: ${Array.isArray(updated.technologies) ? (updated.technologies as string[]).length : 0} adet`);
  console.log(`   - İçerik uzunluğu: ${updated.content.length} karakter`);
  console.log('');
  console.log('🎉 ESTM projesi artık satış odaklı case study formatında!');
  console.log(`   Görüntülemek için: /projelerim/${ESTM_SLUG}`);
}

main()
  .catch((error) => {
    console.error('❌ Güncelleme hatası:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
