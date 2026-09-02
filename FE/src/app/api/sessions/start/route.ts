import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function generateToken(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, consent, newsletter, quizId } = body;

    // Validate inputs
    if (!name || !phone || !quizId) {
      return NextResponse.json(
        { error: 'Name, phone number, and quiz ID are required.' },
        { status: 400 }
      );
    }

    // 1. Find or create Participant based on phone number
    let participant = await prisma.participant.findFirst({
      where: { phone },
    });

    if (participant) {
      // Update participant info
      participant = await prisma.participant.update({
        where: { id: participant.id },
        data: { name, phone, email: email || null, consent, newsletter },
      });
    } else {
      // Create new participant
      participant = await prisma.participant.create({
        data: { name, phone, email: email || null, consent, newsletter },
      });
    }

    // 2. Generate unique share token
    let token = generateToken();
    let tokenExists = await prisma.quizSession.findUnique({
      where: { token },
    });

    // Ensure token uniqueness
    while (tokenExists) {
      token = generateToken();
      tokenExists = await prisma.quizSession.findUnique({
        where: { token },
      });
    }

    // 3. Create QuizSession
    const session = await prisma.quizSession.create({
      data: {
        quizId,
        participantId: participant.id,
        answers: [], // empty list of answers
        token,
      },
    });

    // 4. Log start event to analytics
    await prisma.analyticsEvent.create({
      data: {
        quizId,
        sessionId: session.id,
        eventType: 'START',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      token: session.token,
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Failed to initialize session.', details: error.message },
      { status: 500 }
    );
  }
}
