@echo off
setlocal EnableDelayedExpansion
title Royko x AADC - Pasang Autostart Mini PC
color 0A

:: Mendapatkan path folder saat ini secara dinamis (100% Bebas Pindah Folder)
set "PROJECT_ROOT=%~dp0"
if "!PROJECT_ROOT:~-1!"=="\" set "PROJECT_ROOT=!PROJECT_ROOT:~0,-1!"

echo.
echo ============================================================
echo   ROYCO x AADC - AKTIFKAN AUTOSTART MINI PC
echo ============================================================
echo Lokasi Program Saat Ini : "!PROJECT_ROOT!"
echo File Target             : "!PROJECT_ROOT!\START_KIOSK.bat"
echo ============================================================
echo.

set "VBS_SCRIPT=%TEMP%\royko_install_autostart.vbs"
echo Set ws = CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo startup = ws.SpecialFolders("Startup") >> "%VBS_SCRIPT%"
echo Set s = ws.CreateShortcut(startup ^& "\Royko_Kiosk.lnk") >> "%VBS_SCRIPT%"
echo s.TargetPath = WScript.Arguments(0) >> "%VBS_SCRIPT%"
echo s.WorkingDirectory = WScript.Arguments(1) >> "%VBS_SCRIPT%"
echo s.Description = "Royko x AADC Kiosk AutoPlay" >> "%VBS_SCRIPT%"
echo s.WindowStyle = 1 >> "%VBS_SCRIPT%"
echo s.Save >> "%VBS_SCRIPT%"

cscript //nologo "%VBS_SCRIPT%" "!PROJECT_ROOT!\START_KIOSK.bat" "!PROJECT_ROOT!"
if exist "%VBS_SCRIPT%" del "%VBS_SCRIPT%" >nul 2>&1

echo [OK] BERHASIL DIAKTIFKAN!
echo Shortcut telah dipasang di folder Startup Windows:
echo %%APPDATA%%\Microsoft\Windows\Start Menu\Programs\Startup\Royko_Kiosk.lnk
echo.
echo ============================================================
echo   Setiap kali Mini PC dinyalakan / restart:
echo   Aplikasi Kiosk akan langsung terbuka dan play otomatis!
echo.
echo   CATATAN:
echo   Jika folder ini dipindahkan ke drive atau lokasi lain,
echo   cukup klik ganda kembali file ini untuk memperbarui lokasi.
echo ============================================================
echo.
pause
