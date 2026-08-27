import { Metadata } from 'next';

/**
 * @file Çerez Politikası Sayfası
 * @description 6698 sayılı KVKK ve 5809 sayılı Elektronik Haberleşme Kanunu
 *              kapsamında çerez kullanım politikası.
 */

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description:
    'Web sitemizde kullanılan çerezler, amaçları ve yönetim seçenekleri.',
};

export default function CerezPolitikasiPage() {
  return (
    <div>
      <h1>Çerez Politikası</h1>
      <p className="text-sm text-muted-foreground">
        Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
      </p>

      <h2>1. Çerez Nedir?</h2>
      <p>
        Çerezler (cookies), web sitelerinin tarayıcınızda sakladığı küçük
        metin dosyalarıdır. Ziyaret deneyiminizi iyileştirmek, site
        performansını ölçmek ve tercihlerinizi hatırlamak için kullanılır.
      </p>

      <h2>2. Kullandığımız Çerez Türleri</h2>

      <h3>2.1. Zorunlu Çerezler</h3>
      <p>
        Sitenin temel işlevleri için gereklidir (oturum, tema tercihi, güvenlik
        token&apos;ı). Bu çerezler devre dışı bırakılamaz.
      </p>

      <h3>2.2. Performans ve Analitik Çerezler</h3>
      <p>
        Ziyaretçilerin siteyi nasıl kullandığını anlamak için anonim istatistik
        toplar (sayfa görüntüleme, oturum süresi). Google Analytics ve/veya
        Yandex Metrica kullanılabilir.
      </p>

      <h3>2.3. Tercih Çerezleri</h3>
      <p>
        Tema (açık/koyu mod), dil ve diğer kullanıcı tercihlerini hatırlar.
      </p>

      <h2>3. Üçüncü Taraf Çerezleri</h2>
      <p>
        Aşağıdaki hizmet sağlayıcılar kendi çerezlerini yerleştirebilir:
      </p>
      <ul>
        <li>
          <strong>Stripe:</strong> Güvenli ödeme için zorunlu çerezler
        </li>
        <li>
          <strong>Cloudflare:</strong> Güvenlik ve performans çerezleri
        </li>
        <li>
          <strong>Google Analytics / Yandex Metrica:</strong> Anonim analitik
        </li>
      </ul>

      <h2>4. Çerezleri Yönetme</h2>
      <p>
        Tarayıcınızın ayarlarından çerezleri yönetebilir, silebilir veya
        engelleyebilirsiniz. Yaygın tarayıcılar için yönergeler:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/tr/kb/cerezleri-silme-web-sitelerinin-bilgilerini-kaldirma"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/tr-tr/guide/safari/sfri11447/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
      </ul>
      <p>
        <strong>Not:</strong> Çerezleri engellemek site fonksiyonlarının bir
        kısmını çalışmaz hale getirebilir.
      </p>

      <h2>5. Çerez Saklama Süreleri</h2>
      <ul>
        <li>Oturum çerezleri: Tarayıcı kapatılınca silinir</li>
        <li>Kalıcı çerezler: Maksimum 2 yıl</li>
        <li>Analitik çerezleri: Hizmet sağlayıcı politikasına göre</li>
      </ul>

      <h2>6. Değişiklikler</h2>
      <p>
        Bu çerez politikası güncellendiğinde değişiklikler bu sayfada
        yayımlanacak ve &quot;Son güncelleme&quot; tarihi güncellenecektir.
      </p>
    </div>
  );
}
