#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1

echo "===================================================="
echo "  Menjalankan Ocean Time (Simulasi Sampah di Laut)"
echo "===================================================="
echo ""

open_url() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$1" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$1" >/dev/null 2>&1 &
  fi
}

if ! command -v node >/dev/null 2>&1; then
  echo "[INFO] Node.js tidak ditemukan. Menggunakan mode instan..."
  if command -v python3 >/dev/null 2>&1; then
    (sleep 1 && open_url "http://localhost:3000") &
    python3 -m http.server 3000
    exit 0
  fi
  open_url "$(pwd)/Buka-Tanpa-Install.html"
  exit 0
fi

if [ ! -d "node_modules" ]; then
  echo "[1/2] Memasang komponen pertama kali (mohon tunggu sebentar)..."
  npm install
fi

echo "[2/2] Menjalankan server di http://localhost:3000 ..."
(sleep 2 && open_url "http://localhost:3000") &
npm run dev
