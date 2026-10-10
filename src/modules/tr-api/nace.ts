/**
 * Türkiye NACE Kodu & İSG Tehlike Sınıfı Rehberi ve Arama Motoru
 *
 * TOBB, GİB ve Çalışma ve Sosyal Güvenlik Bakanlığı standartlarında:
 * - 6 haneli resmi NACE Rev.2 faaliyet kodları
 * - Resmi faaliyet tanımı ve sektör grubu
 * - 6331 Sayılı İSG Kanunu uyarınca Tehlike Sınıfı: Az Tehlikeli, Tehlikeli, Çok Tehlikeli
 * - Türkçe karakter toleranslı fuzzy arama ve koddan doğrudan lookup
 */

export type DangerLevel = 'az_tehlikeli' | 'tehlikeli' | 'cok_tehlikeli';

export interface NaceItem {
  code: string; // 6 haneli format: "62.01.01"
  rawCode: string; // "620101"
  name: string; // Faaliyet açıklaması
  sector: string; // Üst sektör (Bilişim, Ticaret, İmalat vb.)
  dangerLevel: DangerLevel;
  dangerLevelName: string;
  osgbObligation: string; // İSG Uzmanı / Hekim çalıştırma yükümlülük açıklaması
}

export const NACE_CATALOG: NaceItem[] = [
  // --- BİLİŞİM, YAZILIM & TELEKOMÜNİKASYON ---
  {
    code: '62.01.01',
    rawCode: '620101',
    name: 'Bilgisayar programlama faaliyetleri (sistem, veri tabanı, network, web sitesi vb. yazılımları ile müşteriye özel yazılımların kodlanması)',
    sector: 'Bilgi ve İletişim / Yazılım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu. 50 altı çalışan için işveren e-sertifika ile üstlenebilir.',
  },
  {
    code: '62.02.01',
    rawCode: '620201',
    name: 'Bilgisayar danışmanlık faaliyetleri (donanım gereksinimleri gibi teknik konularda ticari müşavirlik vb.)',
    sector: 'Bilgi ve İletişim / Yazılım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '62.03.01',
    rawCode: '620301',
    name: 'Bilgisayar tesisleri yönetim faaliyetleri',
    sector: 'Bilgi ve İletişim / Yazılım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '62.09.01',
    rawCode: '620901',
    name: 'Diğer bilgi teknolojisi ve bilgisayar hizmet faaliyetleri (kişisel bilgisayarların ve yazılımların kurulumu vb.)',
    sector: 'Bilgi ve İletişim / Yazılım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '63.11.08',
    rawCode: '631108',
    name: 'Veri işleme, barındırma (hosting) ve ilgili faaliyetler (veri tabanı sağlama, web hosting, streaming vb.)',
    sector: 'Bilgi ve İletişim / Sunucu & Hosting',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '63.12.01',
    rawCode: '631201',
    name: 'Web portalları faaliyetleri',
    sector: 'Bilgi ve İletişim / İnternet',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },

  // --- E-TİCARET & PAREKENDE ---
  {
    code: '47.91.14',
    rawCode: '479114',
    name: 'Radyo, TV, posta yoluyla veya internet üzerinden yapılan perakende ticaret (e-ticaret, pazaryeri satıcıları)',
    sector: 'Ticaret / E-Ticaret',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '47.41.01',
    rawCode: '474101',
    name: 'Belirli bir mala tahsis edilmiş mağazalarda bilgisayarların, çevre donanımlarının ve yazılımların perakende ticareti',
    sector: 'Ticaret / Perakende',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '47.71.01',
    rawCode: '477101',
    name: 'Belirli bir mala tahsis edilmiş mağazalarda giyim eşyalarının perakende ticareti',
    sector: 'Ticaret / Giyim',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '47.75.01',
    rawCode: '477501',
    name: 'Belirli bir mala tahsis edilmiş mağazalarda kozmetik ve kişisel bakım malzemelerinin perakende ticareti',
    sector: 'Ticaret / Kozmetik',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },

  // --- REKLAMCILIK, MEDYA & PAZARLAMA ---
  {
    code: '73.11.01',
    rawCode: '731101',
    name: 'Reklam ajanslarının faaliyetleri (kullanılacak medyanın seçimi, reklamın tasarımı, illüstrasyon, broşür, dijital pazarlama vb.)',
    sector: 'Mesleki, Bilimsel ve Teknik / Reklam & Tasarım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '73.12.02',
    rawCode: '731202',
    name: 'Çeşitli medya reklamları için alan ve zamanın temsilciler vasıtasıyla satışı',
    sector: 'Mesleki, Bilimsel ve Teknik / Reklam',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '74.10.01',
    rawCode: '741001',
    name: 'Uzmanlaşmış grafik tasarımcılarının faaliyetleri (grafik tasarım, web arayüz tasarımı, logo, kurumsal kimlik)',
    sector: 'Mesleki, Bilimsel ve Teknik / Tasarım',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '74.20.25',
    rawCode: '742025',
    name: 'Ticari fotoğrafçılık faaliyetleri (ürün, moda, reklam ve benzeri amaçlı fotoğraf çekimi)',
    sector: 'Mesleki, Bilimsel ve Teknik / Fotoğrafçılık',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },

  // --- DANIŞMANLIK, HUKUK & FİNANS ---
  {
    code: '70.22.02',
    rawCode: '702202',
    name: 'İşletme ve diğer idari danışmanlık faaliyetleri (strateji, organizasyon, süreç optimizasyonu, insan kaynakları danışmanlığı)',
    sector: 'Mesleki, Bilimsel ve Teknik / Danışmanlık',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '69.20.01',
    rawCode: '692001',
    name: 'Muhasebe, defter tutma ve denetim faaliyetleri; vergi müşavirliği (mali müşavirlik, yeminli mali müşavirlik)',
    sector: 'Mesleki, Bilimsel ve Teknik / Muhasebe',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '69.10.01',
    rawCode: '691001',
    name: 'Hukuk danışmanlığı ve avukatlık faaliyetleri',
    sector: 'Mesleki, Bilimsel ve Teknik / Hukuk',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '74.90.04',
    rawCode: '749004',
    name: 'Yeminli tercüme ve çeviri faaliyetleri (yazılı ve sözlü tercüme)',
    sector: 'Mesleki, Bilimsel ve Teknik / Tercüme',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },

  // --- LOJİSTİK, TAŞIMACILIK & KARGO ---
  {
    code: '53.20.09',
    rawCode: '532009',
    name: 'Kurye faaliyetleri (kara, deniz ve hava yolu kuryeleri, kargo ve paket teslimatı, moto kuryeler)',
    sector: 'Ulaştırma ve Depolama / Kargo & Kurye',
    dangerLevel: 'tehlikeli',
    dangerLevelName: 'Tehlikeli',
    osgbObligation: 'Çalışan sayısına bakılmaksızın (1 çalışan dahi olsa) İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
  {
    code: '49.41.01',
    rawCode: '494101',
    name: 'Karayolu ile şehirler arası ve uluslararası yük taşımacılığı (kamyon, çekici vb. ile)',
    sector: 'Ulaştırma ve Depolama / Lojistik',
    dangerLevel: 'tehlikeli',
    dangerLevelName: 'Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
  {
    code: '52.10.02',
    rawCode: '521002',
    name: 'Depolama ve antrepo faaliyetleri (soğuk hava deposu, gümrük antreposu vb.)',
    sector: 'Ulaştırma ve Depolama / Depolama',
    dangerLevel: 'tehlikeli',
    dangerLevelName: 'Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },

  // --- YEME-İÇME & HİZMET ---
  {
    code: '56.10.08',
    rawCode: '561008',
    name: 'Diğer lokanta ve restoranların faaliyetleri (garsonlu servis sunanlar hariç fast-food, pide, döner vb.)',
    sector: 'Konaklama ve Yiyecek / Restoran',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },
  {
    code: '56.30.02',
    rawCode: '563002',
    name: 'Çay ocakları, kahvehaneler ve kafelerin faaliyetleri',
    sector: 'Konaklama ve Yiyecek / Kafe',
    dangerLevel: 'az_tehlikeli',
    dangerLevelName: 'Az Tehlikeli',
    osgbObligation: '50 ve üzeri çalışanda İSG uzmanı zorunlu.',
  },

  // --- İMALAT & SANAYİ (Tehlikeli / Çok Tehlikeli) ---
  {
    code: '14.13.01',
    rawCode: '141301',
    name: 'Dış giyim eşyası imalatı (ceket, takım elbise, palto vb. dokuma kumaştan konfeksiyon)',
    sector: 'İmalat / Tekstil & Konfeksiyon',
    dangerLevel: 'tehlikeli',
    dangerLevelName: 'Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
  {
    code: '25.62.01',
    rawCode: '256201',
    name: 'Metallere makinede şekil verme ve işleme (torna, freze, CNC ile mekanik parçalar üretimi)',
    sector: 'İmalat / Metal & Talaşlı İmalat',
    dangerLevel: 'cok_tehlikeli',
    dangerLevelName: 'Çok Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa (A veya B sınıfı) İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
  {
    code: '41.20.02',
    rawCode: '412002',
    name: 'İkamet amaçlı binaların inşaatı (müstakil konutlar, çok aileli binalar, gökdelenler vb.)',
    sector: 'İnşaat / Bina İnşaatı',
    dangerLevel: 'cok_tehlikeli',
    dangerLevelName: 'Çok Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa A sınıfı İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
  {
    code: '43.21.01',
    rawCode: '432101',
    name: 'Bina ve diğer inşaat projelerinde elektrik tesisatı ve aydınlatma sistemleri kurulumu',
    sector: 'İnşaat / Tesisat',
    dangerLevel: 'cok_tehlikeli',
    dangerLevelName: 'Çok Tehlikeli',
    osgbObligation: '1 çalışan dahi olsa A sınıfı İSG uzmanı ve işyeri hekimi ZORUNLUDUR.',
  },
];

/**
 * Türkçe harf normalizasyonu
 */
function normalizeTr(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

export interface SearchNaceOptions {
  sector?: string;
  dangerLevel?: DangerLevel;
  limit?: number;
}

/**
 * NACE kodlarını kod, ad veya sektöre göre arar
 */
export function searchNace(query: string, options?: SearchNaceOptions): NaceItem[] {
  const normQ = normalizeTr(query);
  const cleanCodeQ = query.replace(/\D/g, '');
  const limit = options?.limit ?? 50;

  let list = NACE_CATALOG;

  if (options?.dangerLevel) {
    list = list.filter((n) => n.dangerLevel === options.dangerLevel);
  }

  if (options?.sector) {
    const normSec = normalizeTr(options.sector);
    list = list.filter((n) => normalizeTr(n.sector).includes(normSec));
  }

  if (!normQ) {
    return list.slice(0, limit);
  }

  // Exact or prefix code match
  const codeMatches = list.filter(
    (n) => n.rawCode.startsWith(cleanCodeQ) || n.code.startsWith(query)
  );

  // Text matches
  const textMatches = list.filter((n) => {
    if (n.rawCode.startsWith(cleanCodeQ) || n.code.startsWith(query)) return false;
    const normName = normalizeTr(n.name);
    const normSector = normalizeTr(n.sector);
    return normName.includes(normQ) || normSector.includes(normQ);
  });

  return [...codeMatches, ...textMatches].slice(0, limit);
}

/**
 * 6 haneli koddan doğrudan tekil NACE kaydı getirir (örn: "62.01.01" veya "620101")
 */
export function getNaceByCode(code: string): NaceItem | null {
  const clean = code.replace(/\D/g, '');
  return NACE_CATALOG.find((n) => n.rawCode === clean || n.code === code) ?? null;
}
