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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: true,
          },
        },
        resultOptions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error fetching admin quiz detail:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quiz details.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, slug, status } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required fields.' },
        { status: 400 }
      );
    }

    // Check slug uniqueness (excluding current)
    const existing = await prisma.quiz.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A quiz with this slug already exists.' },
        { status: 400 }
      );
    }

    // If status is toggled to true, set all other quizzes to false
    if (status) {
      await prisma.quiz.updateMany({
        where: { id: { not: id } },
        data: { status: false },
      });
    }

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        description,
        slug,
        status: status ?? false,
      },
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error updating admin quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz.', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting admin quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz.', details: error.message },
      { status: 500 }
    );
  }
}
