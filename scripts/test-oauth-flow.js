// Test OAuth Flow Configuration
console.log('🔍 Testing OAuth Flow Configuration...\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Test environment variables
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  console.log('📋 Client ID:', clientId ? '✅ Set' : '❌ Missing');
  
  // Test OAuth URL generation
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/api/auth/google/callback`;
  console.log('🌐 Current Origin:', currentOrigin);
  console.log('🔄 Redirect URI:', redirectUri);
  
  // Test OAuth parameters
  const params = new URLSearchParams({
    client_id: clientId || 'test',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('🔗 OAuth URL:', oauthUrl.substring(0, 100) + '...');
  
  console.log('\n📝 To test OAuth:');
  console.log('1. Copy the OAuth URL above');
  console.log('2. Paste it in a new tab');
  console.log('3. Complete the Google sign-in');
  console.log('4. Check if you get redirected back');
  
} else {
  console.log('❌ This script must run in a browser environment');
}
