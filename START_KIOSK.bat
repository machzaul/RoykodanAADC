@echo off
setlocal EnableDelayedExpansion
title Royko x AADC - Kiosk Auto Launcher
color 0A

:: ============================================================
:: Dapatkan path folder saat ini secara dinamis (100% Portable)
:: Folder bebas dipindah-pindah tanpa perlu ubah path manual!
:: ============================================================
set "PROJECT_ROOT=%~dp0"
if "!PROJECT_ROOT:~-1!"=="\" set "PROJECT_ROOT=!PROJECT_ROOT:~0,-1!"
set "FE_DIR=!PROJECT_ROOT!\FE"

echo.
echo  ============================================================
echo     ROYCO x AADC - EGGSPRESI CINTA KIOSK AUTO-LAUNCHER
echo  ============================================================
echo   Lokasi Program : "!PROJECT_ROOT!"
echo   Folder FE      : "!FE_DIR!"
echo  ============================================================
echo.

:: 1. Periksa apakah Node.js terinstal
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Node.js tidak terdeteksi di komputer ini!
    echo Silakan unduh dan pasang Node.js versi LTS 18 atau 20 ke atas dari:
    echo https://nodejs.org
    echo.
    echo Tekan tombol apa saja untuk keluar...
    pause >nul
    exit /b 1
)

:: 2. Periksa apakah node_modules sudah tersedia di FE
if not exist "!FE_DIR!\node_modules" (
    echo [INFO] Menyiapkan modul aplikasi pertama kali...
    cd /d "!FE_DIR!"
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERROR] Gagal menjalankan npm install!
        pause
        exit /b 1
    )
)

:: 3. Otomatis daftarkan / perbarui Autostart Windows
:: Agar ketika Mini PC baru hidup, langsung otomatis memulai program ini
set "VBS_AUTOSTART=%TEMP%\royko_reg_autostart.vbs"
echo Set ws = CreateObject("WScript.Shell") > "%VBS_AUTOSTART%"
echo startup = ws.SpecialFolders("Startup") >> "%VBS_AUTOSTART%"
echo Set s = ws.CreateShortcut(startup ^& "\Royko_Kiosk.lnk") >> "%VBS_AUTOSTART%"
echo s.TargetPath = WScript.Arguments(0) >> "%VBS_AUTOSTART%"
echo s.WorkingDirectory = WScript.Arguments(1) >> "%VBS_AUTOSTART%"
echo s.Description = "Royko x AADC Kiosk AutoPlay" >> "%VBS_AUTOSTART%"
echo s.WindowStyle = 1 >> "%VBS_AUTOSTART%"
echo s.Save >> "%VBS_AUTOSTART%"
cscript //nologo "%VBS_AUTOSTART%" "!PROJECT_ROOT!\START_KIOSK.bat" "!PROJECT_ROOT!" >nul 2>&1
if exist "%VBS_AUTOSTART%" del "%VBS_AUTOSTART%" >nul 2>&1
echo [OK] Autostart aktif: Kiosk otomatis berjalan saat Mini PC dihidupkan.
echo.

:: 4. Membersihkan port 3000 dari proses lama & Jalankan Server Kiosk Fresh
echo [1/3] Memeriksa dan membebaskan port 3000 dari proses sebelumnya...
set "PORT_CHECK_LOG=%TEMP%\royko_start_check.txt"
netstat -ano > "!PORT_CHECK_LOG!" 2>nul
for /f "tokens=5" %%p in ('type "!PORT_CHECK_LOG!" 2^>nul ^| findstr /R ":3000.*LISTENING"') do (
    if "%%p" NEQ "0" (
        echo [INFO] Menutup proses lama di port 3000 PID %%p
        taskkill /F /PID %%p >nul 2>&1
    )
)
if exist "!PORT_CHECK_LOG!" del "!PORT_CHECK_LOG!" >nul 2>&1
ping -n 2 127.0.0.1 >nul

echo [INFO] Menjalankan Server Kiosk baru di background...
cd /d "!FE_DIR!"
start "Royko Kiosk Server" /min cmd /k "node node_modules\next\dist\bin\next dev -p 3000"

echo [2/3] Menunggu server siap merespon di port 3000...
set /a RETRIES=0
:wait_server_loop
set /a RETRIES+=1
ping -n 2 127.0.0.1 >nul
set "PORT_READY=0"
netstat -ano > "!PORT_CHECK_LOG!" 2>nul
for /f "tokens=5" %%b in ('type "!PORT_CHECK_LOG!" 2^>nul ^| findstr /R ":3000.*LISTENING"') do (
    set "PORT_READY=1"
)
if exist "!PORT_CHECK_LOG!" del "!PORT_CHECK_LOG!" >nul 2>&1
if "!PORT_READY!"=="0" (
    if !RETRIES! LSS 45 (
        goto wait_server_loop
    )
)
echo [OK] Server Kiosk siap!

:: 5. Buka Browser Layar Kiosk dalam Mode Fullscreen
set "KIOSK_URL=http://localhost:3000"
set "BROWSER_OPENED=0"

echo [3/3] Membuka layar Kiosk interaktif...

:: Cek Microsoft Edge 32/64 bit
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --kiosk "%KIOSK_URL%" --edge-kiosk-type=fullscreen --no-first-run --user-data-dir="%TEMP%\kiosk_edge_profile"
    set "BROWSER_OPENED=1"
    goto browser_ready
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --kiosk "%KIOSK_URL%" --edge-kiosk-type=fullscreen --no-first-run --user-data-dir="%TEMP%\kiosk_edge_profile"
    set "BROWSER_OPENED=1"
    goto browser_ready
)

:: Cek Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk "%KIOSK_URL%" --no-first-run --user-data-dir="%TEMP%\kiosk_chrome_profile"
    set "BROWSER_OPENED=1"
    goto browser_ready
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk "%KIOSK_URL%" --no-first-run --user-data-dir="%TEMP%\kiosk_chrome_profile"
    set "BROWSER_OPENED=1"
    goto browser_ready
)

:: Browser default jika Edge / Chrome tidak di path standar
if "!BROWSER_OPENED!"=="0" (
    start "" "%KIOSK_URL%"
)

:browser_ready
echo.
echo  ============================================================
echo     KIOSK TELAH BERHASIL DIJALANKAN - PLAY OTOMATIS
echo  ============================================================
echo   - URL Kiosk    : %KIOSK_URL%
echo   - Admin Panel  : %KIOSK_URL%/settings
echo   - Keluar Kiosk : Tekan Alt + F4 pada keyboard
echo   - Stop Server  : Jalankan file STOP_KIOSK.bat
echo  ============================================================
echo.
echo Jendela launcher ini akan otomatis tertutup dalam 5 detik...
ping -n 6 127.0.0.1 >nul
exit /b 0
