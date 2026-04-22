import { type NextRequest, NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { email: string; password: string };

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(err, { status: res.status });
    }

    const data = await res.json() as { token: string; user: unknown };
    await setAuthCookie(data.token);

    return NextResponse.json({ user: data.user });
  } catch {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
