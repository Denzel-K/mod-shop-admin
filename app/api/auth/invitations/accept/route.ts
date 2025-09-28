import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Invitation from '@/models/Invitation';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Invitation already accepted' }, { status: 410 });
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    // Ensure no existing admin with same email
    const existingAdmin = await Admin.findOne({ email: invitation.email });
    if (existingAdmin) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = new Admin({
      fullname: invitation.fullname,
      email: invitation.email,
      password: hashedPassword,
      role: (invitation as unknown as { role?: string }).role || 'curator',
    });
    await newAdmin.save();

    invitation.acceptedAt = new Date();
    await invitation.save();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    const authToken = jwt.sign({ adminId: newAdmin._id, email: newAdmin.email, role: newAdmin.role }, jwtSecret, { expiresIn: '7d' });

    const response = NextResponse.json({
      message: 'Invitation accepted and account created',
      admin: { id: newAdmin._id, fullname: newAdmin.fullname, email: newAdmin.email, role: newAdmin.role },
    });
    response.cookies.set('auth-token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
