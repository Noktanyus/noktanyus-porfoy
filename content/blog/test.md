---
title: test
slug: test
description: |-
  | Teknoloji | Açıklama |
  |----------|----------|
  | **Jellyfin** | Açık kaynak medya sunucusu (Plex alternatifi) |
  | **Linux (Debian tabanlı)** | Sunucu işletim sistemi |
  | **Let's Encrypt + Reverse Proxy** | HTTPS ile güvenli dış erişim |
  | **DDNS** | Dinamik IP yerine alan adıyla erişim |
  | **Fail2ban + Güvenlik Katmanları** | SSH ve web güvenliği için önlemler |
  | **1TB HDD + SSD** | Medya ve sistem dosyaları için ayrı disk yapısı |
thumbnail: ''
author: Admin
category: a
tags: []
date: '2025-07-03T06:31:59.309Z'
content: "  | Özellik | Önceki Sistem (remark/rehype) | Mevcut Sistem (markdown-it) | Dezavantaj/Fark |\r\n  | :--- | :--- | :--- | :--- |\r\n  | Kontrol | Yüksek. AST sayesinde içeriğin yapısına tam erişim ve müdahale imkanı. | Düşük. Doğrudan\r\n  metinden HTML'e dönüşüm. Yapısal kontrol sınırlı. | Otomatik içindekiler tablosu gibi gelişmiş yapısal\r\n  özellikler eklemek zorlaştı. |\r\n  | Güvenlik | Yüksek. rehype-sanitize ile otomatik ve güçlü güvenlik katmanı. | Manuel Kontrol. html: true\r\n  ayarı nedeniyle güvenlik sorumluluğu geliştiricide/editörde. | Güvenlik için daha fazla dikkat ve manuel\r\n  denetim gerektiriyor. |\r\n  | Basitlik | Daha Karmaşık. Birden çok eklenti ve adımdan oluşan bir işlem hattı (pipeline). | Çok Daha\r\n  Basit. Tek bir .render() fonksiyonu ile çalışan, anlaşılması kolay bir yapı. | - |\r\n  | Ekosistem | unified.js ekosisteminin bir parçası, yapısal işlemler için çok güçlü. | Kendi geniş eklenti\r\n   ekosistemine sahip, genellikle yeni sözdizimi eklemeye odaklı. | Farklı felsefelere sahipler, biri belge\r\n  işleme diğeri render odaklı. |pısı |\n"
---
  | Özellik | Önceki Sistem (remark/rehype) | Mevcut Sistem (markdown-it) | Dezavantaj/Fark |
  | :--- | :--- | :--- | :--- |
  | Kontrol | Yüksek. AST sayesinde içeriğin yapısına tam erişim ve müdahale imkanı. | Düşük. Doğrudan
  metinden HTML'e dönüşüm. Yapısal kontrol sınırlı. | Otomatik içindekiler tablosu gibi gelişmiş yapısal
  özellikler eklemek zorlaştı. |
  | Güvenlik | Yüksek. rehype-sanitize ile otomatik ve güçlü güvenlik katmanı. | Manuel Kontrol. html: true
  ayarı nedeniyle güvenlik sorumluluğu geliştiricide/editörde. | Güvenlik için daha fazla dikkat ve manuel
  denetim gerektiriyor. |
  | Basitlik | Daha Karmaşık. Birden çok eklenti ve adımdan oluşan bir işlem hattı (pipeline). | Çok Daha
  Basit. Tek bir .render() fonksiyonu ile çalışan, anlaşılması kolay bir yapı. | - |
  | Ekosistem | unified.js ekosisteminin bir parçası, yapısal işlemler için çok güçlü. | Kendi geniş eklenti
   ekosistemine sahip, genellikle yeni sözdizimi eklemeye odaklı. | Farklı felsefelere sahipler, biri belge
  işleme diğeri render odaklı. |pısı |
