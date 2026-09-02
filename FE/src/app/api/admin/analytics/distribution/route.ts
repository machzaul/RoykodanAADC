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

    // Get completed sessions count
    const totalCompleted = await prisma.quizSession.count({
      where: { completedAt: { not: null } },
    });

    // Get distribution of results
    const results = await prisma.resultOption.findMany({
      select: {
        id: true,
        title: true,
        code: true,
        subTitle: true,
      },
    });

    const distribution = await Promise.all(
      results.map(async (res) => {
        const count = await prisma.quizSession.count({
          where: { resultId: res.id },
        });

        const percentage = totalCompleted > 0 ? (count / totalCompleted) * 100 : 0;

        return {
          id: res.id,
          title: res.title,
          code: res.code,
          subTitle: res.subTitle,
          count,
          percentage: Math.round(percentage * 100) / 100, // round to 2 decimals
        };
      })
    );

    return NextResponse.json({
      totalCompleted,
      distribution,
    });
  } catch (error: any) {
    console.error('Error fetching result distribution:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve result distribution.', details: error.message },
      { status: 500 }
    );
  }
}
