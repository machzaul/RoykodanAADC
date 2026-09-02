export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

async function validateAuth() {
  const headerList = await headers();
  const token = headerList.get('Authorization')?.replace('Bearer ', '');
  const secret = process.env.ADMIN_PASSWORD || 'adminpass123';
  return token === secret;
}

export async function POST(request: Request) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, text, order, image, answers } = body;

    if (!quizId || !text || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'quizId, question text, and answers list are required.' },
        { status: 400 }
      );
    }

    // Create question and answers inside a transaction
    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          quizId,
          text,
          order: order ?? 0,
          image,
        },
      });

      if (answers.length > 0) {
        await tx.answer.createMany({
          data: answers.map((ans: any) => ({
            questionId: q.id,
            text: ans.text,
            image: ans.image || null,
            score: ans.score ?? 0,
            resultMapping: ans.resultMapping || {},
          })),
        });
      }

      return tx.question.findUnique({
        where: { id: q.id },
        include: { answers: true },
      });
    });

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, text, order, image, answers } = body;

    if (!id || !text || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'id, question text, and answers list are required.' },
        { status: 400 }
      );
    }

    const question = await prisma.$transaction(async (tx) => {
      // Update question text and order
      const q = await tx.question.update({
        where: { id },
        data: { text, order: order ?? 0, image },
      });

      // Clear existing answers
      await tx.answer.deleteMany({
        where: { questionId: id },
      });

      // Recreate answers
      if (answers.length > 0) {
        await tx.answer.createMany({
          data: answers.map((ans: any) => ({
            questionId: q.id,
            text: ans.text,
            image: ans.image || null,
            score: ans.score ?? 0,
            resultMapping: ans.resultMapping || {},
          })),
        });
      }

      return tx.question.findUnique({
        where: { id: q.id },
        include: { answers: true },
      });
    });

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Question id is required.' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question.', details: error.message },
      { status: 500 }
    );
  }
}
