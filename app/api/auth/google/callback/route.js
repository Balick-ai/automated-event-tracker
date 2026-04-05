import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://automated-event-tracker.vercel.app';

  if (error) {
    return NextResponse.redirect(`${appUrl}/#google_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/#google_error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(`${appUrl}/#google_error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();

    const tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };

    // Pass tokens to client via URL hash (never appears in server logs)
    const encoded = Buffer.from(JSON.stringify(tokens)).toString('base64');
    return NextResponse.redirect(`${appUrl}/#google_tokens=${encoded}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/#google_error=server_error`);
  }
}
