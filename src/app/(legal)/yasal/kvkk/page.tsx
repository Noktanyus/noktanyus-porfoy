import { Metadata } from 'next';

/**
 * @file KVKK Aydınlatma Metni Sayfası
 * @description 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında
 *              aydınlatma metni.
 */

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni | Noktanyus',
  description:
    '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
  alternates: {
    canonical: 'https://noktanyus.com/yasal/kvkk',
  },
};

export default function KvkkPage() {
  return (
    <div>
      <h1>KVKK Aydınlatma Metni</h1>
      <p className="text-sm text-muted-foreground">
        Son güncelleme: 13 Eylül 2026
      </p>

      <h2>1. Veri Sorumlusu</h2>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca,
        kişisel verileriniz veri sorumlusu sıfatıyla{' '}
        <strong>Yunus Tuğhan</strong> tarafından aşağıda açıklanan kapsamda
        işlenebilecektir.
      </p>

      <h2>2. Toplanan Kişisel Veriler</h2>
      <ul>
        <li>
          <strong>İletişim Formu:</strong> Ad-soyad, e-posta adresi, mesaj içeriği
        </li>
        <li>
          <strong>Çerezler:</strong> Ziyaret geçmişi, tercihler (anonim analytics)
        </li>
        <li>
          <strong>Hesap (varsa):</strong> E-posta, ad-soyad, ödeme bilgileri
          (birincil olarak PayTR üzerinden işlenir; tarafımızca saklanmaz)
        </li>
      </ul>

      <h2>3. İşleme Amaçları</h2>
      <ul>
        <li>İletişim taleplerinin yanıtlanması</li>
        <li>Hizmet sunumu ve sözleşme süreçleri</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        <li>Site performansının iyileştirilmesi (anonim analytics)</li>
      </ul>

      <h2>4. Verilerin Aktarımı</h2>
      <p>
        Ödeme işlemleri, yurt içinde yerleşik ve BDDK lisanslı ödeme kuruluşu{' '}
        <strong>PayTR</strong> altyapısı üzerinden gerçekleştirilir; bu nedenle
        ödeme verileri kural olarak Türkiye&apos;de işlenir. PayTR&apos;nin
        kullanılamadığı durumlarda alternatif/yedek olarak iyzico (yurt içi)
        veya Stripe (yurt dışı) altyapısı devreye alınabilir.
      </p>
      <p>
        Kişisel verileriniz ayrıca yurtdışı merkezli hizmet sağlayıcılarla
        (Cloudflare, hosting, analytics) sınırlı olarak paylaşılabilir. Yurt
        dışına yapılan aktarımlar KVKK Madde 9 kapsamında açık rıza veya
        sözleşme zorunluluğu çerçevesinde gerçekleştirilir.
      </p>

      <h2>5. Veri Saklama Süresi</h2>
      <ul>
        <li>İletişim mesajları: 2 yıl</li>
        <li>Çerezler: Maksimum 2 yıl</li>
        <li>Hesap verileri: Hesap silme talebinden itibaren 30 gün</li>
      </ul>

      <h2>6. KVKK Madde 11 Uyarınca Haklarınız</h2>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>
          İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
        </li>
        <li>Yurt içinde/dışında aktarıldığı 3. kişileri öğrenme</li>
        <li>Eksik/yanlış işlenen verilerin düzeltilmesini isteme</li>
        <li>Şartlar oluştuğunda silinmesini/yok edilmesini isteme</li>
        <li>
          Otomatik sistemlerle aleyhine sonuç doğan analizlere itiraz etme
        </li>
        <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
      </ul>

      <h2>7. Başvuru Yöntemi</h2>
      <p>
        Yukarıda belirtilen haklarınızı kullanmak için{' '}
        <a href="mailto:info@noktanyus.com">info@noktanyus.com</a> adresine
        kimliğinizi tevsik edici belgelerle birlikte yazılı başvuruda
        bulunabilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.
      </p>

      <h2>8. Değişiklikler</h2>
      <p>
        Bu aydınlatma metni güncellendiğinde, değişiklikler bu sayfada
        yayımlanacak ve &quot;Son güncelleme&quot; tarihi güncellenecektir.
      </p>
    </div>
  );
}
