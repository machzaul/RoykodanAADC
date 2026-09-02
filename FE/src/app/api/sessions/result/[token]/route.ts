import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Sharing token is required.' },
        { status: 400 }
      );
    }

    // Find the session matching the token
    const session = await prisma.quizSession.findUnique({
      where: { token },
      include: {
        quiz: true,
        participant: {
          select: {
            id: true,
            name: true,
          },
        },
        result: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Result session not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Error fetching session result by token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sharing result.', details: error.message },
      { status: 500 }
    );
  }
}
