const { OAuth2Client } = require('google-auth-library');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testGoogleOAuth() {
  try {
    console.log('🔍 Testing Google OAuth Configuration...\n');

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log('📋 Environment Variables:');
    console.log(`   Client ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Client Secret: ${clientSecret ? '✅ Set' : '❌ Missing'}\n`);

    if (!clientId || !clientSecret) {
      console.error('❌ Missing required environment variables');
      return;
    }

    console.log('🔧 Testing OAuth Client...');
    
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      'http://localhost:3000/api/auth/google/callback'
    );

    console.log('✅ OAuth client created successfully');
    console.log(`   Redirect URI: http://localhost:3000/api/auth/google/callback`);
    console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
    console.log(`   Client Secret: ${clientSecret.substring(0, 20)}...\n`);

    console.log('📝 Next Steps:');
    console.log('1. Make sure this redirect URI is added to Google Cloud Console:');
    console.log('   http://localhost:3000/api/auth/google/callback');
    console.log('2. Verify the OAuth consent screen is configured');
    console.log('3. Ensure required APIs are enabled (Google+ API, OAuth2 API)');

  } catch (error) {
    console.error('❌ Error testing Google OAuth:', error.message);
  }
}

testGoogleOAuth();
