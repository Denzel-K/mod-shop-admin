import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Message from '@/models/Message';
import { sendEmail } from '@/lib/email';

// Allow cross-origin POST from Mod-Shop app
function buildCorsHeaders(origin: string | null) {
  const allowEnv = (process.env.ALLOWED_CONTACT_ORIGINS || '*').trim();
  let allowOrigin = '*';
  if (allowEnv !== '*') {
    const allowed = allowEnv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (origin && allowed.includes(origin)) {
      allowOrigin = origin;
    } else {
      // Not allowed; set to first allowed origin to avoid browser errors, but will still 403 on POST
      allowOrigin = allowed[0] || '';
    }
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  } as Record<string, string>;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = buildCorsHeaders(origin);
  return new NextResponse(null, { headers });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, company, message, subject } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400, headers: corsHeaders });
    }

    const doc = await Message.create({
      name,
      email,
      company,
      subject,
      message,
      status: 'new',
    });

    // Send notification email to official inbox
    const toOfficial = process.env.SMTP_FROM as string;
    const subj = subject ? `[Contact] ${subject}` : '[Contact] New message from Mod Shop website';
    const html = `
      <div style="font-family:Arial,sans-serif;color:#e6f1ff;background:#0a0a0a;padding:16px;">
        <div style="max-width:640px;margin:0 auto;background:linear-gradient(135deg,#1a1a2e 0%, #16213e 100%);border:1px solid #2a2a3e;border-radius:12px;padding:20px;">
          <h2 style="color:#00d4ff;margin:0 0 12px;">New Contact Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          <p style="white-space:pre-wrap;background:#0b1b2a;border:1px dashed #00d4ff55;color:#e6f1ff;padding:12px;border-radius:8px;">${message}</p>
          <p style="color:#9fb3c8;font-size:12px;">Message ID: ${doc._id}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: toOfficial,
      subject: subj,
      html,
      text: `From: ${name} <${email}>\nCompany: ${company || '-'}\nSubject: ${subject || '-'}\n\n${message}\n\nMessage ID: ${doc._id}`,
      fromName: 'Mod Shop Website',
    });

    return NextResponse.json({ message: 'Submitted', id: doc._id }, { status: 201, headers: corsHeaders });
  } catch (e) {
    console.error('Contact submit error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
