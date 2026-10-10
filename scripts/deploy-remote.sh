#!/usr/bin/env bash
# ==============================================================================
# Noktanyus Manuel Deploy Scripti (Bash / macOS / Linux)
# ==============================================================================
set -e

echo "🚀 yunus.tekilons.tr üzerinde manuel deploy başlatılıyor..."

ssh -t yunus.tekilons.tr "
set -e
if [ -d \"\$HOME/noktanyus-porfoy\" ]; then
    cd \"\$HOME/noktanyus-porfoy\"
elif [ -d \"\$HOME/noktanyus\" ]; then
    cd \"\$HOME/noktanyus\"
else
    cd \"\$(find \$HOME -maxdepth 2 -name 'noktanyus-porfoy' 2>/dev/null | head -n 1)\"
fi

echo \"📂 Çalışma dizini: \$(pwd)\"
git fetch origin master
git pull origin master
chmod +x scripts/deploy-production.sh 2>/dev/null || true
bash scripts/deploy-production.sh
"
