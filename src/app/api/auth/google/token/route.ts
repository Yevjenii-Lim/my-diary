import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    console.log('🔄 Exchanging Google authorization code for tokens...');
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    console.log('📋 Token exchange parameters:');
    console.log('   Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
    console.log('   Client Secret:', process.env.GOOGLE_CLIENT_SECRET?.substring(0, 20) + '...');
    console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('   Redirect URI:', redirectUri);
    console.log('   Code length:', code.length);
    console.log('   Code preview:', code.substring(0, 20) + '...');

    // Build the request body
    const requestBody = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    console.log('📤 Sending request to Google:');
    console.log('   URL: https://oauth2.googleapis.com/token');
    console.log('   Method: POST');
    console.log('   Body params:', Object.fromEntries(requestBody.entries()));

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Google token exchange failed:');
      console.error('   Status:', tokenResponse.status);
      console.error('   Status Text:', tokenResponse.statusText);
      console.error('   Response:', errorData);
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    
    console.log('✅ Google tokens received successfully');

    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
    });

  } catch (error) {
    console.error('❌ Error in Google token exchange:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
