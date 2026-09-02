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
    const {
      quizId,
      code,
      title,
      subTitle,
      description,
      image,
      backgroundColor,
      ctaText,
      ctaUrl,
    } = body;

    if (!quizId || !code || !title || !description || !image) {
      return NextResponse.json(
        { error: 'quizId, code, title, description, and image are required.' },
        { status: 400 }
      );
    }

    const resultOption = await prisma.resultOption.create({
      data: {
        quizId,
        code,
        title,
        subTitle,
        description,
        image,
        backgroundColor: backgroundColor || '#E53E3E',
        ctaText: ctaText || 'COOK IT NOW',
        ctaUrl,
      },
    });

    return NextResponse.json(resultOption);
  } catch (error: any) {
    console.error('Error creating result template:', error);
    return NextResponse.json(
      { error: 'Failed to create result template.', details: error.message },
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
    const {
      id,
      code,
      title,
      subTitle,
      description,
      image,
      backgroundColor,
      ctaText,
      ctaUrl,
    } = body;

    if (!id || !code || !title || !description || !image) {
      return NextResponse.json(
        { error: 'id, code, title, description, and image are required.' },
        { status: 400 }
      );
    }

    const resultOption = await prisma.resultOption.update({
      where: { id },
      data: {
        code,
        title,
        subTitle,
        description,
        image,
        backgroundColor: backgroundColor || '#E53E3E',
        ctaText: ctaText || 'COOK IT NOW',
        ctaUrl,
      },
    });

    return NextResponse.json(resultOption);
  } catch (error: any) {
    console.error('Error updating result template:', error);
    return NextResponse.json(
      { error: 'Failed to update result template.', details: error.message },
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
      return NextResponse.json({ error: 'Result option id is required.' }, { status: 400 });
    }

    await prisma.resultOption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Result option deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting result template:', error);
    return NextResponse.json(
      { error: 'Failed to delete result template.', details: error.message },
      { status: 500 }
    );
  }
}
