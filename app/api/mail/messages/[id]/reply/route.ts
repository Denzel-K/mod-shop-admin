import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message, { type IReply } from '@/models/Message';
import Admin from '@/models/Admin';
import { verifyAdmin } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = params;
    const { body } = await req.json();
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 });
    }

    const msg = await Message.findById(id);
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Send email reply back to original sender
    const subject = msg.subject ? `Re: ${msg.subject}` : 'Re: Your message to Mod Shop';

    const originalMetaHtml = `
      <div style=\"margin-top:16px;padding:12px;border:1px solid #2a2a3e;border-radius:8px;background:#0b1b2a;\">
        <div style=\"color:#9fb3c8;font-size:12px;margin-bottom:6px;\">Original message details</div>
        <div style=\"color:#e6f1ff;font-size:14px;\"><strong>From:</strong> ${msg.name} </div>
        ${msg.company ? `<div style=\\\"color:#e6f1ff;font-size:14px;\\\"><strong>Company:</strong> ${msg.company}</div>` : ''}
        ${msg.subject ? `<div style=\\\"color:#e6f1ff;font-size:14px;\\\"><strong>Subject:</strong> ${msg.subject}</div>` : ''}

        <div style=\"white-space:pre-wrap;color:#e6f1ff;margin-top:14px;\">${msg.message}</div>
      </div>
    `;

    const html = `
      <div style=\"font-family:Arial,sans-serif;color:#e6f1ff;background:#0a0a0a;padding:16px;\">
        <div style=\"max-width:680px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e 0%, #16213e 100%);border:1px solid #2a2a3e;border-radius:12px;overflow:hidden;\">
          <div style=\"padding:18px 20px;border-bottom:1px solid #2a2a3e;display:flex;align-items:center;gap:10px;\">
            <div style=\"width:10px;height:10px;border-radius:50%;background:#00d4ff;box-shadow:0 0 10px rgba(0,212,255,.5); margin-top-4px; margin-right: 8px;\"></div>
            <div style=\"color:#00d4ff;font-weight:700;letter-spacing:.5px;\">MOD SHOP SUPPORT</div>
          </div>
          <div style=\"padding:20px;\">
            <div style=\"color:#ccd6f6;margin-bottom:8px;\">Hello ${msg.name},</div>
            <div style=\"white-space:pre-wrap;color:#e6f1ff;background:#0b1220;border:1px solid #22304a;border-radius:10px;padding:14px;\">${body}</div>
            ${originalMetaHtml}
            <div style=\"color:#64748b;font-size:12px;margin-top:16px;\">If you didn't write to us, please ignore this message.</div>
          </div>
        </div>
      </div>
    `;

    const text = `Hello ${msg.name},\n\n${body}\n\n---\nOriginal message details\nFrom: ${msg.name} <${msg.email}>\n${msg.company ? `Company: ${msg.company}\n` : ''}${msg.subject ? `Subject: ${msg.subject}\n` : ''}Sent: ${new Date(msg.createdAt).toLocaleString()}\n\n${msg.message}\n`;

    await sendEmail({
      to: msg.email,
      subject,
      text,
      html,
      fromName: 'Mod Shop Support',
    });

    // Store reply on record (include replying admin identity)
    const admin = await Admin.findById(auth.adminId)
      .select<{ fullname: string; email: string }>('fullname email')
      .lean<{ fullname: string; email: string }>();
    const replyEntry: IReply = {
      body,
      to: msg.email,
      from: process.env.SMTP_FROM || 'noreply@modshop.com',
      createdAt: new Date(),
      repliedById: auth.adminId,
      repliedByName: admin?.fullname || undefined,
      repliedByEmail: admin?.email || auth.email,
    };
    msg.replies.push(replyEntry);
    msg.status = 'replied';
    await msg.save();

    return NextResponse.json({ message: 'Reply sent' });
  } catch (e) {
    console.error('Reply error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
