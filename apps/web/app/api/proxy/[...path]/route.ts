import { type NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000';

async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<NextResponse> {
  const { path } = await context.params;
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const targetUrl = `${API_BASE}/${path.join('/')}${url.search}`;

  const body = request.method !== 'GET' && request.method !== 'DELETE'
    ? await request.text()
    : undefined;

  const res = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const data = await res.json().catch(() => ({ message: res.statusText }));
  return NextResponse.json(data, { status: res.status });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
