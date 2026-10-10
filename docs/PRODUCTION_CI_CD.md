# 🚀 Otomatik Production CI/CD Kurulum Kılavuzu (yunus.tekilons.tr)

Bu doküman, GitHub'a `master` branch'ine commit/push atıldığında, `yunus.tekilons.tr` sunucusunda otomatik olarak kodun çekilip derlenmesini ve production'a alınmasını sağlayan sistemin kurulum ve çalıştırma adımlarını içerir.

---

## 1. Çalışma Mantığı

1. Geliştirici yerelde kodunu yazar ve GitHub `master` branch'ine pushlar.
2. `.github/workflows/deploy-production.yml` workflow'u otomatik tetiklenir:
   - **Pre-flight**: TypeScript type-check ve ESLint çalıştırarak bozuk kodun deploy olmasını engeller.
   - **Deploy**: Sunucu `cloudflared` (Cloudflare Zero Trust Access) arkasında olduğu için, `cloudflared` CLI üzerinden **Service Token** kullanarak SSH tüneli açar ve sunucuya bağlanır.
   - Sunucuda `scripts/deploy-production.sh` scriptini çalıştırır:
     - `git pull origin master` ile son commit'i çeker.
     - Docker Compose (veya Standalone/PM2) ile web servisini build eder.
     - `prisma migrate deploy` ile veritabanı migration'larını uygular.
     - `http://localhost:3000/api/health` üzerinden sağlık kontrolü yapar.
     - Canlıya alma sonucunu GitHub Actions'a raporlar.

---

## 2. Kurulum Seçeneği A: Cloudflare Zero Trust Service Token ile SSH (Önerilen)

Sunucunuz `cloudflared access ssh` ile korunduğu için, GitHub Actions'ın web tarayıcısı olmadan doğrudan SSH tüneli açabilmesi için Cloudflare Service Token kullanılır.

### Adım 1: Cloudflare Dashboard'dan Service Token Oluşturma
1. [Cloudflare One / Zero Trust](https://one.dash.cloudflare.com/) paneline giriş yapın.
2. Sol menüden **Access** > **Service Auth** sekmesine gidin.
3. **Create Service Token** butonuna tıklayın:
   - Token Adı: `github-actions-deploy`
   - Süre: `Non-expiring` veya 1 yıl
4. Oluşan **Client ID** ve **Client Secret** değerlerini kopyalayın (Secret sadece bir kez görüntülenir).

### Adım 2: Access Politikasını Güncelleme
1. **Access** > **Applications** altından `yunus.tekilons.tr` SSH uygulamanızı seçin ve **Edit** deyin.
2. **Policies** sekmesine gidin ve yeni bir kural ekleyin (veya mevcut kurala ekleyin):
   - Action: `Service Auth`
   - Rule type: `Include`
   - Selector: `Service Token`
   - Value: `github-actions-deploy`
3. Kaydedin. Artık bu token ile gelen istekler MFA/tarayıcı doğrulamasına takılmadan SSH'a bağlanabilir.

### Adım 3: GitHub Secrets Eklenmesi
GitHub reponuzda (`https://github.com/Noktanyus/noktanyus-porfoy/settings/secrets/actions`):

| Secret Adı | Değer | Açıklama |
|---|---|---|
| `SSH_HOST` | `yunus.tekilons.tr` | Sunucu adresi |
| `SSH_USER` | `yunus` | SSH kullanıcı adı |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY...` | `yunus` kullanıcısının sunucuya giriş yetkisine sahip özel SSH anahtarı |
| `CF_ACCESS_CLIENT_ID` | `...` | Cloudflare Service Token Client ID |
| `CF_ACCESS_CLIENT_SECRET` | `...` | Cloudflare Service Token Client Secret |
| `DEPLOY_PATH` | `~/noktanyus-porfoy` | (Opsiyonel) Sunucudaki repo dizini |

---

## 3. Kurulum Seçeneği B: GitHub Self-Hosted Runner (En Zahmetsiz Alternatif)

Eğer Cloudflare Zero Trust token'ları ile uğraşmak istemiyorsanız, sunucunuza bir **GitHub Self-Hosted Runner** kurabilirsiniz. Bu yöntem giden (outbound) HTTPS bağlantısı kullandığı için Cloudflare Access veya port açma derdi **olmaz**.

1. GitHub Repo > **Settings** > **Actions** > **Runners** > **New self-hosted runner** tıklayın.
2. OS olarak **Linux** (x64) seçin.
3. Sunucuya SSH ile girip sayfadaki komutları çalıştırın:
   ```bash
   mkdir actions-runner && cd actions-runner
   curl -o actions-runner-linux-x64-...tar.gz -L https://github.com/actions/runner/...
   tar xzf ./actions-runner-linux-x64-...tar.gz
   ./config.sh --url https://github.com/Noktanyus/noktanyus-porfoy --token <TOKEN>
   sudo ./svc.sh install
   sudo ./svc.sh start
   ```
4. Runner kurulduğunda workflow dosyasında `runs-on: self-hosted` yapılması yeterlidir; tüm build ve deploy komutları doğrudan sunucuda yerel olarak çalışır!

---

## 4. Manuel Sunucu Dağıtımı

Sunucuya elle SSH ile girdiğinizde tek adımda deploy almak için:

```bash
cd ~/noktanyus-porfoy
bash scripts/deploy-production.sh
```

Script otomatik olarak ortamı (Docker veya Standalone/PM2) algılar, migration'ları geçer ve canlılık kontrolü yapar.
