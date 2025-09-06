const { CognitoIdentityProviderClient, AdminGetUserCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function checkTestUser() {
  try {
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const testEmail = 'test@example.com';
    const testPassword = 'TestPass123!';

    console.log('🔍 Checking Test User Configuration...\n');

    console.log(`📋 Test User Details:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User Pool ID: ${userPoolId}\n`);

    // Check if user exists
    console.log('👤 Checking if test user exists...');
    try {
      const userResult = await client.send(new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: testEmail,
      }));

      const user = userResult.User;
      console.log(`✅ User Status: ${user.UserStatus}`);
      console.log(`   Enabled: ${user.Enabled}`);
      console.log(`   Email Verified: ${user.UserAttributes.find(attr => attr.Name === 'email_verified')?.Value}`);
      console.log(`   Name: ${user.UserAttributes.find(attr => attr.Name === 'name')?.Value}`);
      console.log(`   Email: ${user.UserAttributes.find(attr => attr.Name === 'email')?.Value}\n`);

      if (user.UserStatus === 'CONFIRMED' && user.Enabled) {
        console.log('✅ User is confirmed and enabled!');
      } else {
        console.log('⚠️  User might not be ready for sign-in:');
        console.log(`   - Status: ${user.UserStatus}`);
        console.log(`   - Enabled: ${user.Enabled}`);
      }

    } catch (error) {
      if (error.name === 'UserNotFoundException') {
        console.log('❌ Test user does not exist!');
        console.log('💡 You may need to run the setup-cognito.js script first.');
        return;
      } else {
        throw error;
      }
    }

    // Try to authenticate the user
    console.log('🔐 Testing authentication...');
    try {
      const authResult = await client.send(new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: testEmail,
          PASSWORD: testPassword,
        },
      }));

      console.log('✅ Authentication successful!');
      console.log(`   Challenge: ${authResult.ChallengeName || 'None'}`);
      
      if (authResult.AuthenticationResult) {
        console.log('✅ User can sign in normally');
      } else if (authResult.ChallengeName) {
        console.log(`⚠️  Authentication requires challenge: ${authResult.ChallengeName}`);
      }

    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      if (error.name === 'NotAuthorizedException') {
        console.log('💡 This usually means:');
        console.log('   - Wrong password');
        console.log('   - User is not confirmed');
        console.log('   - User is disabled');
      } else if (error.name === 'UserNotConfirmedException') {
        console.log('💡 User needs to be confirmed first');
      }
    }

  } catch (error) {
    console.error('❌ Error checking test user:', error.message);
  }
}

checkTestUser();




