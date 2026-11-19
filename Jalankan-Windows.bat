@echo off
cd /d "%~dp0"
title Ocean Time - Simulasi Sampah di Laut
echo ====================================================
echo   Menjalankan Ocean Time (Simulasi Sampah di Laut)
echo ====================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [INFO] Node.js tidak ditemukan di komputer ini.
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [INFO] Menjalankan server lokal via Python di http://localhost:3000 ...
        start "" "http://localhost:3000"
        python -m http.server 3000
        goto :eof
    )
    echo [INFO] Membuka website langsung di browser tanpa instalasi...
    start "" "%~dp0Buka-Tanpa-Install.html"
    goto :eof
)

if not exist "node_modules\" (
    echo [1/2] Memasang komponen pertama kali ^(mohon tunggu sebentar^)...
    call npm install
)

echo [2/2] Menjalankan server di http://localhost:3000 ...
echo       ^(Jangan tutup jendela ini selama website digunakan^)
echo.
start "" "http://localhost:3000"
call npm run dev
