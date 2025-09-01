# Google OAuth Setup Guide for Write-it

## Overview
This guide will help you set up Google OAuth authentication for the Write-it app, allowing users to sign in with their Google accounts.

## Prerequisites
- Google Cloud Console access
- Write-it app deployed and accessible
- Environment variables configured

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name: `Write-it App` (or your preferred name)
   - Click "Create"

3. **Select the Project**
   - Make sure your new project is selected

## Step 2: Enable Google+ API

1. **Go to APIs & Services > Library**
   - In the left sidebar, click "APIs & Services" > "Library"

2. **Search and Enable APIs**
   - Search for "Google+ API" and enable it
   - Search for "Google OAuth2 API" and enable it
   - Search for "Google Identity" and enable it

## Step 3: Create OAuth 2.0 Credentials

1. **Go to APIs & Services > Credentials**
   - In the left sidebar, click "APIs & Services" > "Credentials"

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first

3. **Configure OAuth Consent Screen**
   - User Type: External
   - App name: `Write-it`
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the remaining steps

4. **Create OAuth Client ID**
   - Application type: Web application
   - Name: `Write-it Web Client`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback
     ```
   - Click "Create"

5. **Save Credentials**
   - Copy the Client ID and Client Secret
   - You'll need these for environment variables

## Step 4: Configure Environment Variables

1. **Update `.env.local`**
   ```bash
   # Google OAuth
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

2. **Update Production Environment**
   - Add the same variables to your production environment
   - Make sure `NEXTAUTH_URL` is set to your production domain

## Step 5: Update DynamoDB User Table

The user table needs an email index for Google user lookup. If you don't have it:

1. **Go to AWS DynamoDB Console**
   - Navigate to your `diary-users` table

2. **Create Global Secondary Index**
   - Index name: `email-index`
   - Partition key: `email` (String)
   - Sort key: None
   - Projection type: All

## Step 6: Test Google OAuth

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Sign-In Flow**
   - Go to `/auth/signin`
   - Click "Continue with Google"
   - Complete Google authentication
   - Verify redirect to profile completion or main app

## Step 7: Production Deployment

1. **Update Redirect URIs**
   - Go back to Google Cloud Console
   - Update OAuth client with production domain
   - Add: `https://yourdomain.com/api/auth/google/callback`

2. **Environment Variables**
   - Set production environment variables
   - Ensure `NEXTAUTH_URL` points to production domain

3. **Deploy and Test**
   - Deploy your app
   - Test Google OAuth in production

## Security Considerations

### Environment Variables
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Safe for client-side (public)
- ✅ `GOOGLE_CLIENT_SECRET` - Keep secret, server-side only
- ✅ `NEXTAUTH_URL` - Set to your domain

### OAuth Scopes
The app requests minimal scopes:
- `openid` - User identification
- `email` - Email address
- `profile` - Basic profile information

### Token Storage
- Access tokens stored in secure HTTP-only cookies
- Refresh tokens stored securely
- Automatic token refresh every 6 hours

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" Error**
   - Check that redirect URI in Google Console matches exactly
   - Include protocol (http/https) and port if needed

2. **"invalid_client" Error**
   - Verify Client ID and Secret are correct
   - Check environment variables are loaded

3. **"access_denied" Error**
   - User may have cancelled OAuth flow
   - Check OAuth consent screen configuration

4. **Token Exchange Fails**
   - Verify Google APIs are enabled
   - Check server logs for detailed errors

### Debug Steps

1. **Check Browser Console**
   - Look for OAuth redirect errors
   - Verify environment variables are loaded

2. **Check Server Logs**
   - Monitor API endpoint logs
   - Look for token exchange errors

3. **Verify Environment**
   - Confirm all environment variables are set
   - Check production vs development settings

## API Endpoints

The Google OAuth implementation creates these endpoints:

- `GET /api/auth/google/callback` - OAuth callback handler
- `POST /api/auth/google/token` - Token exchange
- `GET /api/users/google` - Check existing Google user
- `POST /api/users/google` - Create new Google user

## User Flow

1. **User clicks "Continue with Google"**
2. **Redirected to Google OAuth**
3. **User authorizes the app**
4. **Google redirects back with auth code**
5. **App exchanges code for tokens**
6. **App checks if user exists**
7. **If new user: Profile completion page**
8. **If existing user: Direct to main app**

## Benefits

✅ **Easy User Onboarding** - No password creation required  
✅ **Trusted Authentication** - Google's secure OAuth system  
✅ **Email Verification** - Automatically verified email addresses  
✅ **Professional Appearance** - Industry-standard authentication  
✅ **Mobile Friendly** - Works seamlessly on all devices  

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify all environment variables are set correctly
4. Ensure Google APIs are enabled in your project
