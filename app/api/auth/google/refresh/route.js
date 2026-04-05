import { NextResponse } from 'next/server';

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch { /* empty */ }

  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token provided' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (errData.error === 'invalid_grant') {
        return NextResponse.json({ error: 'invalid_grant', message: 'Please reconnect Google Calendar' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 502 });
    }

    const data = await res.json();

    return NextResponse.json({
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      refresh_token: data.refresh_token || null,
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 500 });
  }
}
