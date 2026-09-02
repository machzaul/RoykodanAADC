import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const secret = process.env.ADMIN_PASSWORD || 'adminpass123';

    if (password === secret) {
      // Return the secret as token for simplicity (used in headers)
      return NextResponse.json({ success: true, token: secret });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error: any) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      { error: 'Failed to process authentication.', details: error.message },
      { status: 500 }
    );
  }
}
