import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getLocalQuiz } from '@/lib/quiz-data';

export async function GET() {
  try {
    const quiz = getLocalQuiz();
    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memuat data kuis', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Format data kuis tidak valid. Pertanyaan harus berupa array.' },
        { status: 400 }
      );
    }

    const quizPath = path.resolve(process.cwd(), 'data', 'quiz.json');
    const dataDir = path.dirname(quizPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(quizPath, JSON.stringify(body, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Pertanyaan kuis berhasil disimpan.',
      quiz: body,
    });
  } catch (error: any) {
    console.error('Error saving quiz:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan pertanyaan kuis', details: error.message },
      { status: 500 }
    );
  }
}
