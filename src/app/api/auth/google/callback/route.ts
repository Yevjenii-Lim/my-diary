import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
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

    console.log('🔄 Google OAuth callback received, exchanging code for tokens...');

    try {
      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await getGoogleUserInfo(tokens.access_token);
      
      console.log('✅ Google user authenticated:', googleUser.email);

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
