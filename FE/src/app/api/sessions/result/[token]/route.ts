import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session-store';
import { getCardByIdOrSlug, DEFINED_CARDS } from '@/lib/cards';

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

    // 1. Check local session store
    const localSession = getSession(token);
    if (localSession) {
      const card = (localSession.resultCode && getCardByIdOrSlug(localSession.resultCode)) ||
                   (localSession.resultTitle && getCardByIdOrSlug(localSession.resultTitle)) ||
                   DEFINED_CARDS['1'];
      return NextResponse.json({
        id: localSession.sessionId,
        token: localSession.token,
        participant: { name: localSession.name },
        result: card,
        queueNumber: localSession.queueNumber,
      });
    }

    // 2. Check static cards by slug or ID
    const staticCard = getCardByIdOrSlug(token);
    if (staticCard) {
      return NextResponse.json({
        id: 'static_' + staticCard.slug,
        token,
        participant: { name: 'PESERTA' },
        result: staticCard,
      });
    }

    return NextResponse.json(
      { error: 'Hasil kuis tidak ditemukan.' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching session result by token:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sharing result.', details: error.message },
      { status: 500 }
    );
  }
}

