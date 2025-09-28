import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Admin, { IAdmin } from '@/models/Admin';
import { getStorageService } from '@/lib/enhanced-storage';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Basic validations
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Avatar exceeds 5MB limit' }, { status: 413 });
    }

    const contentType = file.type || 'application/octet-stream';
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, or WEBP.' }, { status: 400 });
    }

    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
    const destination = `avatars/${auth.adminId}/${Date.now()}.${ext}`;

    const storage = getStorageService();

    // Load current admin to check previous avatar
    const admin = await Admin.findById(auth.adminId);
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const upload = await storage.upload({
      buffer,
      destination,
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      makePublic: true,
    });

    // Delete old avatar if exists
    if ((admin as IAdmin).avatarPath) {
      try {
        await storage.delete((admin as IAdmin).avatarPath as string);
      } catch {}
    }

    admin.set({ avatarUrl: upload.url, avatarPath: upload.path });
    await admin.save();

    return NextResponse.json({
      message: 'Avatar updated',
      avatarUrl: upload.url,
      avatarPath: upload.path,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = await Admin.findById(auth.adminId);
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const storage = getStorageService();
    const path = (admin as IAdmin).avatarPath as string | undefined;
    if (path) {
      try { await storage.delete(path); } catch {}
    }

    admin.set({ avatarUrl: undefined, avatarPath: undefined });
    await admin.save();

    return NextResponse.json({ message: 'Avatar removed' });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
