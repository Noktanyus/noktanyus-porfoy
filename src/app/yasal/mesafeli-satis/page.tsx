import { Metadata } from 'next';

/**
 * @file Mesafeli Satış Sözleşmesi Sayfası
 * @description 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
 *              Sözleşmeler Yönetmeliği kapsamında ön bilgilendirme formu.
 */

export const metadata: Metadata = {
  title: 'Mesafeli Satış Sözleşmesi',
  description: 'Mesafeli satış sözleşmesi ön bilgilendirme formu',
};

export default function MesafeliSatisPage() {
  return (
    <div>
      <h1>Mesafeli Satış Sözleşmesi</h1>
      <p className="text-sm text-muted-foreground">
        Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
      </p>

      <h2>1. Taraflar</h2>
      <p>
        <strong>Satıcı:</strong> Yunus Tuğhan
      </p>
      <p>
        <strong>Alıcı:</strong> Sözleşmeyi elektronik ortamda onaylayan müşteri
      </p>

      <h2>2. Sözleşme Konusu</h2>
      <p>
        İşbu sözleşme, Alıcı&apos;nın Satıcı&apos;ya ait{' '}
        <strong>noktanyus.com</strong> üzerinden elektronik ortamda sipariş
        ettiği dijital ürünlerin (yazılım, e-kitap, şablon, lisans anahtarı,
        çevrimiçi hizmet) satışı ve teslimine ilişkin tarafların hak ve
        yükümlülüklerini düzenler.
      </p>

      <h2>3. Ürün Bilgileri</h2>
      <p>
        Ürün adı, açıklaması, vergiler dahil satış fiyatı, teslimat şekli ve
        süresi gibi bilgiler sipariş sayfasında açıkça belirtilir.
      </p>

      <h2>4. Teslimat</h2>
      <ul>
        <li>
          <strong>Dijital ürünler:</strong> Ödeme onayından sonra e-posta ile
          gönderilen indirme bağlantısı (signed URL, 72 saat geçerli) veya
          hesap paneli üzerinden anında erişim.
        </li>
        <li>
          <strong>Lisans anahtarları:</strong> Hesap panelinde otomatik
          aktifleştirme.
        </li>
        <li>
          <strong>Danışmanlık / Coaching:</strong> Calendly üzerinden randevu.
        </li>
      </ul>

      <h2>5. Ödeme</h2>
      <p>
        Ödeme Stripe altyapısı ile güvenli olarak gerçekleştirilir. Kredi kartı
        bilgileri sitemizde saklanmaz; doğrudan Stripe&apos;ın PCI-DSS
        sertifikalı altyapısına iletilir.
      </p>

      <h2>6. Cayma Hakkı</h2>
      <p>
        <strong>Dijital ürünler için istisna:</strong> 6502 sayılı Tüketicinin
        Korunması Hakkında Kanun&apos;un 15/ğ maddesi uyarınca, elektronik
        ortamda anında teslim edilen dijital ürünler (yazılım, lisans, e-kitap,
        çevrimiçi hizmet) için cayma hakkı <strong>kullanılamaz</strong>.
      </p>
      <p>
        Cayma hakkının istisnası, sipariş onayında &quot;Cayma hakkının
        bulunmadığını kabul ediyorum&quot; checkbox&apos;ı ile teyit edilir.
      </p>

      <h2>7. İade ve Geri Ödeme</h2>
      <p>Ürün kusurlu ise veya hizmet sunulmamışsa, duruma göre:</p>
      <ul>
        <li>Ürün değişimi</li>
        <li>Alternatif ürün sunumu</li>
        <li>Para iadesi (Stripe üzerinden, 14 iş günü içinde)</li>
      </ul>

      <h2>8. KVKK ve Gizlilik</h2>
      <p>
        Kişisel verileriniz{' '}
        <a href="/yasal/kvkk">KVKK aydınlatma metni</a> kapsamında işlenir.
      </p>

      <h2>9. Uyuşmazlık Çözümü</h2>
      <p>
        İşbu sözleşmeden doğan uyuşmazlıklarda Tüketici Hakem Heyetleri ve
        Tüketici Mahkemeleri yetkilidir. Online uyuşmazlık çözümü için{' '}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          AB ODR platformu
        </a>{' '}
        bilgilendirme amaçlıdır.
      </p>

      <h2>10. Yürürlük</h2>
      <p>
        İşbu sözleşme, Alıcı tarafından elektronik ortamda onaylandığı anda
        yürürlüğe girer.
      </p>
    </div>
  );
}
