import { NextResponse } from 'next/server';
import { generateReceiptEscPos, printToBlueprintQ58D } from '@/lib/printer';
import { getSession, updateSession } from '@/lib/session-store';
import { updatePrintStatusInExcel } from '@/lib/excel';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, token, name: fallbackName, resultTitle: fallbackResult, queueNumber: fallbackQueue } = body;

    // 1. Fetch session info from local memory
    const session = sessionId ? getSession(sessionId) : token ? getSession(token) : undefined;

    const participantName = (session?.name || fallbackName || 'PESERTA').trim();
    const resultTitle = (session?.resultTitle || fallbackResult || 'ACT OF SERVICE').trim();
    const queueNumber = session?.queueNumber || fallbackQueue || 1;

    // Check if already printed
    if (session?.isPrinted) {
      return NextResponse.json(
        {
          error: 'Struk sudah pernah dicetak untuk sesi ini. Maksimal 1 kali cetak per sesi.',
          isPrinted: true,
          queueNumber,
          printedAt: session.printedAt,
        },
        { status: 400 }
      );
    }

    // Format current time as [HH.mm] (e.g. [13.39])
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeFormatted = `[${hours}.${minutes}]`;

    // 2. Generate ESC/POS commands
    const escposBuffer = generateReceiptEscPos({
      name: participantName,
      resultTitle,
      queueNumber,
      time: timeFormatted,
    });

    // 3. Send directly to physical Blueprint BP-Q58D printer via local USB
    try {
      await printToBlueprintQ58D(escposBuffer);
    } catch (printErr: any) {
      console.error('Printer execution error:', printErr);
      return NextResponse.json(
        {
          error: `Gagal mencetak ke printer Blueprint BP-Q58D: ${printErr.message || 'Printer tidak merespon'}. Pastikan kabel USB terhubung dan printer menyala.`,
          isPrinted: false,
        },
        { status: 500 }
      );
    }

    // 4. Update session state
    if (session) {
      updateSession(session.sessionId, {
        isPrinted: true,
        printedAt: now,
      });
    }

    // 5. Update local Excel file row in real-time (Status Cetak -> Sudah Cetak)
    try {
      await updatePrintStatusInExcel(session?.token || token || queueNumber, now);
    } catch (excelErr) {
      console.error('Peringatan: Gagal memperbarui status cetak di Excel:', excelErr);
    }

    return NextResponse.json({
      success: true,
      isPrinted: true,
      queueNumber,
      printedAt: now,
      receiptPreview: {
        name: participantName.toUpperCase(),
        resultTitle: resultTitle === 'Acts of Service' ? '[ACT OF SERVICE]' : `[${resultTitle.toUpperCase()}]`,
        queueNumber: String(queueNumber).padStart(3, '0'),
        time: timeFormatted,
      },
    });
  } catch (error: any) {
    console.error('Error in print route:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses cetak struk.', details: error.message },
      { status: 500 }
    );
  }
}

