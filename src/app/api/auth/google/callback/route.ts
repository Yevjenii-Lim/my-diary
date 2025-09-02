import { NextRequest, NextResponse } from 'next/server';
import { getGoogleUserInfo } from '@/lib/google-auth';
import { validateEnvironmentVariables } from '@/lib/env-validation';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    validateEnvironmentVariables();
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=google_auth_failed`);
    }

    if (!code) {
      console.error('❌ No authorization code received from Google');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=no_auth_code`);
    }

    try {
      // Exchange authorization code for tokens directly
      const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('❌ Google token exchange failed in callback:', errorData);
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      
      // Get user info from Google
      const googleUser = await getGoogleUserInfo(tokens.access_token);

      // Store tokens in cookies (secure, httpOnly)
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/google/success`);
      
      // Set secure cookies with tokens
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      if (tokens.refresh_token) {
        response.cookies.set('google_refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });
      }

      response.cookies.set('google_id_token', tokens.id_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      // Store user info in session storage via cookie
      response.cookies.set('google_user_info', JSON.stringify(googleUser), {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;

    } catch (tokenError) {
      console.error('❌ Error exchanging code for tokens:', tokenError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=token_exchange_failed`);
    }

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?error=callback_error`);
  }
}
