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

    // Fetch counts
    const totalParticipants = await prisma.participant.count();
    const totalCompleted = await prisma.quizSession.count({
      where: { completedAt: { not: null } },
    });

    const downloadCount = await prisma.analyticsEvent.count({
      where: { eventType: 'DOWNLOAD' },
    });

    const shareCount = await prisma.analyticsEvent.count({
      where: {
        eventType: { in: ['SHARE_IG', 'SHARE_WA', 'SHARE_NATIVE'] },
      },
    });

    const qrScanCount = await prisma.analyticsEvent.count({
      where: { eventType: 'QR_SCAN' },
    });

    return NextResponse.json({
      totalParticipants,
      totalCompleted,
      downloadCount,
      shareCount,
      qrScanCount,
    });
  } catch (error: any) {
    console.error('Error fetching admin summary analytics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics summary.', details: error.message },
      { status: 500 }
    );
  }
}
