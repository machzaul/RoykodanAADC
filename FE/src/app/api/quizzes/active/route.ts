import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Find the first active quiz
    const quiz = await prisma.quiz.findFirst({
      where: { status: true },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              select: {
                id: true,
                text: true,
                image: true,
                score: true,
                // Exclude resultMapping for security
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'No active quiz campaign found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error fetching active quiz:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quiz details.', details: error.message },
      { status: 500 }
    );
  }
}
