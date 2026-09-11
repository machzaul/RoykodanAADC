import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ReceiptData {
  name: string;
  resultTitle: string;
  queueNumber: number | string;
  time?: Date | string;
}

export function generateReceiptEscPos(data: ReceiptData): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;

  const chunks: Buffer[] = [];

  // 1. Initialize printer (ESC @)
  chunks.push(Buffer.from([ESC, 0x40]));

  // 2. Center alignment (ESC a 1)
  chunks.push(Buffer.from([ESC, 0x61, 0x01]));

  // Top spacing
  chunks.push(Buffer.from('\n', 'ascii'));

  // 3. [NAME]
  // In Image 3: "ANNA CHEN" - Double height, bold, centered
  chunks.push(Buffer.from([GS, 0x21, 0x01])); // GS ! 0x01: Double Height, Normal Width
  chunks.push(Buffer.from([ESC, 0x45, 0x01])); // ESC E 1: Bold ON
  const nameText = (data.name || 'PESERTA').trim().toUpperCase();
  chunks.push(Buffer.from(`${nameText}\n`, 'ascii'));

  // 4. [LOVE LANGUAGE TEST RESULT]
  // In Image 3: "[ACT OF SERVICE]" - Normal size, bold, centered in brackets
  chunks.push(Buffer.from([GS, 0x21, 0x00])); // GS ! 0x00: Normal size
  chunks.push(Buffer.from([ESC, 0x45, 0x01])); // ESC E 1: Bold ON
  let cleanResult = (data.resultTitle || 'ACT OF SERVICE').trim().toUpperCase();
  if (cleanResult === 'ACTS OF SERVICE') {
    cleanResult = 'ACT OF SERVICE';
  }
  chunks.push(Buffer.from(`[${cleanResult}]\n\n`, 'ascii'));

  // 5. [QUEUE NUMBER]
  // In Image 3: "042" - Double width + double height, bold, centered
  chunks.push(Buffer.from([GS, 0x21, 0x11])); // GS ! 0x11: Double Width + Double Height
  chunks.push(Buffer.from([ESC, 0x45, 0x01])); // ESC E 1: Bold ON
  const queueStr = typeof data.queueNumber === 'number'
    ? String(data.queueNumber).padStart(3, '0')
    : String(data.queueNumber).padStart(3, '0');
  chunks.push(Buffer.from(`${queueStr}\n\n`, 'ascii'));

  // 6. [TIME]
  // In Image 3: "[13.39]" - Normal size, regular, centered in brackets [HH.mm]
  chunks.push(Buffer.from([GS, 0x21, 0x00])); // GS ! 0x00: Normal size
  chunks.push(Buffer.from([ESC, 0x45, 0x00])); // ESC E 0: Bold OFF

  let timeString = '';
  if (typeof data.time === 'string' && data.time.startsWith('[') && data.time.endsWith(']')) {
    timeString = data.time;
  } else {
    const d = data.time instanceof Date ? data.time : new Date();
    // Using local/WIB hours and minutes
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    timeString = `[${hours}.${minutes}]`;
  }
  chunks.push(Buffer.from(`${timeString}\n`, 'ascii'));

  // 7. Paper Feed & Cut
  // ESC d 4: Feed 4 lines to clear tear bar
  chunks.push(Buffer.from([ESC, 0x64, 0x04]));
  // GS V 66 0: Partial Cut (harmless if tear bar only)
  chunks.push(Buffer.from([GS, 0x56, 0x42, 0x00]));

  return Buffer.concat(chunks);
}

/**
 * Mencari file executable RawPrinter.exe di berbagai lokasi folder kerja
 */
export function getRawPrinterExePath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'scripts', 'RawPrinter.exe'),
    path.resolve(process.cwd(), 'FE', 'scripts', 'RawPrinter.exe'),
    path.resolve(__dirname, '..', '..', '..', 'scripts', 'RawPrinter.exe'),
    path.resolve(__dirname, '..', '..', 'scripts', 'RawPrinter.exe'),
    path.resolve(__dirname, '..', 'scripts', 'RawPrinter.exe'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Mencari nama printer Windows yang terpasang secara cerdas.
 * Mendeteksi Blueprint BP-Q58D, POS-58, atau printer thermal USB lainnya secara otomatis jika nama persis tidak ditemukan.
 */
export async function resolveWindowsPrinterName(
  configuredName = process.env.PRINTER_NAME
): Promise<string> {
  const defaultFallback = 'Blueprint BP-Q58D';
  if (process.platform !== 'win32') {
    return (configuredName || defaultFallback).trim();
  }

  // Jika user secara spesifik mengatur PRINTER_NAME di .env, prioritaskan nama tersebut
  if (configuredName && configuredName.trim().length > 0 && configuredName.trim() !== defaultFallback) {
    return configuredName.trim();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(defaultFallback);
    }, 2000);

    const ps = `Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name`;

    execFile('powershell', ['-NoProfile', '-Command', ps], (err, stdout) => {
      clearTimeout(timer);
      if (err || !stdout) {
        return resolve(defaultFallback);
      }

      const names = stdout
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      // 1. Cek kecocokan persis "Blueprint BP-Q58D"
      const exactBp = names.find((n) => n.toLowerCase() === defaultFallback.toLowerCase());
      if (exactBp) return resolve(exactBp);

      // 2. Cek printer yang memiliki kata "Blueprint" atau "BP-Q58" atau "Q58"
      const bpMatch = names.find(
        (n) =>
          n.toLowerCase().includes('blueprint') ||
          n.toLowerCase().includes('bp-q58') ||
          n.toLowerCase().includes('q58')
      );
      if (bpMatch) return resolve(bpMatch);

      // 3. Cek printer POS-58 thermal umum
      const posMatch = names.find(
        (n) =>
          n.toLowerCase().includes('pos-58') ||
          n.toLowerCase().includes('pos 58') ||
          n.toLowerCase().includes('pos58') ||
          n.toLowerCase().includes('thermal')
      );
      if (posMatch) return resolve(posMatch);

      resolve(defaultFallback);
    });
  });
}

