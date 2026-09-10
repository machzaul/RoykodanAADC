import { NextResponse } from 'next/server';
import { createSession, generateToken } from '@/lib/session-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, consent, newsletter, quizId } = body;

    // Validate inputs
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nama dan nomor telepon wajib diisi.' },
        { status: 400 }
      );
    }

    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const token = generateToken(8);

    const session = createSession({
      sessionId,
      token,
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : undefined,
      consent: Boolean(consent),
      newsletter: Boolean(newsletter),
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Gagal memulai sesi kuis.', details: error.message },
      { status: 500 }
    );
  }
}

