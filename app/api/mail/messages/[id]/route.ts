import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { verifyAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({})) as { status?: 'new'|'replied'|'closed' };

    if (!body.status || !['new','replied','closed'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await Message.findByIdAndUpdate(id, { status: body.status }, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ message: updated }, { status: 200 });
  } catch (e) {
    console.error('Update message status error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
