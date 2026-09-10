@echo off
setlocal EnableDelayedExpansion
title Royko x AADC - Nonaktifkan Autostart
color 0E

echo.
echo ============================================================
echo   ROYCO x AADC - NONAKTIFKAN AUTOSTART MINI PC
echo ============================================================
echo.

set "STARTUP_LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Royko_Kiosk.lnk"

if exist "%STARTUP_LNK%" (
    del /f /q "%STARTUP_LNK%"
    echo [OK] Shortcut Autostart berhasil dihapus:
    echo "%STARTUP_LNK%"
    echo.
    echo Mini PC tidak akan lagi membuka Kiosk otomatis saat baru dinyalakan.
) else (
    echo [INFO] Autostart belum aktif atau shortcut tidak ditemukan.
)

echo.
echo ============================================================
echo Tekan tombol apa saja untuk keluar...
pause >nul
