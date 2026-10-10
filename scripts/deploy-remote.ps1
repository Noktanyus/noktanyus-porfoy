# ==============================================================================
# Noktanyus Windows Tek Tuşla Manuel Deploy Scripti (yunus.tekilons.tr)
# ==============================================================================
# Bu script yerel bilgisayarınızdan (PowerShell) tek komutla yunus.tekilons.tr
# sunucusuna SSH üzerinden bağlanır ve canlıya alma sürecini başlatır.
#
# Kullanım:
#   .\scripts\deploy-remote.ps1
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Noktanyus Production Manuel Dağıtım Başlatılıyor" -ForegroundColor Cyan
Write-Host "🌐 Hedef: yunus.tekilons.tr" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# SSH bağlantısını başlat ve sunucudaki deploy-production.sh'ı çalıştır
$remoteCommand = @"
set -e
if [ -d "`$HOME/noktanyus-porfoy" ]; then
    cd "`$HOME/noktanyus-porfoy"
elif [ -d "`$HOME/noktanyus" ]; then
    cd "`$HOME/noktanyus"
elif [ -d "/var/www/noktanyus-porfoy" ]; then
    cd "/var/www/noktanyus-porfoy"
else
    echo "Dizin bulunamadı, repo aranıyor..."
    cd `$(find `$HOME -maxdepth 2 -name "noktanyus-porfoy" 2>/dev/null | head -n 1)
fi

echo "📂 Çalışma dizini: `$(pwd)"
git fetch origin master
git pull origin master
chmod +x scripts/deploy-production.sh 2>/dev/null || true
bash scripts/deploy-production.sh
"@

try {
    ssh -t yunus.tekilons.tr $remoteCommand
} catch {
    Write-Host "❌ Dağıtım sırasında bir hata oluştu: $_" -ForegroundColor Red
}
