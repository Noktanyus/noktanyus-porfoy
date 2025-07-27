# Noktanyus Kişisel Portfolyo Projesi

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş, dinamik ve yönetilebilir bir kişisel portfolyo web sitesidir. Next.js, Prisma ve Tailwind CSS gibi güçlü araçlarla oluşturulmuştur. Proje, hem kişisel yetenekleri ve projeleri sergilemek hem de blog yazıları aracılığıyla bilgi paylaşımı yapmak için tasarlanmıştır.

## Lisans

Bu proje [MIT Lisansı](./LICENSE) ile lisanslanmıştır. Kullanımda kaynak belirtmek ve [noktanyus.com](https://noktanyus.com) adresine yönlendirme yapmak zorunludur.


## 📚 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Öne Çıkan Özellikler](#-öne-çıkan-özellikler)
- [Kullanılan Teknolojiler](#-kullanılan-teknolojiler)
- [Gereksinimler](#-gereksinimler)
- [Kurulum Adımları](#-kurulum-adımları)
- [Proje Yönetimi ve Kullanımı](#-proje-yönetimi-ve-kullanımı)
  - [Admin Paneli](#admin-paneli)
  - [Veritabanı Yönetimi (Prisma)](#veritabanı-yönetimi-prisma)
- [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
- [Testler](#-testler)
- [Docker ile Çalıştırma](#-docker-ile-çalıştırma)
- [CI/CD Pipeline](#-cicd-pipeline)


## 🌟 Proje Hakkında

Bu projenin temel amacı, bir geliştiricinin çalışmalarını, projelerini, yeteneklerini ve düşüncelerini profesyonel bir arayüzle sunabileceği bir platform oluşturmaktır. Admin paneli sayesinde tüm içerikler (projeler, blog yazıları, hakkımda bilgileri vb.) kodlama bilgisi gerektirmeden kolayca yönetilebilir.

## ✨ Öne Çıkan Özellikler

- **Dinamik Proje Yönetimi:** Projelerinizi resimleri, açıklamaları ve linkleri ile birlikte ekleyip düzenleyebilirsiniz.
- **Blog Sistemi:** Kendi yazılarınızı yayınlayabileceğiniz, kategori ve etiket desteği olan bir blog modülü.
- **Yönetim Paneli (Admin):** Tüm içeriği yönetmek için tasarlanmış güvenli bir admin paneli.
- **"Hakkımda" Sayfası:** Kişisel bilgilerin, sosyal medya hesaplarının ve yeteneklerin dinamik olarak yönetildiği bir sayfa.
- **İletişim Formu:** Basit ve güvenli bir iletişim formu.
- **Veritabanı Entegrasyonu:** Prisma ORM ile PostgreSQL, MySQL veya SQLite gibi farklı veritabanlarıyla kolayca çalışabilir.
- **Modern Arayüz:** Tailwind CSS ile oluşturulmuş, mobil uyumlu ve şık bir tasarım.
- **SEO Uyumlu:** Next.js'in getirdiği sunucu tarafı işleme (SSR) ve statik site oluşturma (SSG) yetenekleri sayesinde arama motoru dostu.

## 🛠️ Kullanılan Teknolojiler

- **Framework:** [Next.js](https://nextjs.org/)
- **Dil:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Veritabanı:** [PostgreSQL](https://www.postgresql.org/) (önerilen), MySQL, SQLite ile uyumlu
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Test:** [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
- **Containerization:** [Docker](https://www.docker.com/)

## 📋 Gereksinimler

Projeyi yerel makinenizde çalıştırmak için aşağıdaki araçların kurulu olması gerekmektedir:

- [Node.js](https://nodejs.org/en/) (v18 veya üstü)
- [pnpm](https://pnpm.io/installation) (veya npm/yarn)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/products/docker-desktop/) (isteğe bağlı, Docker ile çalıştırmak için)

## 🚀 Kurulum Adımları

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/noktanyus/noktanyus-porfoy.git
    cd noktanyus-porfoy/portfoy1
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    pnpm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    `.env.local.example` dosyasının bir kopyasını oluşturup `.env.local` olarak adlandırın. Ardından içindeki değişkenleri kendi bilgilerinize göre doldurun.
    ```bash
    cp .env.local.example .env.local
    ```
    Detaylı bilgi için [Ortam Değişkenleri](#-ortam-değişkenleri-env) bölümüne bakın.

4.  **Veritabanını Ayarlayın:**
    Prisma, `.env.local` dosyasındaki `DATABASE_URL` değişkenini kullanarak veritabanına bağlanacaktır. Veritabanı şemasını veritabanınıza göndermek için aşağıdaki komutu çalıştırın:
    ```bash
    npx prisma migrate dev
    ```
    Bu komut, `prisma/migrations` klasöründeki değişiklikleri veritabanına uygular ve veritabanını şema ile senkronize eder.

5.  **Başlangıç Verilerini Ekleyin (İsteğe bağlı):**
    Eğer `prisma/seed.ts` dosyasında başlangıç verileri tanımlanmışsa, bu verileri veritabanına eklemek için:
    ```bash
    npx prisma db seed
    ```

6.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    pnpm dev
    ```
    Tarayıcınızda `http://localhost:3000` adresini açarak projeyi görüntüleyebilirsiniz.

## ⚙️ Proje Yönetimi ve Kullanımı

### Admin Paneli

Admin paneli, sitenin tüm dinamik içeriğini yönetmenizi sağlar.
-   **Giriş:** `http://localhost:3000/admin` adresinden panele erişebilirsiniz.
-   **Yetkiler:** Admin paneline giriş için gerekli kullanıcı adı ve şifre veritabanında yönetilir.

**Panel Üzerinden Yapılabilecekler:**
-   **Proje Ekleme/Düzenleme:** `Projelerim` bölümünden yeni projeler ekleyebilir, var olanları güncelleyebilir veya silebilirsiniz. Proje eklerken başlık, açıklama, kullanılan teknolojiler, resim ve proje linki gibi alanları doldurabilirsiniz.
-   **Blog Yazısı Yönetimi:** `Blog` bölümünden yeni yazılar oluşturabilir, taslak olarak kaydedebilir veya yayınlayabilirsiniz.
-   **Hakkımda Sayfasını Güncelleme:** Kişisel bilgilerinizi, sosyal medya linklerinizi ve yeteneklerinizi bu panelden güncelleyebilirsiniz.

### Veritabanı Yönetimi (Prisma)

Prisma, veritabanı işlemlerini kolaylaştırır.
-   **Veritabanı Şemasını Değiştirme:** `prisma/schema.prisma` dosyasında model (tablo) değişiklikleri yaptıktan sonra, bu değişikliği veritabanına uygulamak için yeni bir migration oluşturun:
    ```bash
    npx prisma migrate dev --name "yeni-ozellik-eklendi"
    ```
-   **Prisma Studio:** Veritabanındaki verileri görsel bir arayüzle görmek ve düzenlemek için Prisma Studio'yu kullanabilirsiniz:
    ```bash
    npx prisma studio
    ```

## 🔑 Ortam Değişkenleri (.env)

Projenin düzgün çalışması için `.env.local` dosyasında aşağıdaki değişkenlerin tanımlanması gerekir:

```env
# Veritabanı Bağlantı Bilgisi (Prisma)
# Örnek: postgresql://kullanici:sifre@host:port/veritabani
DATABASE_URL="postgresql://..."

# NextAuth için gizli bir anahtar.
# Üretim ortamı için karmaşık ve uzun bir değer olmalıdır.
# `openssl rand -base64 32` komutu ile oluşturabilirsiniz.
NEXTAUTH_SECRET="super-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare Turnstile kaldırıldı

# Diğer API anahtarları (varsa)
# Örneğin: GITHUB_TOKEN="ghp_..."
```

## ✅ Testler

Projedeki testleri çalıştırmak için aşağıdaki komutu kullanın:
```bash
pnpm test
```

## 🐳 Docker ile Çalıştırma

Proje, Docker ve Docker Compose ile kolayca ayağa kaldırılabilir.

1.  **Gereksinim:** Docker ve Docker Compose'un kurulu olduğundan emin olun.
2.  **Ortam Değişkenleri:** Üretim ortamı için `.env` dosyasını oluşturun ve gerekli değişkenleri doldurun.
3.  **Çalıştırın:** Proje ana dizinindeyken aşağıdaki komutu çalıştırın:
    ```bash
    docker-compose up --build
    ```
Bu komut, veritabanı servisini ve Next.js uygulamasını başlatacaktır.

## 🚀 CI/CD Pipeline

Bu proje, GitHub Actions kullanarak kapsamlı bir CI/CD pipeline'ına sahiptir. Her push ve pull request işleminde otomatik olarak kod kalitesi, güvenlik ve performans kontrolleri yapılır.

### 📋 Workflow'lar

#### 🚀 Ana CI/CD Pipeline (`ci-cd.yml`)
Ana deployment pipeline'ı aşağıdaki aşamaları içerir:

**Tetikleyiciler:**
- `master`/`main` branch'e push
- Pull request oluşturma
- Manuel tetikleme (workflow_dispatch)

**Aşamalar:**
1. **📋 Environment Setup**: Ortam hazırlığı ve cache yönetimi
2. **🔍 Code Quality & Linting**: ESLint ile kod kalitesi kontrolü
3. **🔒 Security Audit**: npm audit ile güvenlik taraması
4. **🏗️ Build Application**: Uygulama build işlemi
5. **🧪 Test Suite**: Test dosyalarının çalıştırılması (varsa)
6. **🐳 Docker Build & Push**: Docker image oluşturma ve registry'e push
7. **📊 Performance Analysis**: Bundle boyutu analizi (PR'larda)
8. **🚀 Deployment Notification**: Deployment durumu bildirimi

**Özellikler:**
- ✅ Paralel job execution (hızlı build)
- ✅ Akıllı cache yönetimi
- ✅ Environment-specific deployment
- ✅ Detaylı raporlama ve status summary
- ✅ Multi-platform Docker builds (amd64, arm64)

#### 🔍 PR Quality Checks (`pr-checks.yml`)
Pull request'ler için özel kalite kontrolleri:

**Kontroller:**
- **📝 PR Information**: PR detayları ve değişen dosyalar analizi
- **🔍 Code Analysis**: ESLint ve kod karmaşıklığı analizi
- **🔒 Security Check**: Güvenlik açığı taraması
- **🏗️ Build Verification**: Build başarı kontrolü
- **🧪 Test Execution**: Test dosyalarının çalıştırılması
- **📊 Performance Impact**: Bundle boyutu ve performans analizi

**Özellikler:**
- ✅ Detaylı PR summary raporları
- ✅ Otomatik kod kalitesi değerlendirmesi
- ✅ Güvenlik açığı uyarıları
- ✅ Performance regression detection

#### 🔒 Security Scanning (`security.yml`)
Gelişmiş güvenlik taraması:

**Taramalar:**
- **🔍 Dependency Scan**: npm audit ile bağımlılık taraması
- **🔍 CodeQL Analysis**: GitHub CodeQL ile kod analizi
- **🔒 Secret Detection**: TruffleHog ile secret taraması
- **🛡️ OWASP Dependency Check**: OWASP güvenlik kontrolü

**Çalışma Zamanları:**
- Her push ve PR'da
- Günlük otomatik tarama (02:00 UTC)
- Manuel tetikleme desteği

#### ⚡ Performance Monitoring (`performance.yml`)
Performans izleme ve optimizasyon:

**Analizler:**
- **📊 Bundle Size Analysis**: JavaScript ve CSS bundle analizi
- **📄 Page Analysis**: Static ve server page sayıları
- **📏 Large File Detection**: 1MB üzeri dosya uyarıları
- **💡 Optimization Recommendations**: Performans önerileri

**Çalışma Zamanları:**
- Her push ve PR'da
- Haftalık otomatik analiz (Pazartesi 09:00 UTC)
- Manuel tetikleme seçenekleri

#### 🧹 Cleanup & Maintenance (`cleanup.yml`)
Otomatik temizlik ve bakım:

**Görevler:**
- **🗑️ Artifact Cleanup**: 30 gün üzeri artifact'ları temizleme
- **🐳 Docker Image Cleanup**: Eski Docker image'larını temizleme
- **📊 Repository Statistics**: Repo istatistikleri
- **🔍 Health Check**: Dependency ve güvenlik durumu

**Çalışma Zamanı:**
- Haftalık otomatik çalışma (Pazar 03:00 UTC)

#### 🚀 Release & Deploy (`release.yml`)
Release yönetimi ve deployment:

**Süreç:**
- **🏷️ GitHub Release**: Otomatik release oluşturma
- **🧪 Pre-Release Tests**: Release öncesi testler
- **🐳 Release Image Build**: Production Docker image
- **📊 Release Summary**: Deployment durumu raporu

**Tetikleyiciler:**
- Git tag push (`v*`)
- Manuel release tetikleme

### 🔧 Workflow Konfigürasyonu

#### Gerekli Secrets
GitHub repository settings'de aşağıdaki secrets'ların tanımlanması gerekir:

```bash
# Docker Hub
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-token

# Application Secrets
DATABASE_URL=your-database-url
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=your-app-url
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password

# Optional Services
TURNSTILE_SECRET_KEY=your-turnstile-secret
EMAIL_SERVER=your-email-server
EMAIL_PORT=your-email-port
EMAIL_USER=your-email-user
EMAIL_PASSWORD=your-email-password

# Public Variables
NEXT_PUBLIC_BASE_URL=your-public-url
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

#### Manuel Workflow Tetikleme

Workflow'ları manuel olarak tetiklemek için:

1. GitHub repository'de **Actions** sekmesine gidin
2. İstediğiniz workflow'u seçin
3. **Run workflow** butonuna tıklayın
4. Gerekli parametreleri girin (varsa)
5. **Run workflow** ile başlatın

### 📊 Monitoring ve Raporlama

Her workflow çalışması sonunda detaylı raporlar oluşturulur:

- **✅ Success Reports**: Başarılı işlemler özeti
- **❌ Failure Reports**: Hata detayları ve çözüm önerileri
- **📊 Performance Metrics**: Bundle boyutları ve optimizasyon önerileri
- **🔒 Security Status**: Güvenlik tarama sonuçları
- **📈 Trend Analysis**: Zaman içindeki değişimler

### 🎯 Best Practices

**Geliştirme Süreci:**
1. Feature branch oluşturun
2. Değişikliklerinizi yapın
3. PR açın (otomatik kalite kontrolleri çalışır)
4. Review sonrası merge edin
5. Master branch'e merge sonrası otomatik deployment

**Güvenlik:**
- Secrets'ları asla kod içinde tutmayın
- Düzenli güvenlik taramaları yapın
- Bağımlılıkları güncel tutun

**Performans:**
- Bundle boyutlarını izleyin
- Performance regression'ları önleyin
- Optimizasyon önerilerini uygulayın

---

## 🤝 Katkıda Bulunma

Bu projeye katkıda bulunmak istiyorsanız:

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

- **Website:** [noktanyus.com](https://noktanyus.com)
- **GitHub:** [@noktanyus](https://github.com/noktanyus)
- **Email:** [İletişim formu üzerinden](https://noktanyus.com/iletisim)

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!