import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await Admin.findById(auth.adminId);
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        avatarUrl: admin.avatarUrl ?? null,
        avatarPath: admin.avatarPath ?? null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fullname, email } = await request.json();

    const update: Record<string, string> = {};
    if (fullname && typeof fullname === 'string') update.fullname = fullname.trim();
    if (email && typeof email === 'string') update.email = email.toLowerCase().trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    // If email change, ensure uniqueness
    if (update.email) {
      const exists = await Admin.findOne({ _id: { $ne: auth.adminId }, email: update.email });
      if (exists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const admin = await Admin.findByIdAndUpdate(auth.adminId, update, { new: true });
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      message: 'Profile updated',
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        avatarUrl: admin.avatarUrl ?? null,
        avatarPath: admin.avatarPath ?? null,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
