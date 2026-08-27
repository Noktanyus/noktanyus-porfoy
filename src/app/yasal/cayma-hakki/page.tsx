import { Metadata } from 'next';

/**
 * @file Cayma Hakkı Bilgilendirme Sayfası
 * @description 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
 *              Sözleşmeler Yönetmeliği kapsamında cayma hakkı bilgilendirmesi.
 */

export const metadata: Metadata = {
  title: 'Cayma Hakkı',
  description:
    'Mesafeli sözleşmelerde cayma hakkı, süresi, istisnaları ve kullanımı.',
};

export default function CaymaHakkiPage() {
  return (
    <div>
      <h1>Cayma Hakkı</h1>
      <p className="text-sm text-muted-foreground">
        Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
      </p>

      <h2>1. Cayma Hakkının Kapsamı</h2>
      <p>
        6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli
        Sözleşmeler Yönetmeliği kapsamında, mesafeli satış yoluyla satın alınan
        ürünler için cayma hakkı süresi <strong>14 gündür</strong>. Süre,
        sözleşmenin kurulduğu tarihten itibaren başlar.
      </p>

      <h2>2. Dijital Ürünler İçin İstisna</h2>
      <p>
        6502 sayılı Kanun&apos;un 15/ğ maddesi uyarınca,{' '}
        <strong>
          elektronik ortamda anında teslim edilen dijital ürünler
        </strong>{' '}
        (yazılım, lisans anahtarı, e-kitap, çevrimiçi hizmet, abonelik) için
        cayma hakkı <strong>bulunmamaktadır</strong>.
      </p>
      <p>
        Bu istisna, ürünün teslimine başlanmasıyla (indirme bağlantısının
        gönderilmesi, hesap aktifleştirme, çevrimiçi erişimin açılması) birlikte
        geçerli olur. Sipariş onayında bu durum teyit edilir.
      </p>

      <h2>3. Fiziksel Ürünler İçin Cayma Süreci</h2>
      <p>
        Eğer fiziksel bir ürün satışı yapılıyorsa, alıcı 14 gün içinde
        aşağıdaki yöntemle cayma hakkını kullanabilir:
      </p>
      <ul>
        <li>
          <a href="mailto:info@noktanyus.com">info@noktanyus.com</a> adresine
          yazılı bildirim (e-posta yeterlidir)
        </li>
        <li>Ürünün orijinal ambalajında, kullanılmamış halde iade edilmesi</li>
        <li>Kargo ücretinin alıcıya ait olması (cayma hakkı kullanımında)</li>
      </ul>

      <h2>4. İade Bedeli</h2>
      <p>
        Cayma hakkı kullanıldığında, ödeme bedeli{' '}
        <strong>14 iş günü içinde</strong> iade edilir. Stripe üzerinden
        gerçekleştirilen ödemelerde iade, aynı ödeme yöntemiyle yapılır.
      </p>

      <h2>5. Cayma Hakkı Kullanılamayacak Durumlar</h2>
      <ul>
        <li>Dijital ürünler (yazılım, lisans, e-kitap, çevrimiçi hizmet)</li>
        <li>Tesliminden sonra açılmış/kullanılmış yazılım ambalajları</li>
        <li>Tek kullanımlık indirme bağlantıları kullanıldıktan sonra</li>
        <li>Süresi geçmiş abonelikler</li>
        <li>Kişiye özel üretilmiş / yapılandırılmış ürünler</li>
      </ul>

      <h2>6. Ürün Kusuru ve Ayıplı Mal</h2>
      <p>
        Cayma hakkı kullanılamıyor olsa bile, ürün kusurlu ise veya hizmet
        sunulmamışsa aşağıdaki seçeneklerden biri uygulanır:
      </p>
      <ul>
        <li>Ürün değişimi</li>
        <li>Alternatif ürün sunumu</li>
        <li>Para iadesi (Stripe üzerinden, 14 iş günü içinde)</li>
      </ul>

      <h2>7. İletişim</h2>
      <p>
        Cayma hakkı veya iade süreciyle ilgili sorularınız için{' '}
        <a href="mailto:info@noktanyus.com">info@noktanyus.com</a> üzerinden
        bizimle iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
