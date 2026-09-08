import { NextResponse } from 'next/server';
import { ALL_CARDS } from '@/lib/cards';

export async function GET() {
  return NextResponse.json(ALL_CARDS);
}
