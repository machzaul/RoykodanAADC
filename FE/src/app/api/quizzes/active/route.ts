import { NextResponse } from 'next/server';
import { getLocalQuiz } from '@/lib/quiz-data';

export async function GET() {
  try {
    const quiz = getLocalQuiz();
    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error fetching active quiz:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quiz details.', details: error.message },
      { status: 500 }
    );
  }
}

