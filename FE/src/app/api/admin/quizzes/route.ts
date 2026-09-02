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

export async function GET() {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json(quizzes);
  } catch (error: any) {
    console.error('Error fetching admin quizzes list:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quizzes.', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await validateAuth();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, slug, status } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required fields.' },
        { status: 400 }
      );
    }

    // Ensure unique slug
    const existing = await prisma.quiz.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A quiz with this slug already exists.' },
        { status: 400 }
      );
    }

    // If status is true, set all other quizzes to status false
    if (status) {
      await prisma.quiz.updateMany({
        data: { status: false },
      });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        slug,
        status: status ?? false,
      },
    });

    return NextResponse.json(quiz);
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz.', details: error.message },
      { status: 500 }
    );
  }
}
