import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        fullname: invitation.fullname,
        expiresAt: invitation.expiresAt,
        role: invitation.role,
      }
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
