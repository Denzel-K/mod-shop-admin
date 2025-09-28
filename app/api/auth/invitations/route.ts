import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';
import { verifyAdmin } from '@/lib/auth';

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
        return {
          id: String(inv._id),
          email: inv.email,
          fullname: inv.fullname,
          expiresAt: inv.expiresAt,
          acceptedAt: inv.acceptedAt || null,
          invitedBy,
          role: (inv as unknown as { role?: string }).role,
          createdAt: inv.createdAt,
        };
      }),
    });
  } catch (error) {
    console.error('List invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
