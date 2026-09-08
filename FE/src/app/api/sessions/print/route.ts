import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateReceiptEscPos, printToBlueprintQ58D } from '@/lib/printer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, token } = body;

    if (!sessionId && !token) {
      return NextResponse.json(
        { error: 'Session ID atau token diperlukan untuk mencetak struk.' },
        { status: 400 }
      );
    }

    // 1. Fetch the QuizSession with participant and result
    const session = await prisma.quizSession.findFirst({
      where: sessionId ? { id: sessionId } : { token },
      include: {
        participant: true,
        result: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi kuis tidak ditemukan.' },
        { status: 404 }
      );
    }

    // 2. Strict check: only 1 receipt per session
    if (session.isPrinted) {
      return NextResponse.json(
        {
          error: 'Struk sudah pernah dicetak untuk sesi ini. Maksimal 1 kali cetak per sesi.',
          isPrinted: true,
          queueNumber: session.queueNumber,
          printedAt: session.printedAt,
        },
        { status: 400 }
      );
    }

    // 3. Ensure queueNumber is assigned
    let queueNumber = session.queueNumber;
    if (!queueNumber) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const lastSessionToday = await prisma.quizSession.findFirst({
        where: {
          queueNumber: { not: null },
          createdAt: { gte: todayStart },
        },
        orderBy: { queueNumber: 'desc' },
      });

      queueNumber = (lastSessionToday?.queueNumber ?? 0) + 1;
    }

    const participantName = session.participant?.name || 'PESERTA';
    const resultTitle = session.result?.title || 'ACT OF SERVICE';

    // Format current time as [HH.mm] (e.g. [13.39])
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeFormatted = `[${hours}.${minutes}]`;

    // 4. Generate ESC/POS commands
    const escposBuffer = generateReceiptEscPos({
      name: participantName,
      resultTitle,
      queueNumber,
      time: timeFormatted,
    });

    // 5. Send to physical Blueprint BP-Q58D printer
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

    // 6. Mark session as printed in database
    const updatedSession = await prisma.quizSession.update({
      where: { id: session.id },
      data: {
        isPrinted: true,
        printedAt: new Date(),
        queueNumber,
      },
    });

    // 7. Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        quizId: session.quizId,
        sessionId: session.id,
        eventType: 'PRINT_RECEIPT',
      },
    });

    return NextResponse.json({
      success: true,
      isPrinted: true,
      queueNumber: updatedSession.queueNumber,
      printedAt: updatedSession.printedAt,
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
