import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import Invitation from '@/models/Invitation';
import { verifyAdmin } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Require inviter authentication
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullname, email, role } = await request.json();

    // Validate required fields
    if (!fullname || !email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const allowedRoles = ['super-admin', 'manager', 'curator'] as const;
    const selectedRole = (typeof role === 'string' && (allowedRoles as readonly string[]).includes(role))
      ? (role as typeof allowedRoles[number])
      : 'curator';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Upsert invitation (if a pending one exists, refresh token and expiry)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.findOneAndUpdate(
      { email: email.toLowerCase().trim(), acceptedAt: { $exists: false } },
      {
        email: email.toLowerCase().trim(),
        fullname: fullname.trim(),
        token,
        expiresAt,
        invitedBy: auth.adminId,
        role: selectedRole,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendInvitationEmail(invitation.email, invitation.fullname, invitation.token);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Do not delete invitation; allow re-send later
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          fullname: invitation.fullname,
          expiresAt: invitation.expiresAt,
          role: invitation.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Invitation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
