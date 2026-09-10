import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

export interface ParticipantRecord {
  queueNumber: number;
  sessionToken: string;
  name: string;
  phone: string;
  email?: string;
  consent: boolean;
  newsletter: boolean;
  resultTitle: string;
  recipeSubtitle: string;
  isPrinted: boolean;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  printedAt?: string;
  answersSummary?: string;
}

const EXCEL_FILE_PATH = path.resolve(process.cwd(), 'data', 'peserta_kuis.xlsx');

const TITLE_TO_SLUG_MAP: Record<string, string> = {
  'acts of service': 'acts-of-service',
  'acts_of_service': 'acts-of-service',
  'quality time': 'quality-time',
  'quality_time': 'quality-time',
  'physical touch': 'physical-touch',
  'physical_touch': 'physical-touch',
  'receiving gifts': 'receiving-gifts',
  'receiving_gifts': 'receiving-gifts',
  'words of affirmation': 'words-of-affirmation',
  'words_of_affirmation': 'words-of-affirmation',
};

// Global in-memory cache to maintain fast counts across requests
const globalCardCounts = globalThis as unknown as {
  __cardCountsCache?: Record<string, number>;
};

export function normalizeCardSlug(titleOrSlug: string): string {
  const norm = String(titleOrSlug || '').toLowerCase().trim();
  return TITLE_TO_SLUG_MAP[norm] || norm.replace(/\s+/g, '-');
}

/**
 * Increment in-memory counter for a card
 */
export function incrementCardCount(slugOrTitle: string): void {
  const slug = normalizeCardSlug(slugOrTitle);
  if (!globalCardCounts.__cardCountsCache) {
    globalCardCounts.__cardCountsCache = {
      'acts-of-service': 0,
      'quality-time': 0,
      'physical-touch': 0,
      'receiving-gifts': 0,
      'words-of-affirmation': 0,
    };
  }
  globalCardCounts.__cardCountsCache[slug] = (globalCardCounts.__cardCountsCache[slug] || 0) + 1;
}

/**
 * Membaca file Excel dan menghitung berapa banyak tiap kartu telah dikeluarkan.
 */
export async function getCardCountsFromExcel(forceRefresh = false): Promise<Record<string, number>> {
  if (!forceRefresh && globalCardCounts.__cardCountsCache) {
    return { ...globalCardCounts.__cardCountsCache };
  }

  ensureDataDir();

  const counts: Record<string, number> = {
    'acts-of-service': 0,
    'quality-time': 0,
    'physical-touch': 0,
    'receiving-gifts': 0,
    'words-of-affirmation': 0,
  };

  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    globalCardCounts.__cardCountsCache = counts;
    return counts;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.getWorksheet('Data Pengunjung');
    if (!worksheet) {
      globalCardCounts.__cardCountsCache = counts;
      return counts;
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const resultTitle = String(row.getCell(8).value || '');
      const slug = normalizeCardSlug(resultTitle);
      if (counts[slug] !== undefined) {
        counts[slug]++;
      } else if (slug) {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    });

    globalCardCounts.__cardCountsCache = counts;
    return counts;
  } catch (err) {
    console.error('Error saat menghitung jumlah kartu dari Excel:', err);
    return counts;
  }
}

function ensureDataDir() {
  const dataDir = path.dirname(EXCEL_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Format tanggal lokal ke format YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Inisialisasi worksheet dengan kolom dan styling Royko
 */
function setupWorksheet(worksheet: ExcelJS.Worksheet) {
  worksheet.columns = [
    { header: 'No. Antrean', key: 'queueNumber', width: 14 },
    { header: 'Waktu Daftar', key: 'timestamp', width: 22 },
    { header: 'Nama Peserta', key: 'name', width: 24 },
    { header: 'Nomor WhatsApp / HP', key: 'phone', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'S&K (Consent)', key: 'consent', width: 15 },
    { header: 'Newsletter', key: 'newsletter', width: 14 },
    { header: 'Hasil Love Language', key: 'resultTitle', width: 24 },
    { header: 'Sub Judul Resep Omelet', key: 'recipeSubtitle', width: 36 },
    { header: 'Status Cetak', key: 'isPrinted', width: 16 },
    { header: 'Waktu Cetak Struk', key: 'printedAt', width: 22 },
    { header: 'Token Sesi', key: 'sessionToken', width: 16 },
    { header: 'Ringkasan Jawaban', key: 'answersSummary', width: 40 },
  ];

  // Style header row (Merah Royco dengan teks putih tebal)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE50012' }, // Royco Red
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (let c = 1; c <= 13; c++) {
    const cell = headerRow.getCell(c);
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF99000B' } },
      left: { style: 'thin', color: { argb: 'FF99000B' } },
      bottom: { style: 'medium', color: { argb: 'FF151515' } },
      right: { style: 'thin', color: { argb: 'FF99000B' } },
    };
  }
}

/**
 * Dapatkan nomor antrean berikutnya (dimulai dari 1 setiap hari)
 */
export async function getNextQueueNumber(): Promise<number> {
  ensureDataDir();

  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    return 1;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.getWorksheet('Data Pengunjung');
    if (!worksheet) return 1;

    const todayPrefix = formatDateTime().slice(0, 10); // YYYY-MM-DD
    let maxQueue = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const rowDate = String(row.getCell(2).value || ''); // kolom Waktu Daftar
      const queueVal = Number(row.getCell(1).value);

      if (rowDate.startsWith(todayPrefix) && !isNaN(queueVal)) {
        if (queueVal > maxQueue) {
          maxQueue = queueVal;
        }
      }
    });

    return maxQueue + 1;
  } catch (err) {
    console.error('Error saat menghitung nomor antrean dari Excel:', err);
    return 1;
  }
}

