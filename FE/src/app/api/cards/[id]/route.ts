import { NextResponse } from 'next/server';
import { getCardByIdOrSlug } from '@/lib/cards';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const card = getCardByIdOrSlug(id);

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json(card);
}
