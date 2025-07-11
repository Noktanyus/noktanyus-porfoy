# Geliştirici Merkezi - Kişisel Portföy ve Blog Platformu

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000?style=for-the-badge&logo=nextauth.js&logoColor=white)

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş, tam donanımlı bir kişisel portföy ve blog platformudur. En dikkat çekici özelliği, içeriğin doğrudan web arayüzü üzerinden yönetilmesini ve yapılan değişikliklerin bir Git deposuna commit olarak kaydedilmesini sağlayan **Git tabanlı CMS** (İçerik Yönetim Sistemi) entegrasyonudur.

Bu sayede hem bir veritabanına ihtiyaç duyulmaz hem de tüm içerik geçmişi versiyon kontrol sistemi altında güvenle saklanır.

---

## ✨ Temel Özellikler

- **📝 Blog Yönetimi**: Markdown destekli zengin metin editörü ile blog yazıları oluşturun, düzenleyin ve silin.
- **📂 Proje Portföyü**: Projelerinizi detayları, görselleri ve linkleri ile sergileyin.
- **👤 Hakkımda Sayfası**: Yeteneklerinizi, deneyimlerinizi ve kişisel bilgilerinizi dinamik olarak yönetin.
- **🔒 Git Tabanlı Yönetim Paneli**:
  - Web arayüzünden içerik (yazı, proje, ayar) ekleyin veya güncelleyin.
  - Yapılan tüm değişiklikleri `simple-git` kullanarak Git deposuna **commit'leyin**.
  - Geçmiş commit'leri görüntüleyin ve tek tıkla **değişiklikleri geri alın (revert)**.
- **⚙️ Site Ayarları**: SEO meta etiketleri, ana sayfa başlıkları gibi genel site ayarlarını panelden yönetin.
- **📧 İletişim Formu**: Nodemailer entegrasyonu ile çalışan, Cloudflare Turnstile korumalı iletişim formu.
- **🌙 Açık & Koyu Tema**: Kullanıcının sistem tercihine veya manuel seçimine göre tema değiştirme.
- **📱 Duyarlı Tasarım**: Tailwind CSS ile tüm cihazlarda kusursuz bir görünüm.
- **🧪 Test Desteği**: Jest ve React Testing Library ile bileşen ve fonksiyon testleri.

---

## 🚀 Teknolojiler

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Dil**: [TypeScript](https://www.typescriptlang.org/)
- **Stil**: [Tailwind CSS](https://tailwindcss.com/)
- **Kimlik Doğrulama**: [NextAuth.js](https://next-auth.js.org/)
- **İçerik Yönetimi**: Markdown (`gray-matter`, `markdown-it`) ve JSON dosyaları
- **Yönetim Paneli (Backend)**: [simple-git](https://github.com/steveukx/git-js) ile Git otomasyonu, Next.js API Routes
- **Form Yönetimi**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (Doğrulama için)
- **Test**: [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)
- **E-posta**: [Nodemailer](https://nodemailer.com/)
- **UI/UX**: [Framer Motion](https://www.framer.com/motion/) (Animasyonlar), [React Icons](https://react-icons.github.io/react-icons/)

---

## 🛠️ Kurulum ve Başlatma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Node.js](https://nodejs.org/en/) (v20.x veya üstü)
- [Git](https://git-scm.com/)

### Adımlar

1.  **Projeyi klonlayın:**
    ```bash
    git clone --branch database-md --single-branch https://github.com/noktanyus/noktanyus-porfoy.git
    cd noktanyus-porfoy
    ```

2.  **Gerekli paketleri yükleyin:**
    ```bash
    npm install
    ```

3.  **Ortam değişkenlerini ayarlayın:**
    `.env.example` dosyasını kopyalayarak `.env.local` adında yeni bir dosya oluşturun ve içindeki alanları kendi bilgilerinize göre doldurun.

    ```bash
    cp .env.example .env.local
    ```

    **`.env.local` Dosyasındaki Önemli Alanlar:**
    - `GITHUB_USERNAME`: GitHub kullanıcı adınız.
    - `GITHUB_TOKEN`: İçerik deposuna `commit` atabilmek için gereken [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). `repo` yetkisi verilmiş olmalıdır.
    - `NEXTAUTH_SECRET`: `openssl rand -hex 32` komutu ile üretebileceğiniz gizli bir anahtar.
    - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Yönetim paneline giriş için kullanılacak e-posta ve şifre.
    - `EMAIL_SERVER`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`: İletişim formundan e-posta göndermek için SMTP sunucu bilgileriniz.

4.  **Geliştirme sunucusunu başlatın:**
    ```bash
    npm run dev
    ```

5.  Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın. Yönetim paneline erişmek için [http://localhost:3000/admin](http://localhost:3000/admin) adresine gidin.

---

## 📜 Kullanılabilir Script'ler

- `npm run dev`: Geliştirme sunucusunu başlatır.
- `npm run build`: Projeyi production için derler.
- `npm run start`: Derlenmiş production versiyonunu çalıştırır.
- `npm run test`: Jest ile yazılmış testleri çalıştırır.
- `npm run lint`: ESLint ile kod stilini kontrol eder ve otomatik düzeltir.

---

## 🗂️ İçerik Yönetimi

Tüm içerikler projenin ana dizinindeki `/content` klasöründe saklanır.

- **Blog Yazıları**: `/content/blog/*.md`
- **Projeler**: `/content/projects/*.md`
- **Deneyimler**: `/content/experiences.json`
- **Yetenekler**: `/content/skills.json`
- **Site Ayarları**: `/content/home-settings.json`, `/content/seo-settings.json`

Yönetim panelinden yapılan her değişiklik bu dosyalara işlenir ve ardından Git'e commit edilir.

---

## 🚀 Yayınlama (Deployment)

Proje, Next.js projeleri için optimize edilmiş olan [Vercel](https://vercel.com/) platformuna kolayca dağıtılabilir.

1.  Projenizi GitHub'a yükleyin.
2.  Vercel'e GitHub hesabınızla giriş yapın.
3.  "Add New... > Project" adımlarını izleyerek projenizi seçin.
4.  Ortam değişkenlerini Vercel projenizin ayarlarına ekleyin.
5.  "Deploy" butonuna tıklayın.

---

## 📄 Lisans

Bu proje [MIT Lisansı](./LICENSE) ile lisanslanmıştır.  Kullanımda kaynak belirtmek ve [noktanyus.com](https://noktanyus.com) adresine yönlendirme yapmak zorunludur.
