import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCardsConfig } from '@/lib/cards-config';
import { getCardCountsFromExcel } from '@/lib/excel';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const config = getCardsConfig();
    const counts = await getCardCountsFromExcel(forceRefresh);

    return NextResponse.json({
      ...config,
      counts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal memuat konfigurasi kartu', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const configPath = path.resolve(process.cwd(), 'data', 'cards-config.json');
    const dataDir = path.dirname(configPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Strip counts if present so it doesn't pollute cards-config.json
    const { counts, ...configToSave } = body;

    // Format and write back to file
    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi URL & kuota kartu berhasil disimpan.',
      config: configToSave,
    });
  } catch (error: any) {
    console.error('Error saving cards config:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan konfigurasi kartu', details: error.message },
      { status: 500 }
    );
  }
}

