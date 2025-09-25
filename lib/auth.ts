import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export type AuthContext = {
  adminId: string;
  email: string;
};

export async function getAuthTokenFromCookies(): Promise<string | null> {
  // This function is intended for use within route handlers (server context)
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value || null;
    return token;
  } catch {
    return null;
  }
}

export async function verifyAdmin(): Promise<AuthContext | null> {
  const token = await getAuthTokenFromCookies();
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  try {
    interface JwtPayloadExt extends jwt.JwtPayload { adminId: string; email: string }
    const payload = jwt.verify(token, secret) as JwtPayloadExt;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}
