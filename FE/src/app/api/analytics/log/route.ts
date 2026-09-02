import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, eventType, device } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required.' },
        { status: 400 }
      );
    }

    // Initialize variables
    let quizId: string | null = null;
    let sessionId: string | null = null;

    // If token is provided, lookup session to map IDs
    if (token) {
      const session = await prisma.quizSession.findUnique({
        where: { token },
      });
      if (session) {
        sessionId = session.id;
        quizId = session.quizId;
      }
    }

    // If no token was matched or provided, find the first active quiz to associate the event
    if (!quizId) {
      const activeQuiz = await prisma.quiz.findFirst({
        where: { status: true },
      });
      if (activeQuiz) {
        quizId = activeQuiz.id;
      }
    }

    if (!quizId) {
      return NextResponse.json(
        { error: 'No active quiz found to log this event against.' },
        { status: 404 }
      );
    }

    // Log the event
    const event = await prisma.analyticsEvent.create({
      data: {
        quizId,
        sessionId,
        eventType,
        device: device || 'unknown',
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Error logging analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to record event.', details: error.message },
      { status: 500 }
    );
  }
}