/**
 * Menulis workbook dengan aman. Jika file sedang dibuka/dikunci di Microsoft Excel,
 * lakukan retry dan fallback ke file backup agar data tidak hilang.
 */
async function writeWorkbookSafe(workbook: ExcelJS.Workbook, filePath: string): Promise<void> {
  try {
    await workbook.xlsx.writeFile(filePath);
  } catch (err: any) {
    if (err?.code === 'EBUSY' || err?.code === 'EPERM' || err?.message?.includes('busy') || err?.message?.includes('locked')) {
      console.warn(`[EXCEL LOCK] File ${filePath} sedang dibuka di aplikasi lain. Mencoba lagi dalam 400ms...`);
      await new Promise((resolve) => setTimeout(resolve, 400));
      try {
        await workbook.xlsx.writeFile(filePath);
        return;
      } catch (retryErr) {
        const backupPath = filePath.replace('.xlsx', `_backup_${Date.now()}.xlsx`);
        console.error(`[EXCEL LOCK] File ${filePath} masih terkunci. Data disimpan ke: ${backupPath}`);
        await workbook.xlsx.writeFile(backupPath);
      }
    } else {
      throw err;
    }
  }
}

/**
 * Menyimpan data peserta baru ke file Excel secara real-time
 */
export async function saveParticipantToExcel(record: ParticipantRecord): Promise<void> {
  ensureDataDir();
  incrementCardCount(record.resultTitle);

  const workbook = new ExcelJS.Workbook();
  let worksheet: ExcelJS.Worksheet;

  if (fs.existsSync(EXCEL_FILE_PATH)) {
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    worksheet = workbook.getWorksheet('Data Pengunjung') || workbook.addWorksheet('Data Pengunjung');
  } else {
    worksheet = workbook.addWorksheet('Data Pengunjung');
    setupWorksheet(worksheet);
  }

  // Jika worksheet kosong tanpa header, setup kolom terlebih dahulu
  if (worksheet.rowCount === 0) {
    setupWorksheet(worksheet);
  }

  // Gunakan Array agar pemetaan nilai kolom akurat dan tidak terpengaruh ketiadaan key pada objek
  const rowValues = [
    record.queueNumber,
    record.timestamp,
    record.name,
    record.phone,
    record.email || '-',
    record.consent ? 'Ya' : 'Tidak',
    record.newsletter ? 'Ya' : 'Tidak',
    record.resultTitle,
    record.recipeSubtitle,
    record.isPrinted ? 'Sudah Cetak' : 'Belum Cetak',
    record.printedAt || '-',
    record.sessionToken,
    record.answersSummary || '-',
  ];

  const newRow = worksheet.addRow(rowValues);
  const rowNumber = newRow.number;

  newRow.height = 22;
  newRow.font = { name: 'Calibri', size: 10 };
  newRow.alignment = { vertical: 'middle', horizontal: 'left' };

  // Center align certain columns
  newRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }; // queueNumber
  newRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }; // timestamp
  newRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' }; // consent
  newRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' }; // newsletter
  newRow.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' }; // isPrinted
  newRow.getCell(11).alignment = { vertical: 'middle', horizontal: 'center' }; // printedAt
  newRow.getCell(12).alignment = { vertical: 'middle', horizontal: 'center' }; // sessionToken

  // Borders for all cells in row
  for (let c = 1; c <= 13; c++) {
    newRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // Zebra striping for readability
  if (rowNumber % 2 === 0) {
    for (let c = 1; c <= 13; c++) {
      newRow.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFDF8EE' }, // Very subtle warm cream
      };
    }
  }

  await writeWorkbookSafe(workbook, EXCEL_FILE_PATH);
}

