import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';
import { verifyAdmin } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, email } = await request.json();
    if (!id && !email) {
      return NextResponse.json({ error: 'id or email is required' }, { status: 400 });
    }

    const query: Record<string, unknown> = id
      ? { _id: id }
      : { email: String(email).toLowerCase().trim(), acceptedAt: { $exists: false } };
    const invitation = await Invitation.findOne(query);
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
    }

    // Refresh token and expiry
    invitation.token = crypto.randomBytes(32).toString('hex');
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitation.save();

    await sendInvitationEmail(invitation.email, invitation.fullname, invitation.token);

    return NextResponse.json({ message: 'Invitation re-sent', invitation: {
      id: String(invitation._id),
      email: invitation.email,
      fullname: invitation.fullname,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt || null,
      role: (invitation as unknown as { role?: string }).role,
    }});
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
