import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/enhanced-storage';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const storage = getStorageService();
    const health = await storage.healthCheck();
    return NextResponse.json({ health }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
