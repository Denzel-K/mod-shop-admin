import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { fullname, email, password } = await request.json();

    // Validate required fields
    if (!fullname || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const newAdmin = new Admin({
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await newAdmin.save();

    return NextResponse.json(
      {
        message: 'Admin registered successfully',
        admin: {
          id: newAdmin._id,
          fullname: newAdmin.fullname,
          email: newAdmin.email,
          createdAt: newAdmin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);

    // Handle mongoose validation errors
    if (error instanceof Error && 'name' in error && error.name === 'ValidationError') {
      const mongooseError = error as Error & { 
        errors: Record<string, { message: string }> 
      };
      const validationErrors = Object.values(mongooseError.errors).map(
        (err: { message: string }) => err.message
      );
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
