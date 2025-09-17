import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email (include password for verification)
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
      },
      jwtSecret,
      {
        expiresIn: '7d', // Token expires in 7 days
      }
    );

    // Create response with token in httpOnly cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        admin: {
          id: admin._id,
          fullname: admin.fullname,
          email: admin.email,
        },
      },
      { status: 200 }
    );

    // Set httpOnly cookie with JWT token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
