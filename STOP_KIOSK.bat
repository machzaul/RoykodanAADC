@echo off
setlocal EnableDelayedExpansion
title Royko x AADC - Matikan Server Kiosk
color 0C

echo.
echo ============================================================
echo   ROYCO x AADC - STOP KIOSK SERVER
echo ============================================================
echo.

set "STOPPED=0"
set "PORT_LOG=%TEMP%\royko_ports.txt"

netstat -ano > "!PORT_LOG!" 2>nul
for /f "tokens=5" %%p in ('type "!PORT_LOG!" 2^>nul ^| findstr /R ":3000.*LISTENING"') do (
    if "%%p" NEQ "0" (
        echo Menutup proses server PID %%p
        taskkill /F /PID %%p >nul 2>&1
        set "STOPPED=1"
    )
)
if exist "!PORT_LOG!" del "!PORT_LOG!" >nul 2>&1

if "!STOPPED!"=="1" (
    echo [OK] Server Kiosk di port 3000 berhasil dihentikan.
) else (
    echo [INFO] Tidak ada server Kiosk yang sedang berjalan di port 3000.
)

echo.
echo ============================================================
echo Selesai.
ping -n 4 127.0.0.1 >nul
exit /b 0
