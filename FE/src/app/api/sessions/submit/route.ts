import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateResult } from '@/lib/scoring';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, answerIds } = body;

    // Validate inputs
    if (!sessionId || !answerIds || !Array.isArray(answerIds) || answerIds.length === 0) {
      return NextResponse.json(
        { error: 'Session ID and a non-empty array of answer IDs are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch the QuizSession
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { quiz: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Quiz session not found.' },
        { status: 404 }
      );
    }

    // 2. Fetch the selected Answer records from the database
    const answers = await prisma.answer.findMany({
      where: {
        id: { in: answerIds },
      },
      select: {
        id: true,
        resultMapping: true,
        score: true,
      },
    });

    if (answers.length === 0) {
      return NextResponse.json(
        { error: 'No valid answers found for the provided IDs.' },
        { status: 404 }
      );
    }

    // 3. Fetch the possible ResultOption templates for this quiz
    const resultOptions = await prisma.resultOption.findMany({
      where: { quizId: session.quizId },
    });

    if (resultOptions.length === 0) {
      return NextResponse.json(
        { error: 'No result templates configured for this quiz.' },
        { status: 500 }
      );
    }

    // 4. Calculate the winning result
    const winningResult = calculateResult(answers, resultOptions);

    // 5. Update the QuizSession record
    const updatedSession = await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        answers: answerIds,
        resultId: winningResult.id,
        completedAt: new Date(),
      },
      include: {
        result: true,
        participant: true,
      },
    });

    // 6. Log completion event to analytics
    await prisma.analyticsEvent.create({
      data: {
        quizId: session.quizId,
        sessionId: session.id,
        eventType: 'COMPLETE',
      },
    });

    return NextResponse.json({
      success: true,
      token: updatedSession.token,
      result: updatedSession.result,
      participant: updatedSession.participant,
    });
  } catch (error: any) {
    console.error('Error submitting quiz answers:', error);
    return NextResponse.json(
      { error: 'Failed to process quiz submission.', details: error.message },
      { status: 500 }
    );
  }
}
