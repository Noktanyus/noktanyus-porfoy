---
title: 'Jellyfin: Medya Sunucumu Evde Nasıl Kurdum?'
slug: jellyfin-medya-sunucumu-evde-nasl-kurdum
description: >-
  Evde Medya Sunucusu Kurulumu: Jellyfin Deneyimim

  Kendi evimde kurduğum Linux sunucumda, Jellyfin ile güçlü ve tamamen bana ait
  bir medya sunucusu oluşturdum. Ücretsiz, açık kaynaklı ve %100 kontrolün bende
  olduğu bu sistemle artık filmler, diziler ve müzikler parmaklarımın ucunda!
mainImage: /api/images/21cc19fc-cf00-4ed2-8ceb-513252ff7a8d.webp
technologies:
  - jellyfin
  - debian
  - linux
liveDemo: 'https://film.noktanyus.com'
githubRepo: 'https://github.com/jellyfin/jellyfin'
order: 10
featured: false
isLive: false
content: "# \U0001F9E9 Proje: Evde Kişisel Medya Sunucusu (Jellyfin + Linux)\n\n## \U0001F3AF Proje Amacı\n\nBu projede, kendi donanımım üzerinde Linux sunucu kullanarak tamamen bana ait ve dışa bağımsız çalışan bir **medya sunucusu altyapısı** kurdum. Amacım, medya içeriklerime (film, dizi, müzik vb.) cihaz ve konum bağımsız olarak erişebilmek; aynı zamanda veri gizliliğini ve kontrolü tamamen kendi elime almaktı.\n\n## \U0001F527 Kullanılan Teknolojiler\n\n| Teknoloji | Açıklama |\n|----------|----------|\n| **Jellyfin** | Açık kaynak medya sunucusu (Plex alternatifi) |\n| **Linux (Debian tabanlı)** | Sunucu işletim sistemi |\n| **Let's Encrypt + Reverse Proxy** | HTTPS ile güvenli dış erişim |\n| **DDNS** | Dinamik IP yerine alan adıyla erişim |\n| **Fail2ban + Güvenlik Katmanları** | SSH ve web güvenliği için önlemler |\n| **1TB HDD + SSD** | Medya ve sistem dosyaları için ayrı disk yapısı |\n\n## \U0001F6E0️ Gerçekleştirilen İşlemler\n\n- Linux sunucu kurulumu ve temel güvenlik yapılandırmaları (SSH, kullanıcı izinleri, güvenlik duvarı).\n- Jellyfin kurulumu ve servis olarak sistem başlangıcına eklenmesi.\n- Reverse proxy yapılandırmasıyla HTTPS üzerinden dış erişim.\n- DDNS hizmetiyle ev dışından domain üzerinden bağlantı kurulumu.\n- Farklı cihazlardan (TV, telefon, tablet) test ve medya oynatma senaryoları.\n- Aile üyeleri için kullanıcı hesapları ve medya erişim yetkilendirmeleri.\n- Yedekleme ve sistem güncelleme rutinlerinin oluşturulması.\n\n## \U0001F4C2 Projenin Öne Çıkan Yönleri\n\n- Tüm medya arşivimin **tek merkezde toplanması ve kategorize edilmesi**.\n- Tamamen **ücretsiz ve lisanssız** çalışan sistem mimarisi.\n- **Kendi evimde barındırdığım fiziksel sunucu** sayesinde %100 veri kontrolü.\n- Düşük donanım tüketimi ile optimize edilmiş yapı.\n- Web tarayıcı, mobil uygulama ve TV destekli geniş platform erişimi.\n- Kurumsal seviyede güvenlik için temel önlemler alınmış yapı.\n\n## \U0001F512 Güvenlik Önlemleri\n\n- SSH erişimi için port değişimi ve fail2ban kurulumu.\n- Reverse proxy üzerinden HTTPS desteği (Let's Encrypt).\n- Jellyfin kullanıcı yönetimi ve parola politikaları.\n- Güvenlik duvarı ve bağlantı trafiği loglama.\n\n## \U0001F4C8 Kazanımlar\n\n- Ağ ve sistem yönetimi konularında ileri seviye deneyim.\n- Medya sunucusu yapılandırma ve bakım süreçlerinin öğrenilmesi.\n- Docker’sız doğrudan servis kurulumlarının stabilitesinin test edilmesi.\n- Gerçek zamanlı medya oynatımı ve transcode performans ölçümleri.\n- Kendi sistemimi dışarıya kapatmadan ama kontrolü kaybetmeden açma tecrübesi.\n\n\n## \U0001F51A Sonuç\n\nBu proje ile hem sistem yönetimi konusundaki bilgilerimi uygulamalı olarak geliştirdim hem de kendi medya sunucumu inşa ederek uzun vadeli kullanıma uygun, güvenli ve özelleştirilebilir bir platform oluşturdum. Jellyfin’in esnek yapısı ve Linux’un kararlılığı sayesinde bu sistem, hem teknik bir çalışma hem de günlük bir kullanım aracı hâline geldi.\nn memnuniyet duyarım. Dilerseniz siz de başlayın ve kendi medya sunucunuzu oluşturun!  \n"
---
# 🧩 Proje: Evde Kişisel Medya Sunucusu (Jellyfin + Linux)