/**
 * Memperbarui status cetak di file Excel saat struk berhasil dicetak
 */
export async function updatePrintStatusInExcel(
  tokenOrQueue: string | number,
  printedAt: Date = new Date()
): Promise<boolean> {
  ensureDataDir();

  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    return false;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.getWorksheet('Data Pengunjung');
    if (!worksheet) return false;

    let updated = false;
    const printedAtFormatted = formatDateTime(printedAt);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const queueVal = row.getCell(1).value;
      const tokenVal = row.getCell(12).value;

      const match =
        (typeof tokenOrQueue === 'number' && Number(queueVal) === tokenOrQueue) ||
        (typeof tokenOrQueue === 'string' && (String(tokenVal) === tokenOrQueue || String(queueVal) === tokenOrQueue));

      if (match) {
        // Kolom 10: Status Cetak
        const cellStatus = row.getCell(10);
        cellStatus.value = 'Sudah Cetak';
        cellStatus.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF9A3412' } };

        // Kolom 11: Waktu Cetak
        row.getCell(11).value = printedAtFormatted;

        updated = true;
      }
    });

    if (updated) {
      await writeWorkbookSafe(workbook, EXCEL_FILE_PATH);
    }
    return updated;
  } catch (err) {
    console.error('Gagal memperbarui status cetak di Excel:', err);
    return false;
  }
}

/**
 * Mengambil informasi statistik file Excel peserta
 */
export async function getExcelStats(): Promise<{
  exists: boolean;
  totalRows: number;
  filePath: string;
  fileSize: string;
  lastModified: string | null;
}> {
  ensureDataDir();
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    return {
      exists: false,
      totalRows: 0,
      filePath: 'FE/data/peserta_kuis.xlsx',
      fileSize: '0 KB',
      lastModified: null,
    };
  }

  try {
    const stats = fs.statSync(EXCEL_FILE_PATH);
    const sizeKb = (stats.size / 1024).toFixed(1) + ' KB';
    const lastModified = formatDateTime(stats.mtime);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(EXCEL_FILE_PATH);
    const worksheet = workbook.getWorksheet('Data Pengunjung') || workbook.worksheets[0];
    const totalRows = worksheet ? Math.max(0, worksheet.rowCount - 1) : 0;

    return {
      exists: true,
      totalRows,
      filePath: 'FE/data/peserta_kuis.xlsx',
      fileSize: sizeKb,
      lastModified,
    };
  } catch (err) {
    return {
      exists: true,
      totalRows: 0,
      filePath: 'FE/data/peserta_kuis.xlsx',
      fileSize: '0 KB',
      lastModified: null,
    };
  }
}

/**
 * Menghapus seluruh data peserta di file Excel (mereset ke template kosong hanya header)
 */
export async function clearAllExcelData(): Promise<{ success: boolean; countDeleted: number }> {
  ensureDataDir();
  let countDeleted = 0;

  if (fs.existsSync(EXCEL_FILE_PATH)) {
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(EXCEL_FILE_PATH);
      const ws = wb.getWorksheet('Data Pengunjung') || wb.worksheets[0];
      if (ws) {
        countDeleted = Math.max(0, ws.rowCount - 1);
      }
    } catch (e) {
      console.warn('Error reading row count before clear:', e);
    }
  }

  // Buat workbook baru yang bersih hanya dengan header
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Pengunjung');
  setupWorksheet(worksheet);
  await writeWorkbookSafe(workbook, EXCEL_FILE_PATH);

  // Bersihkan file backup jika ada
  try {
    const dir = path.dirname(EXCEL_FILE_PATH);
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith('peserta_kuis_backup_') && f.endsWith('.xlsx')) {
        fs.unlinkSync(path.join(dir, f));
      }
    }
  } catch (err) {
    console.warn('Gagal menghapus file backup excel:', err);
  }

  // Reset in-memory cache hitungan kartu ke 0
  globalCardCounts.__cardCountsCache = {
    'acts-of-service': 0,
    'quality-time': 0,
    'physical-touch': 0,
    'receiving-gifts': 0,
    'words-of-affirmation': 0,
  };

  // Bersihkan sessions map in-memory
  try {
    const { sessionsMap } = await import('./session-store');
    sessionsMap.clear();
  } catch {
    // Abaikan jika import gagal
  }

  return { success: true, countDeleted };
}

