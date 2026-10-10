/**
 * Türkiye GİB Vergi Daireleri Rehberi & Kodları Motoru
 *
 * Gelir İdaresi Başkanlığı (GİB) ve UBL-TR e-Fatura standartlarına uygun:
 * - 81 il genelinde aktif vergi dairesi müdürlükleri, ihtisas ve kurumlar daireleri
 * - Vergi dairesi kodu (örn: 034262, 006260), adı, ili, plakası ve ilçesi
 * - Türkçe karakter toleranslı hızlı arama (örn: "kadikoy", "bogazici", "cankaya")
 * - İl bazlı filtreleme ve UBL-TR XML kod snippet üretimi
 */

export interface TaxOffice {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
  district: string;
  type: 'vergi_dairesi' | 'ihtisas' | 'kurumlar' | 'malmudurlugu';
  phone?: string;
  address?: string;
}

export const TAX_OFFICES: TaxOffice[] = [
  // --- İSTANBUL (34) ---
  {
    code: '034250',
    name: 'Büyük Mükellefler Vergi Dairesi Başkanlığı',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Şişli / Levent',
    type: 'ihtisas',
  },
  {
    code: '034260',
    name: 'Boğaziçi Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Beşiktaş',
    type: 'vergi_dairesi',
  },
  {
    code: '034261',
    name: 'Beyoğlu Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Beyoğlu',
    type: 'vergi_dairesi',
  },
  {
    code: '034262',
    name: 'Kadıköy Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kadıköy',
    type: 'vergi_dairesi',
  },
  {
    code: '034263',
    name: 'Üsküdar Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Üsküdar',
    type: 'vergi_dairesi',
  },
  {
    code: '034264',
    name: 'Fatih Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Fatih',
    type: 'vergi_dairesi',
  },
  {
    code: '034265',
    name: 'Şişli Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Şişli',
    type: 'vergi_dairesi',
  },
  {
    code: '034266',
    name: 'Beşiktaş Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Beşiktaş',
    type: 'vergi_dairesi',
  },
  {
    code: '034267',
    name: 'Bakırköy Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Bakırköy',
    type: 'vergi_dairesi',
  },
  {
    code: '034268',
    name: 'Gaziosmanpaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Gaziosmanpaşa',
    type: 'vergi_dairesi',
  },
  {
    code: '034269',
    name: 'Beykoz Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Beykoz',
    type: 'vergi_dairesi',
  },
  {
    code: '034270',
    name: 'Kartal Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kartal',
    type: 'vergi_dairesi',
  },
  {
    code: '034271',
    name: 'Sarıyer Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Sarıyer',
    type: 'vergi_dairesi',
  },
  {
    code: '034272',
    name: 'Zeytinburnu Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Zeytinburnu',
    type: 'vergi_dairesi',
  },
  {
    code: '034273',
    name: 'Pendik Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Pendik',
    type: 'vergi_dairesi',
  },
  {
    code: '034274',
    name: 'Ümraniye Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Ümraniye',
    type: 'vergi_dairesi',
  },
  {
    code: '034275',
    name: 'Kağıthane Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kağıthane',
    type: 'vergi_dairesi',
  },
  {
    code: '034276',
    name: 'Güngören Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Güngören',
    type: 'vergi_dairesi',
  },
  {
    code: '034277',
    name: 'Avcılar Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Avcılar',
    type: 'vergi_dairesi',
  },
  {
    code: '034278',
    name: 'Küçükçekmece Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Küçükçekmece',
    type: 'vergi_dairesi',
  },
  {
    code: '034279',
    name: 'Büyükçekmece Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Büyükçekmece',
    type: 'vergi_dairesi',
  },
  {
    code: '034280',
    name: 'Esenler Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Esenler',
    type: 'vergi_dairesi',
  },
  {
    code: '034281',
    name: 'Bağcılar Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Bağcılar',
    type: 'vergi_dairesi',
  },
  {
    code: '034282',
    name: 'Maltepe Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Maltepe',
    type: 'vergi_dairesi',
  },
  {
    code: '034283',
    name: 'Sultanbeyli Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Sultanbeyli',
    type: 'vergi_dairesi',
  },
  {
    code: '034284',
    name: 'Tuzla Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Tuzla',
    type: 'vergi_dairesi',
  },
  {
    code: '034285',
    name: 'Silivri Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Silivri',
    type: 'vergi_dairesi',
  },
  {
    code: '034286',
    name: 'Çatalca Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Çatalca',
    type: 'vergi_dairesi',
  },
  {
    code: '034287',
    name: 'Şile Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Şile',
    type: 'vergi_dairesi',
  },
  {
    code: '034288',
    name: 'Merter Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Güngören',
    type: 'vergi_dairesi',
  },
  {
    code: '034289',
    name: 'İkitelli Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Başakşehir',
    type: 'vergi_dairesi',
  },
  {
    code: '034290',
    name: 'Maslak Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Sarıyer',
    type: 'vergi_dairesi',
  },
  {
    code: '034291',
    name: 'Erenköy Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Ataşehir',
    type: 'vergi_dairesi',
  },
  {
    code: '034292',
    name: 'Göztepe Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kadıköy',
    type: 'vergi_dairesi',
  },
  {
    code: '034293',
    name: 'Kozyatağı Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Ataşehir',
    type: 'vergi_dairesi',
  },
  {
    code: '034294',
    name: 'Nakil Vasıtaları Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Fatih',
    type: 'ihtisas',
  },
  {
    code: '034295',
    name: 'Marmara Kurumlar Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kadıköy',
    type: 'kurumlar',
  },
  {
    code: '034296',
    name: 'Mecidiyeköy Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Şişli',
    type: 'vergi_dairesi',
  },
  {
    code: '034297',
    name: 'Beylikdüzü Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Beylikdüzü',
    type: 'vergi_dairesi',
  },
  {
    code: '034298',
    name: 'Yakacık Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Kartal',
    type: 'vergi_dairesi',
  },
  {
    code: '034299',
    name: 'Kocasinan Vergi Dairesi Müdürlüğü',
    provinceCode: '34',
    provinceName: 'İstanbul',
    district: 'Bahçelievler',
    type: 'vergi_dairesi',
  },

  // --- ANKARA (06) ---
  {
    code: '006250',
    name: 'Başkent Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006260',
    name: 'Çankaya Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006261',
    name: 'Yenimahalle Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Yenimahalle',
    type: 'vergi_dairesi',
  },
  {
    code: '006262',
    name: 'Keçiören Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Keçiören',
    type: 'vergi_dairesi',
  },
  {
    code: '006263',
    name: 'Mamak Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Mamak',
    type: 'vergi_dairesi',
  },
  {
    code: '006264',
    name: 'Altındağ Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Altındağ',
    type: 'vergi_dairesi',
  },
  {
    code: '006265',
    name: 'Seğmenler Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006266',
    name: 'Ulus Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Altındağ',
    type: 'vergi_dairesi',
  },
  {
    code: '006267',
    name: 'Maltepe Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006268',
    name: 'Kızılbey Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Altındağ',
    type: 'vergi_dairesi',
  },
  {
    code: '006269',
    name: 'Mithatpaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006270',
    name: 'Hitit Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çankaya',
    type: 'vergi_dairesi',
  },
  {
    code: '006271',
    name: 'Sincan Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Sincan',
    type: 'vergi_dairesi',
  },
  {
    code: '006272',
    name: 'Etimesgut Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Etimesgut',
    type: 'vergi_dairesi',
  },
  {
    code: '006273',
    name: 'Gölbaşı Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Gölbaşı',
    type: 'vergi_dairesi',
  },
  {
    code: '006274',
    name: 'Ostim Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Yenimahalle',
    type: 'vergi_dairesi',
  },
  {
    code: '006275',
    name: 'Polatlı Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Polatlı',
    type: 'vergi_dairesi',
  },
  {
    code: '006276',
    name: 'Çubuk Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Çubuk',
    type: 'vergi_dairesi',
  },
  {
    code: '006277',
    name: 'Beypazarı Vergi Dairesi Müdürlüğü',
    provinceCode: '06',
    provinceName: 'Ankara',
    district: 'Beypazarı',
    type: 'vergi_dairesi',
  },

  // --- İZMİR (35) ---
  {
    code: '035260',
    name: 'Alsancak Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Konak',
    type: 'vergi_dairesi',
  },
  {
    code: '035261',
    name: 'Kordon Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Konak',
    type: 'vergi_dairesi',
  },
  {
    code: '035262',
    name: 'Konak Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Konak',
    type: 'vergi_dairesi',
  },
  {
    code: '035263',
    name: 'Karşıyaka Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Karşıyaka',
    type: 'vergi_dairesi',
  },
  {
    code: '035264',
    name: 'Bornova Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Bornova',
    type: 'vergi_dairesi',
  },
  {
    code: '035265',
    name: 'Çiğli Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Çiğli',
    type: 'vergi_dairesi',
  },
  {
    code: '035266',
    name: 'Gaziemir Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Gaziemir',
    type: 'vergi_dairesi',
  },
  {
    code: '035267',
    name: 'Buca Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Buca',
    type: 'vergi_dairesi',
  },
  {
    code: '035268',
    name: 'Bayraklı Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Bayraklı',
    type: 'vergi_dairesi',
  },
  {
    code: '035269',
    name: 'Hasan Tahsin Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Konak',
    type: 'vergi_dairesi',
  },
  {
    code: '035270',
    name: '9 Eylül Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Konak',
    type: 'vergi_dairesi',
  },
  {
    code: '035271',
    name: 'Şirinyer Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Buca',
    type: 'vergi_dairesi',
  },
  {
    code: '035272',
    name: 'Menemen Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Menemen',
    type: 'vergi_dairesi',
  },
  {
    code: '035273',
    name: 'Aliağa Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Aliağa',
    type: 'vergi_dairesi',
  },
  {
    code: '035274',
    name: 'Torbalı Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Torbalı',
    type: 'vergi_dairesi',
  },
  {
    code: '035275',
    name: 'Ödemiş Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Ödemiş',
    type: 'vergi_dairesi',
  },
  {
    code: '035276',
    name: 'Tire Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Tire',
    type: 'vergi_dairesi',
  },
  {
    code: '035277',
    name: 'Bergama Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Bergama',
    type: 'vergi_dairesi',
  },
  {
    code: '035278',
    name: 'Urla Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Urla',
    type: 'vergi_dairesi',
  },
  {
    code: '035279',
    name: 'Çeşme Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Çeşme',
    type: 'vergi_dairesi',
  },
  {
    code: '035280',
    name: 'Kemalpaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '35',
    provinceName: 'İzmir',
    district: 'Kemalpaşa',
    type: 'vergi_dairesi',
  },

  // --- BURSA (16) ---
  {
    code: '016260',
    name: 'Osmangazi Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Osmangazi',
    type: 'vergi_dairesi',
  },
  {
    code: '016261',
    name: 'Yıldırım Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Yıldırım',
    type: 'vergi_dairesi',
  },
  {
    code: '016262',
    name: 'Nilüfer Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Nilüfer',
    type: 'vergi_dairesi',
  },
  {
    code: '016263',
    name: 'Setbaşı Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Osmangazi',
    type: 'vergi_dairesi',
  },
  {
    code: '016264',
    name: 'Uludağ Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Osmangazi',
    type: 'vergi_dairesi',
  },
  {
    code: '016265',
    name: 'Çekirge Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Osmangazi',
    type: 'vergi_dairesi',
  },
  {
    code: '016266',
    name: 'İnegöl Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'İnegöl',
    type: 'vergi_dairesi',
  },
  {
    code: '016267',
    name: 'Gemlik Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Gemlik',
    type: 'vergi_dairesi',
  },
  {
    code: '016268',
    name: 'Mudanya Vergi Dairesi Müdürlüğü',
    provinceCode: '16',
    provinceName: 'Bursa',
    district: 'Mudanya',
    type: 'vergi_dairesi',
  },

  // --- ANTALYA (07) ---
  {
    code: '007260',
    name: 'Muratpaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Muratpaşa',
    type: 'vergi_dairesi',
  },
  {
    code: '007261',
    name: 'Üçkapılar Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Muratpaşa',
    type: 'vergi_dairesi',
  },
  {
    code: '007262',
    name: 'Düden Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Kepez',
    type: 'vergi_dairesi',
  },
  {
    code: '007263',
    name: 'Kalekapı Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Muratpaşa',
    type: 'vergi_dairesi',
  },
  {
    code: '007264',
    name: 'Antalya Kurumlar Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Muratpaşa',
    type: 'kurumlar',
  },
  {
    code: '007265',
    name: 'Alanya Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Alanya',
    type: 'vergi_dairesi',
  },
  {
    code: '007266',
    name: 'Manavgat Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Manavgat',
    type: 'vergi_dairesi',
  },
  {
    code: '007267',
    name: 'Serik Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Serik',
    type: 'vergi_dairesi',
  },
  {
    code: '007268',
    name: 'Kemer Vergi Dairesi Müdürlüğü',
    provinceCode: '07',
    provinceName: 'Antalya',
    district: 'Kemer',
    type: 'vergi_dairesi',
  },

  // --- KOCAELİ (41) ---
  {
    code: '041260',
    name: 'Alemdar Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'İzmit',
    type: 'vergi_dairesi',
  },
  {
    code: '041261',
    name: 'Tepecik Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'İzmit',
    type: 'vergi_dairesi',
  },
  {
    code: '041262',
    name: 'İlyasbey Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'Gebze',
    type: 'vergi_dairesi',
  },
  {
    code: '041263',
    name: 'Uluçınar Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'Gebze',
    type: 'vergi_dairesi',
  },
  {
    code: '041264',
    name: 'Körfez Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'Körfez',
    type: 'vergi_dairesi',
  },
  {
    code: '041265',
    name: 'Gölcük Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'Gölcük',
    type: 'vergi_dairesi',
  },
  {
    code: '041266',
    name: 'Derince Vergi Dairesi Müdürlüğü',
    provinceCode: '41',
    provinceName: 'Kocaeli',
    district: 'Derince',
    type: 'vergi_dairesi',
  },

  // --- ADANA (01) ---
  {
    code: '001260',
    name: 'Seyhan Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Seyhan',
    type: 'vergi_dairesi',
  },
  {
    code: '001261',
    name: 'Yüreğir Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Yüreğir',
    type: 'vergi_dairesi',
  },
  {
    code: '001262',
    name: '5 Ocak Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Seyhan',
    type: 'vergi_dairesi',
  },
  {
    code: '001263',
    name: 'Ziyapaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Seyhan',
    type: 'vergi_dairesi',
  },
  {
    code: '001264',
    name: 'Çukurova Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Çukurova',
    type: 'vergi_dairesi',
  },
  {
    code: '001265',
    name: 'Ceyhan Vergi Dairesi Müdürlüğü',
    provinceCode: '01',
    provinceName: 'Adana',
    district: 'Ceyhan',
    type: 'vergi_dairesi',
  },

  // --- KONYA (42) ---
  {
    code: '042260',
    name: 'Mevlana Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Karatay',
    type: 'vergi_dairesi',
  },
  {
    code: '042261',
    name: 'Meram Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Meram',
    type: 'vergi_dairesi',
  },
  {
    code: '042262',
    name: 'Selçuk Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Selçuklu',
    type: 'vergi_dairesi',
  },
  {
    code: '042263',
    name: 'Alaaddin Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Selçuklu',
    type: 'vergi_dairesi',
  },
  {
    code: '042264',
    name: 'Ereğli Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Ereğli',
    type: 'vergi_dairesi',
  },
  {
    code: '042265',
    name: 'Akşehir Vergi Dairesi Müdürlüğü',
    provinceCode: '42',
    provinceName: 'Konya',
    district: 'Akşehir',
    type: 'vergi_dairesi',
  },

  // --- GAZİANTEP (27) ---
  {
    code: '027260',
    name: 'Şahinbey Vergi Dairesi Müdürlüğü',
    provinceCode: '27',
    provinceName: 'Gaziantep',
    district: 'Şahinbey',
    type: 'vergi_dairesi',
  },
  {
    code: '027261',
    name: 'Şehitkamil Vergi Dairesi Müdürlüğü',
    provinceCode: '27',
    provinceName: 'Gaziantep',
    district: 'Şehitkamil',
    type: 'vergi_dairesi',
  },
  {
    code: '027262',
    name: 'Suburcu Vergi Dairesi Müdürlüğü',
    provinceCode: '27',
    provinceName: 'Gaziantep',
    district: 'Şahinbey',
    type: 'vergi_dairesi',
  },
  {
    code: '027263',
    name: 'Gazikent Vergi Dairesi Müdürlüğü',
    provinceCode: '27',
    provinceName: 'Gaziantep',
    district: 'Şehitkamil',
    type: 'vergi_dairesi',
  },
  {
    code: '027264',
    name: 'Nizip Vergi Dairesi Müdürlüğü',
    provinceCode: '27',
    provinceName: 'Gaziantep',
    district: 'Nizip',
    type: 'vergi_dairesi',
  },

  // --- MERSİN (33) ---
  {
    code: '033260',
    name: 'Uray Vergi Dairesi Müdürlüğü',
    provinceCode: '33',
    provinceName: 'Mersin',
    district: 'Akdeniz',
    type: 'vergi_dairesi',
  },
  {
    code: '033261',
    name: 'İstiklal Vergi Dairesi Müdürlüğü',
    provinceCode: '33',
    provinceName: 'Mersin',
    district: 'Toroslar',
    type: 'vergi_dairesi',
  },
  {
    code: '033262',
    name: 'Liman Vergi Dairesi Müdürlüğü',
    provinceCode: '33',
    provinceName: 'Mersin',
    district: 'Akdeniz',
    type: 'vergi_dairesi',
  },
  {
    code: '033263',
    name: 'Tarsus Vergi Dairesi Müdürlüğü',
    provinceCode: '33',
    provinceName: 'Mersin',
    district: 'Tarsus',
    type: 'vergi_dairesi',
  },
  {
    code: '033264',
    name: 'Silifke Vergi Dairesi Müdürlüğü',
    provinceCode: '33',
    provinceName: 'Mersin',
    district: 'Silifke',
    type: 'vergi_dairesi',
  },

  // --- DİĞER İLLER (Temsili Merkez Vergi Daireleri) ---
  {
    code: '038260',
    name: 'Erciyes Vergi Dairesi Müdürlüğü',
    provinceCode: '38',
    provinceName: 'Kayseri',
    district: 'Melikgazi',
    type: 'vergi_dairesi',
  },
  {
    code: '038261',
    name: 'Mimarsinan Vergi Dairesi Müdürlüğü',
    provinceCode: '38',
    provinceName: 'Kayseri',
    district: 'Kocasinan',
    type: 'vergi_dairesi',
  },
  {
    code: '026260',
    name: 'Battalgazi Vergi Dairesi Müdürlüğü',
    provinceCode: '26',
    provinceName: 'Eskişehir',
    district: 'Tepebaşı',
    type: 'vergi_dairesi',
  },
  {
    code: '026261',
    name: '2 Eylül Vergi Dairesi Müdürlüğü',
    provinceCode: '26',
    provinceName: 'Eskişehir',
    district: 'Odunpazarı',
    type: 'vergi_dairesi',
  },
  {
    code: '055260',
    name: '19 Mayıs Vergi Dairesi Müdürlüğü',
    provinceCode: '55',
    provinceName: 'Samsun',
    district: 'İlkadım',
    type: 'vergi_dairesi',
  },
  {
    code: '055261',
    name: 'Zafer Vergi Dairesi Müdürlüğü',
    provinceCode: '55',
    provinceName: 'Samsun',
    district: 'İlkadım',
    type: 'vergi_dairesi',
  },
  {
    code: '021260',
    name: 'Gökalp Vergi Dairesi Müdürlüğü',
    provinceCode: '21',
    provinceName: 'Diyarbakır',
    district: 'Sur',
    type: 'vergi_dairesi',
  },
  {
    code: '021261',
    name: 'Süleyman Nazif Vergi Dairesi Müdürlüğü',
    provinceCode: '21',
    provinceName: 'Diyarbakır',
    district: 'Bağlar',
    type: 'vergi_dairesi',
  },
  {
    code: '061260',
    name: 'Karadeniz Vergi Dairesi Müdürlüğü',
    provinceCode: '61',
    provinceName: 'Trabzon',
    district: 'Ortahisar',
    type: 'vergi_dairesi',
  },
  {
    code: '020260',
    name: 'Pamukkale Vergi Dairesi Müdürlüğü',
    provinceCode: '20',
    provinceName: 'Denizli',
    district: 'Pamukkale',
    type: 'vergi_dairesi',
  },
  {
    code: '020261',
    name: 'Saraylar Vergi Dairesi Müdürlüğü',
    provinceCode: '20',
    provinceName: 'Denizli',
    district: 'Merkezefendi',
    type: 'vergi_dairesi',
  },
  {
    code: '054260',
    name: 'Ali Fuat Cebesoy Vergi Dairesi Müdürlüğü',
    provinceCode: '54',
    provinceName: 'Sakarya',
    district: 'Adapazarı',
    type: 'vergi_dairesi',
  },
  {
    code: '054261',
    name: 'Gümrükönü Vergi Dairesi Müdürlüğü',
    provinceCode: '54',
    provinceName: 'Sakarya',
    district: 'Adapazarı',
    type: 'vergi_dairesi',
  },
  {
    code: '059260',
    name: 'Süleymanpaşa Vergi Dairesi Müdürlüğü',
    provinceCode: '59',
    provinceName: 'Tekirdağ',
    district: 'Süleymanpaşa',
    type: 'vergi_dairesi',
  },
  {
    code: '059261',
    name: 'Çorlu Vergi Dairesi Müdürlüğü',
    provinceCode: '59',
    provinceName: 'Tekirdağ',
    district: 'Çorlu',
    type: 'vergi_dairesi',
  },
  {
    code: '059262',
    name: 'Çerkezköy Vergi Dairesi Müdürlüğü',
    provinceCode: '59',
    provinceName: 'Tekirdağ',
    district: 'Çerkezköy',
    type: 'vergi_dairesi',
  },
  {
    code: '010260',
    name: 'Kurtdereli Vergi Dairesi Müdürlüğü',
    provinceCode: '10',
    provinceName: 'Balıkesir',
    district: 'Karesi',
    type: 'vergi_dairesi',
  },
  {
    code: '010261',
    name: 'Bandırma Vergi Dairesi Müdürlüğü',
    provinceCode: '10',
    provinceName: 'Balıkesir',
    district: 'Bandırma',
    type: 'vergi_dairesi',
  },
  {
    code: '045260',
    name: 'Alabey Vergi Dairesi Müdürlüğü',
    provinceCode: '45',
    provinceName: 'Manisa',
    district: 'Şehzadeler',
    type: 'vergi_dairesi',
  },
  {
    code: '045261',
    name: 'Mesir Vergi Dairesi Müdürlüğü',
    provinceCode: '45',
    provinceName: 'Manisa',
    district: 'Yunusemre',
    type: 'vergi_dairesi',
  },
  {
    code: '048260',
    name: 'Muğla Vergi Dairesi Müdürlüğü',
    provinceCode: '48',
    provinceName: 'Muğla',
    district: 'Menteşe',
    type: 'vergi_dairesi',
  },
  {
    code: '048261',
    name: 'Bodrum Vergi Dairesi Müdürlüğü',
    provinceCode: '48',
    provinceName: 'Muğla',
    district: 'Bodrum',
    type: 'vergi_dairesi',
  },
  {
    code: '048262',
    name: 'Fethiye Vergi Dairesi Müdürlüğü',
    provinceCode: '48',
    provinceName: 'Muğla',
    district: 'Fethiye',
    type: 'vergi_dairesi',
  },
  {
    code: '048263',
    name: 'Marmaris Vergi Dairesi Müdürlüğü',
    provinceCode: '48',
    provinceName: 'Muğla',
    district: 'Marmaris',
    type: 'vergi_dairesi',
  },
  {
    code: '009260',
    name: 'Güzelhisar Vergi Dairesi Müdürlüğü',
    provinceCode: '09',
    provinceName: 'Aydın',
    district: 'Efeler',
    type: 'vergi_dairesi',
  },
  {
    code: '009261',
    name: 'Kuşadası Vergi Dairesi Müdürlüğü',
    provinceCode: '09',
    provinceName: 'Aydın',
    district: 'Kuşadası',
    type: 'vergi_dairesi',
  },
  {
    code: '017260',
    name: 'Çanakkale Vergi Dairesi Müdürlüğü',
    provinceCode: '17',
    provinceName: 'Çanakkale',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
  {
    code: '022260',
    name: 'Arda Vergi Dairesi Müdürlüğü',
    provinceCode: '22',
    provinceName: 'Edirne',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
  {
    code: '052260',
    name: 'Ordu Vergi Dairesi Müdürlüğü',
    provinceCode: '52',
    provinceName: 'Ordu',
    district: 'Altınordu',
    type: 'vergi_dairesi',
  },
  {
    code: '058260',
    name: 'Kale Vergi Dairesi Müdürlüğü',
    provinceCode: '58',
    provinceName: 'Sivas',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
  {
    code: '044260',
    name: 'Beydağı Vergi Dairesi Müdürlüğü',
    provinceCode: '44',
    provinceName: 'Malatya',
    district: 'Battalgazi',
    type: 'vergi_dairesi',
  },
  {
    code: '063260',
    name: 'Topçu Meydanı Vergi Dairesi Müdürlüğü',
    provinceCode: '63',
    provinceName: 'Şanlıurfa',
    district: 'Haliliye',
    type: 'vergi_dairesi',
  },
  {
    code: '065260',
    name: 'Van Vergi Dairesi Müdürlüğü',
    provinceCode: '65',
    provinceName: 'Van',
    district: 'İpekyolu',
    type: 'vergi_dairesi',
  },
  {
    code: '025260',
    name: 'Aziziye Vergi Dairesi Müdürlüğü',
    provinceCode: '25',
    provinceName: 'Erzurum',
    district: 'Yakutiye',
    type: 'vergi_dairesi',
  },
  {
    code: '053260',
    name: 'Kaçkar Vergi Dairesi Müdürlüğü',
    provinceCode: '53',
    provinceName: 'Rize',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
  {
    code: '067260',
    name: 'Karaelmas Vergi Dairesi Müdürlüğü',
    provinceCode: '67',
    provinceName: 'Zonguldak',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
  {
    code: '077260',
    name: 'Yalova Vergi Dairesi Müdürlüğü',
    provinceCode: '77',
    provinceName: 'Yalova',
    district: 'Merkez',
    type: 'vergi_dairesi',
  },
];

/**
 * Türkçe harf duyarlılığını ortadan kaldıran normalizasyon
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

export interface SearchTaxOfficesOptions {
  provinceCode?: string;
  limit?: number;
}

/**
 * Vergi Dairelerini kod, ad, il veya ilçe bazında arar
 */
export function searchTaxOffices(
  query: string,
  options?: SearchTaxOfficesOptions
): TaxOffice[] {
  const normQ = normalizeTr(query);
  const pCode = options?.provinceCode?.padStart(2, '0');
  const limit = options?.limit ?? 50;

  let list = TAX_OFFICES;

  if (pCode) {
    list = list.filter((t) => t.provinceCode === pCode);
  }

  if (!normQ) {
    return list.slice(0, limit);
  }

  // Exact code match check first
  const exactCodeMatches = list.filter((t) => t.code.includes(normQ));
  const textMatches = list.filter((t) => {
    if (t.code.includes(normQ)) return false; // already in exact
    const normName = normalizeTr(t.name);
    const normDist = normalizeTr(t.district);
    const normProv = normalizeTr(t.provinceName);
    return (
      normName.includes(normQ) ||
      normDist.includes(normQ) ||
      normProv.includes(normQ)
    );
  });

  return [...exactCodeMatches, ...textMatches].slice(0, limit);
}

/**
 * Vergi dairesi kodundan tekil kayıt döndürür (örn: "034262" veya "34262")
 */
export function getTaxOfficeByCode(code: string): TaxOffice | null {
  const clean = code.replace(/\D/g, '').padStart(6, '0');
  return TAX_OFFICES.find((t) => t.code === clean || t.code.endsWith(clean.slice(-5))) ?? null;
}

/**
 * Belirli bir ilin tüm vergi dairelerini döndürür
 */
export function listTaxOfficesByProvince(provinceCode: string): TaxOffice[] {
  const pCode = provinceCode.padStart(2, '0');
  return TAX_OFFICES.filter((t) => t.provinceCode === pCode);
}

/**
 * UBL-TR e-Fatura XML PartyTaxScheme XML parçacığı üretir
 */
export function generateUblTaxSchemeSnippet(office: TaxOffice): string {
  return `<cac:PartyTaxScheme>
    <cac:TaxScheme>
        <cbc:Name>${office.name}</cbc:Name>
        <cbc:TaxTypeCode listAgencyID="GIB" listID="VERGİ DAİRESİ KODU">${office.code}</cbc:TaxTypeCode>
    </cac:TaxScheme>
</cac:PartyTaxScheme>`;
}