## 🎯 Proje Amacı

Bu projede, kendi donanımım üzerinde Linux sunucu kullanarak tamamen bana ait ve dışa bağımsız çalışan bir **medya sunucusu altyapısı** kurdum. Amacım, medya içeriklerime (film, dizi, müzik vb.) cihaz ve konum bağımsız olarak erişebilmek; aynı zamanda veri gizliliğini ve kontrolü tamamen kendi elime almaktı.

## 🔧 Kullanılan Teknolojiler

| Teknoloji | Açıklama |
|----------|----------|
| **Jellyfin** | Açık kaynak medya sunucusu (Plex alternatifi) |
| **Linux (Debian tabanlı)** | Sunucu işletim sistemi |
| **Let's Encrypt + Reverse Proxy** | HTTPS ile güvenli dış erişim |
| **DDNS** | Dinamik IP yerine alan adıyla erişim |
| **Fail2ban + Güvenlik Katmanları** | SSH ve web güvenliği için önlemler |
| **1TB HDD + SSD** | Medya ve sistem dosyaları için ayrı disk yapısı |

## 🛠️ Gerçekleştirilen İşlemler

- Linux sunucu kurulumu ve temel güvenlik yapılandırmaları (SSH, kullanıcı izinleri, güvenlik duvarı).
- Jellyfin kurulumu ve servis olarak sistem başlangıcına eklenmesi.
- Reverse proxy yapılandırmasıyla HTTPS üzerinden dış erişim.
- DDNS hizmetiyle ev dışından domain üzerinden bağlantı kurulumu.
- Farklı cihazlardan (TV, telefon, tablet) test ve medya oynatma senaryoları.
- Aile üyeleri için kullanıcı hesapları ve medya erişim yetkilendirmeleri.
- Yedekleme ve sistem güncelleme rutinlerinin oluşturulması.

## 📂 Projenin Öne Çıkan Yönleri

- Tüm medya arşivimin **tek merkezde toplanması ve kategorize edilmesi**.
- Tamamen **ücretsiz ve lisanssız** çalışan sistem mimarisi.
- **Kendi evimde barındırdığım fiziksel sunucu** sayesinde %100 veri kontrolü.
- Düşük donanım tüketimi ile optimize edilmiş yapı.
- Web tarayıcı, mobil uygulama ve TV destekli geniş platform erişimi.
- Kurumsal seviyede güvenlik için temel önlemler alınmış yapı.

## 🔒 Güvenlik Önlemleri

- SSH erişimi için port değişimi ve fail2ban kurulumu.
- Reverse proxy üzerinden HTTPS desteği (Let's Encrypt).
- Jellyfin kullanıcı yönetimi ve parola politikaları.
- Güvenlik duvarı ve bağlantı trafiği loglama.

## 📈 Kazanımlar

- Ağ ve sistem yönetimi konularında ileri seviye deneyim.
- Medya sunucusu yapılandırma ve bakım süreçlerinin öğrenilmesi.
- Docker’sız doğrudan servis kurulumlarının stabilitesinin test edilmesi.
- Gerçek zamanlı medya oynatımı ve transcode performans ölçümleri.
- Kendi sistemimi dışarıya kapatmadan ama kontrolü kaybetmeden açma tecrübesi.


## 🔚 Sonuç

Bu proje ile hem sistem yönetimi konusundaki bilgilerimi uygulamalı olarak geliştirdim hem de kendi medya sunucumu inşa ederek uzun vadeli kullanıma uygun, güvenli ve özelleştirilebilir bir platform oluşturdum. Jellyfin’in esnek yapısı ve Linux’un kararlılığı sayesinde bu sistem, hem teknik bir çalışma hem de günlük bir kullanım aracı hâline geldi.
n memnuniyet duyarım. Dilerseniz siz de başlayın ve kendi medya sunucunuzu oluşturun!  
