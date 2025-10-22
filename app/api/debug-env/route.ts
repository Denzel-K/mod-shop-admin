import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    mongoUriStart: process.env.MONGODB_URI?.substring(0, 20) + '...',
    hasJwtSecret: !!process.env.JWT_SECRET,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.startsWith('MONGODB') || 
      key.startsWith('JWT') || 
      key.startsWith('NODE_ENV')
    )
  });
}