/**
 * Memeriksa apakah driver printer terdaftar di Windows tanpa memblokir printer thermal yang WorkOffline/non-PnP.
 */
export async function checkPrinterPhysicalStatus(
  printerName?: string
): Promise<{ online: boolean; error?: string }> {
  if (process.platform !== 'win32') {
    return { online: true };
  }

  const name = printerName || (await resolveWindowsPrinterName());

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ online: true });
    }, 2000);

    const ps = `
      $p = Get-CimInstance Win32_Printer | Where-Object { $_.Name -like "*${name}*" }
      if (-not $p) {
        Write-Output "NOT_FOUND"
      } else {
        Write-Output "FOUND"
      }
    `;

    execFile('powershell', ['-NoProfile', '-Command', ps], (err, stdout) => {
      clearTimeout(timer);
      if (err) {
        return resolve({ online: true });
      }
      const result = (stdout || '').trim();
      if (result === 'NOT_FOUND') {
        resolve({
          online: false,
          error: `Printer '${name}' belum terdaftar di Windows. Silakan cek Control Panel -> Devices and Printers.`,
        });
      } else {
        resolve({ online: true });
      }
    });
  });
}

export async function printToBlueprintQ58D(buffer: Buffer): Promise<{ success: boolean; message?: string }> {
  const printerName = await resolveWindowsPrinterName();
  const exePath = getRawPrinterExePath();
  const base64Data = buffer.toString('base64');

  // Jalur Utama: Menggunakan RawPrinter.exe (Win32 Spooler RAW mode)
  if (exePath && fs.existsSync(exePath)) {
    return new Promise((resolve, reject) => {
      execFile(exePath, [printerName, base64Data, '--base64'], (error, stdout, stderr) => {
        if (error) {
          const errOutput = (stderr || stdout || error.message || '').trim();
          console.error('RawPrinter.exe failed:', errOutput);
          if (errOutput.includes('1801')) {
            return reject(
              new Error(
                `Printer '${printerName}' tidak ditemukan di Windows. Pastikan nama printer di Devices & Printers sesuai atau tentukan PRINTER_NAME di .env.`
              )
            );
          }
          return reject(
            new Error(
              `Gagal mencetak ke printer '${printerName}': ${errOutput || 'Printer tidak merespon'}. Pastikan daya printer menyala dan kabel USB terhubung.`
            )
          );
        }
        resolve({ success: true, message: stdout.trim() });
      });
    });
  }

  // Jalur Cadangan (Fallback): Menggunakan Win32 API winspool.drv via PowerShell C# Add-Type
  const psScript = `
    $bytes = [System.Convert]::FromBase64String("${base64Data}")
    $source = @"
    using System;
    using System.Runtime.InteropServices;
    public class DirectSpooler {
      [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
      public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName = "ThermalReceipt";
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile = null;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType = "RAW";
      }
      [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
      public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
      [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true)]
      public static extern bool ClosePrinter(IntPtr hPrinter);
      [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
      public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In] DOCINFOA di);
      [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
      public static extern bool EndDocPrinter(IntPtr hPrinter);
      [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
      public static extern bool StartPagePrinter(IntPtr hPrinter);
      [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
      public static extern bool EndPagePrinter(IntPtr hPrinter);
      [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true)]
      public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
      public static bool Send(string printer, byte[] data) {
        IntPtr pData = Marshal.AllocCoTaskMem(data.Length);
        Marshal.Copy(data, 0, pData, data.Length);
        IntPtr hPrinter;
        bool ok = false;
        if (OpenPrinter(printer, out hPrinter, IntPtr.Zero)) {
          DOCINFOA di = new DOCINFOA();
          if (StartDocPrinter(hPrinter, 1, di)) {
            if (StartPagePrinter(hPrinter)) {
              int written = 0;
              ok = WritePrinter(hPrinter, pData, data.Length, out written);
              EndPagePrinter(hPrinter);
            }
            EndDocPrinter(hPrinter);
          }
          ClosePrinter(hPrinter);
        }
        Marshal.FreeCoTaskMem(pData);
        return ok;
      }
    }
"@
    Add-Type -TypeDefinition $source -Language CSharp
    $ok = [DirectSpooler]::Send("${printerName}", $bytes)
    if (-not $ok) { exit 1 }
    Write-Output "SUCCESS"
  `;

  return new Promise((resolve, reject) => {
    execFile('powershell', ['-NoProfile', '-Command', psScript], (error, stdout, stderr) => {
      if (error) {
        return reject(
          new Error(
            `Gagal mencetak ke printer '${printerName}': ${stderr || error.message}. Pastikan printer menyala dan kabel USB terhubung.`
          )
        );
      }
      resolve({ success: true, message: stdout.trim() });
    });
  });
}
