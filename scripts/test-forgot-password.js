const { CognitoIdentityProviderClient, ForgotPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

async function testForgotPassword() {
  try {
    console.log('🧪 Testing Forgot Password functionality...\n');

    console.log('📋 Configuration:');
    console.log(`   Client ID: ${CLIENT_ID}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`   Test Email: test@example.com\n`);

    if (!CLIENT_ID) {
      console.log('❌ CLIENT_ID is missing from environment variables');
      return;
    }

    console.log('📤 Sending forgot password request...');
    
    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: 'test@example.com',
    });

    const result = await client.send(command);
    
    console.log('✅ Forgot password request successful!');
    console.log('📧 Check the email for the reset code');
    console.log('💡 You can now test the forgot password page at: http://localhost:3000/auth/forgot-password');

  } catch (error) {
    console.error('❌ Error testing forgot password:', error.message);
    
    if (error.name === 'UserNotFoundException') {
      console.log('💡 The test user does not exist in Cognito');
      console.log('   Run "node scripts/add-test-user.js" to create the test user');
    } else if (error.name === 'InvalidParameterException') {
      console.log('💡 Check your Client ID and credentials');
    } else if (error.name === 'LimitExceededException') {
      console.log('💡 Too many requests. Wait a few minutes before trying again');
    }
  }
}

testForgotPassword();


