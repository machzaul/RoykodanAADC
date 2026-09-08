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

export async function printToBlueprintQ58D(buffer: Buffer): Promise<{ success: boolean; message?: string }> {
  const printerName = process.env.PRINTER_NAME || 'Blueprint BP-Q58D';
  const exePath = path.resolve(process.cwd(), 'scripts', 'RawPrinter.exe');
  const base64Data = buffer.toString('base64');

  if (fs.existsSync(exePath)) {
    return new Promise((resolve, reject) => {
      execFile(exePath, [printerName, base64Data, '--base64'], (error, stdout, stderr) => {
        if (error) {
          console.error('RawPrinter.exe failed:', stderr || stdout || error.message);
          return reject(new Error(`Gagal mencetak ke ${printerName}: ${stderr || stdout || error.message}`));
        }
        resolve({ success: true, message: stdout.trim() });
      });
    });
  }

  // Fallback to PowerShell script if RawPrinter.exe is missing
  const psScript = `
    $base64 = "${base64Data}"
    $bytes = [System.Convert]::FromBase64String($base64)
    # Write to temp file
    $tmp = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllBytes($tmp, $bytes)
    # Output to printer
    Get-Content -Path $tmp -Encoding Byte -Raw | Out-Printer -Name "${printerName}" -ErrorAction Stop
    Remove-Item $tmp -Force
  `;

  return new Promise((resolve, reject) => {
    execFile('powershell', ['-NoProfile', '-Command', psScript], (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Gagal mencetak lewat PowerShell ke ${printerName}: ${stderr || error.message}`));
      }
      resolve({ success: true, message: stdout.trim() });
    });
  });
}
