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


## 🌟 Proje Hakkında

Bu projenin temel amacı, bir geliştiricinin çalışmalarını, projelerini, yeteneklerini ve düşüncelerini profesyonel bir arayüzle sunabileceği bir platform oluşturmaktır. Admin paneli sayesinde tüm içerikler (projeler, blog yazıları, hakkımda bilgileri vb.) kodlama bilgisi gerektirmeden kolayca yönetilebilir.

## ✨ Öne Çıkan Özellikler

- **Dinamik Proje Yönetimi:** Projelerinizi resimleri, açıklamaları ve linkleri ile birlikte ekleyip düzenleyebilirsiniz.
- **Blog Sistemi:** Kendi yazılarınızı yayınlayabileceğiniz, kategori ve etiket desteği olan bir blog modülü.
- **Yönetim Paneli (Admin):** Tüm içeriği yönetmek için tasarlanmış güvenli bir admin paneli.
- **"Hakkımda" Sayfası:** Kişisel bilgilerin, sosyal medya hesaplarının ve yeteneklerin dinamik olarak yönetildiği bir sayfa.
- **İletişim Formu:** Google reCAPTCHA veya Cloudflare Turnstile ile korunan, spam'a karşı güvenli bir iletişim formu.
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

# İletişim formunda kullanılacak Cloudflare Turnstile bilgileri
NEXT_PUBLIC_CLOUDFLARE_SITE_KEY="your-cloudflare-site-key"
CLOUDFLARE_TURNSTILE_SECRET_KEY="your-cloudflare-secret-key"

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
