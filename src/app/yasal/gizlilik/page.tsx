import { Metadata } from 'next';

/**
 * @file Gizlilik Politikası Sayfası
 * @description Kişisel verilerin toplanması, kullanılması, saklanması ve
 *              korunmasına ilişkin genel gizlilik politikası.
 */

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description:
    'Kişisel verilerin toplanması, kullanılması ve korunmasına ilişkin gizlilik politikası.',
};

export default function GizlilikPage() {
  return (
    <div>
      <h1>Gizlilik Politikası</h1>
      <p className="text-sm text-muted-foreground">
        Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
      </p>

      <h2>1. Genel Bilgilendirme</h2>
      <p>
        Bu gizlilik politikası, <strong>noktanyus.com</strong> üzerinden
        toplanan kişisel verilerin 6698 sayılı KVKK ve ilgili mevzuat
        kapsamında nasıl işlendiğini açıklar. Detaylı aydınlatma için{' '}
        <a href="/yasal/kvkk">KVKK Aydınlatma Metni</a>&apos;ni inceleyiniz.
      </p>

      <h2>2. Toplanan Veriler</h2>
      <ul>
        <li>
          <strong>İletişim formu:</strong> Ad-soyad, e-posta, mesaj içeriği
        </li>
        <li>
          <strong>Otomatik toplanan:</strong> IP adresi, tarayıcı bilgisi,
          ziyaret edilen sayfalar (anonim analytics)
        </li>
        <li>
          <strong>Hesap (varsa):</strong> E-posta, kullanıcı adı, şifre
          (hash&apos;li)
        </li>
        <li>
          <strong>Ödeme:</strong> Stripe üzerinden işlenir; tarafımızca
          saklanmaz
        </li>
      </ul>

      <h2>3. Verilerin Kullanım Amaçları</h2>
      <ul>
        <li>İletişim taleplerinin yanıtlanması</li>
        <li>Hizmet sunumu ve sözleşme süreçleri</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        <li>Site performansının ve kullanıcı deneyiminin iyileştirilmesi</li>
        <li>Güvenlik ve dolandırıcılık önleme</li>
      </ul>

      <h2>4. Verilerin Paylaşımı</h2>
      <p>
        Kişisel verileriniz, hizmet sunumu için gerekli olan aşağıdaki
        üçüncü taraflarla sınırlı olarak paylaşılabilir:
      </p>
      <ul>
        <li>
          <strong>Stripe:</strong> Güvenli ödeme altyapısı (PCI-DSS sertifikalı)
        </li>
        <li>
          <strong>Cloudflare:</strong> CDN ve güvenlik
        </li>
        <li>
          <strong>Hosting sağlayıcısı:</strong> Sunucu barındırma
        </li>
        <li>
          <strong>Analytics sağlayıcıları:</strong> Anonim kullanım istatistikleri
        </li>
      </ul>
      <p>
        Verileriniz pazarlama amacıyla üçüncü taraflara satılmaz veya
        paylaşılmaz.
      </p>

      <h2>5. Veri Güvenliği</h2>
      <p>
        Kişisel verileriniz aşağıdaki teknik ve idari tedbirlerle korunur:
      </p>
      <ul>
        <li>HTTPS / TLS şifreleme</li>
        <li>Şifrelerin bcrypt ile hash&apos;lenmesi</li>
        <li>OAuth 2.0 / OIDC kimlik doğrulama akışları</li>
        <li>Düzenli güvenlik yamaları ve bağımlılık güncellemeleri</li>
        <li>Erişim kayıtları (audit log)</li>
        <li>Rate limiting ve brute-force koruması</li>
      </ul>

      <h2>6. Çerezler</h2>
      <p>
        Çerez kullanımı hakkında detaylı bilgi için{' '}
        <a href="/yasal/cerez-politikasi">Çerez Politikası</a>&apos;nı
        inceleyiniz.
      </p>

      <h2>7. Çocukların Gizliliği</h2>
      <p>
        Sitemiz 18 yaşından küçük kullanıcılardan bilerek kişisel veri
        toplamaz. Ebeveynler böyle bir durum tespit ederse{' '}
        <a href="mailto:info@noktanyus.com">info@noktanyus.com</a> üzerinden
        bizimle iletişime geçebilir.
      </p>

      <h2>8. Haklarınız</h2>
      <p>
        KVKK Madde 11 kapsamındaki haklarınızı kullanmak için{' '}
        <a href="/yasal/kvkk">KVKK Aydınlatma Metni</a>&apos;nin &quot;Başvuru
        Yöntemi&quot; bölümüne bakabilirsiniz.
      </p>

      <h2>9. Politikadaki Değişiklikler</h2>
      <p>
        Bu gizlilik politikası güncellendiğinde değişiklikler bu sayfada
        yayımlanacak ve &quot;Son güncelleme&quot; tarihi güncellenecektir.
        Önemli değişikliklerde kullanıcılara ek bildirim yapılabilir.
      </p>
    </div>
  );
}
