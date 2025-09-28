import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';
import Admin from '@/models/Admin';
import type { Types } from 'mongoose';
import { verifyAdmin } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

// GET /api/auth/invitations - list invitations (default: pending)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeAccepted = searchParams.get('includeAccepted') === 'true';

    const query = includeAccepted ? {} : { acceptedAt: { $exists: false } };
    const invitations = await Invitation.find(query)
      .populate({ path: 'invitedBy', select: 'fullname email' })
      .sort({ createdAt: -1 })
      .limit(200);

    // Build a map of accepted invitation emails -> admin
    const acceptedEmails = invitations
      .filter((i) => !!i.acceptedAt)
      .map((i) => i.email.toLowerCase());
    type Role = 'super-admin' | 'manager' | 'curator';
    type AdminLite = { _id: Types.ObjectId; email: string; role: Role };
    let admins: AdminLite[] = [];
    if (acceptedEmails.length) {
      admins = await Admin.find({ email: { $in: acceptedEmails } })
        .select<{ email: string; role: Role }>('email role')
        .lean<AdminLite[]>();
    }
    const adminByEmail = new Map<string, AdminLite>(admins.map((a) => [a.email.toLowerCase(), a]));

    return NextResponse.json({
      invitations: invitations.map((inv) => {
        type InvitedByPop = { _id: unknown; fullname: string; email: string } | null | undefined;
        const rawInvitedBy = (inv as unknown as { invitedBy?: InvitedByPop }).invitedBy;
        const invitedBy = rawInvitedBy
          ? {
              id: String((rawInvitedBy as { _id: unknown })._id),
              fullname: (rawInvitedBy as { fullname: string }).fullname,
              email: (rawInvitedBy as { email: string }).email,
            }
          : null;
        const admin = inv.acceptedAt ? adminByEmail.get(String(inv.email).toLowerCase()) : undefined;
        const adminId = admin ? String(admin._id) : undefined;
        const adminRole = admin ? admin.role : undefined;
        return {
          id: String(inv._id),
          email: inv.email,
          fullname: inv.fullname,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt || null,
          invitedBy,
          role: adminRole ?? inv.role,
          adminId,
          adminRole,
          createdAt: inv.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('List invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/auth/invitations - create a new invitation with role
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as {
      email?: string;
      fullname?: string;
      role?: 'super-admin' | 'manager' | 'curator';
    } | null;
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const email = (body.email || '').trim().toLowerCase();
    const fullname = (body.fullname || '').trim();
    const allowedRoles = ['super-admin', 'manager', 'curator'] as const;
    type Role = typeof allowedRoles[number];
    const roleInput = typeof body.role === 'string' ? body.role.trim().toLowerCase() : 'curator';
    const isRole = (v: string): v is Role => (allowedRoles as readonly string[]).includes(v);
    const role: Role = isRole(roleInput) ? roleInput : 'curator';

    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!fullname) return NextResponse.json({ error: 'Fullname is required' }, { status: 400 });
    if (!['super-admin', 'manager', 'curator'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = randomBytes(24).toString('hex');

    const existing = await Invitation.findOne({ email, acceptedAt: { $exists: false } });
    if (existing) {
      existing.fullname = fullname;
      existing.role = role;
      existing.expiresAt = expiresAt;
      existing.token = token;
      (existing as unknown as { invitedBy?: unknown }).invitedBy = auth.adminId as unknown;
      await existing.save();
      // Send invitation email (refresh token/expiry)
      try {
        await sendInvitationEmail(existing.email, existing.fullname, existing.token);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send invitation email. Please try again later.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          invitation: {
            id: String(existing._id),
            email: existing.email,
            fullname: existing.fullname,
            expiresAt: existing.expiresAt,
            acceptedAt: existing.acceptedAt || null,
            invitedBy: existing.invitedBy ? { id: String(existing.invitedBy) } : null,
            role: existing.role,
            createdAt: existing.createdAt,
          },
        }
      );
    }

    const created = await Invitation.create({
      email,
      fullname,
      role,
      expiresAt,
      token,
      invitedBy: auth.adminId,
    });

    // Send invitation email
    try {
      await sendInvitationEmail(created.email, created.fullname, created.token);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Keep the invitation so user can resend later
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        invitation: {
          id: String(created._id),
          email: created.email,
          fullname: created.fullname,
          expiresAt: created.expiresAt,
          acceptedAt: created.acceptedAt || null,
          invitedBy: created.invitedBy ? { id: String(created.invitedBy) } : null,
          role: created.role,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
