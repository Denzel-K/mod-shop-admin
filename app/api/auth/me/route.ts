import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import Admin from '@/models/Admin';

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    type Role = 'super-admin' | 'manager' | 'curator';
    const admin = await Admin.findById(auth.adminId)
      .select<{ fullname: string; email: string; role: Role }>('fullname email role')
      .lean<{ fullname: string; email: string; role: Role }>();
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    return NextResponse.json({ admin: { id: String(auth.adminId), fullname: admin.fullname, email: admin.email, role: admin.role } });
  } catch (e) {
    console.error('Auth me error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
