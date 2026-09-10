import { NextResponse } from 'next/server';
import { getExcelStats, clearAllExcelData } from '@/lib/excel';

export async function GET() {
  try {
    const stats = await getExcelStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Gagal membaca statistik Excel', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const result = await clearAllExcelData();
    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${result.countDeleted} baris data peserta. File Excel telah direset bersih.`,
      countDeleted: result.countDeleted,
    });
  } catch (error: any) {
    console.error('Error saat menghapus data Excel:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data Excel', details: error.message },
      { status: 500 }
    );
  }
}

// POST endpoint as alternative for DELETE
export async function POST() {
  return DELETE();
}

