import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import Admin from '@/models/Admin';

export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    let body: unknown;
    try {
      body = await _req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const roleRaw = (body as { role?: string })?.role;
    const allowed = ['super-admin', 'manager', 'curator'] as const;
    type Role = typeof allowed[number];
    const isRole = (v: string): v is Role => (allowed as readonly string[]).includes(v);
    const roleInput = typeof roleRaw === 'string' ? roleRaw.trim().toLowerCase() : '';
    if (!isRole(roleInput)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updated = await Admin.findByIdAndUpdate(
      id,
      { $set: { role: roleInput } },
      { new: true, runValidators: true }
    ).exec();

    if (!updated) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    return NextResponse.json({ admin: { id: String(updated._id), fullname: updated.fullname, email: updated.email, role: updated.role } });
  } catch (error) {
    console.error('Update admin role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
