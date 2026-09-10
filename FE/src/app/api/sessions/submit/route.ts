import { NextResponse } from 'next/server';
import { calculateQuizResult } from '@/lib/quiz-data';
import { getSession, updateSession } from '@/lib/session-store';
import { getNextQueueNumber, saveParticipantToExcel, formatDateTime, getCardCountsFromExcel } from '@/lib/excel';
import { getAllCardQuotas } from '@/lib/cards-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, answerIds, name, phone, email, consent, newsletter } = body;

    // Validate inputs
    if (!answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
      return NextResponse.json(
        { error: 'Daftar jawaban kuis diperlukan.' },
        { status: 400 }
      );
    }

    // 1. Fetch session from local memory if available
    const existingSession = sessionId ? getSession(sessionId) : undefined;
    const participantName = (existingSession?.name || name || 'Peserta').trim();
    const participantPhone = (existingSession?.phone || phone || '-').trim();
    const participantEmail = existingSession?.email || email || undefined;
    const participantConsent = existingSession?.consent ?? Boolean(consent);
    const participantNewsletter = existingSession?.newsletter ?? Boolean(newsletter);
    const sessionToken = existingSession?.token || ('tok_' + Math.random().toString(36).substring(2, 9));

    // 2. Fetch current card counts and quotas (maksimal keluar 100 kartu)
    const [cardCounts, cardQuotas] = await Promise.all([
      getCardCountsFromExcel(),
      getAllCardQuotas(),
    ]);

    // Calculate winning result with quota check (jika >= 100, dialihkan random ke kartu lain)
    const { card, answersText, isQuotaFallback } = calculateQuizResult(
      answerIds,
      cardCounts,
      cardQuotas
    );

    // 3. Get next daily queue number from local Excel
    const queueNumber = await getNextQueueNumber();
    const nowFormatted = formatDateTime();

    // 4. Save participant row directly to local Excel (peserta_kuis.xlsx)
    try {
      await saveParticipantToExcel({
        queueNumber,
        sessionToken,
        name: participantName,
        phone: participantPhone,
        email: participantEmail,
        consent: participantConsent,
        newsletter: participantNewsletter,
        resultTitle: card.title,
        recipeSubtitle: card.subTitle,
        isPrinted: false,
        timestamp: nowFormatted,
        answersSummary: answersText.join(' | '),
      });
    } catch (excelErr) {
      console.error('Peringatan: Gagal menyimpan data ke Excel:', excelErr);
    }

    // 5. Update session in local store
    if (sessionId) {
      updateSession(sessionId, {
        answerIds,
        resultCode: card.code,
        resultTitle: card.title,
        recipeSubtitle: card.subTitle,
        queueNumber,
        isPrinted: false,
      });
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
      result: card,
      queueNumber,
      isPrinted: false,
    });
  } catch (error: any) {
    console.error('Error submitting quiz answers:', error);
    return NextResponse.json(
      { error: 'Gagal memproses jawaban kuis.', details: error.message },
      { status: 500 }
    );
  }
}

