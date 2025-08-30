const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function addTestUser() {
  try {
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const testEmail = 'test@example.com';
    const testPassword = 'TestPass123!';

    console.log('👤 Adding test user to Cognito...\n');

    console.log(`📋 Test User Details:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User Pool ID: ${userPoolId}\n`);

    // Create the user
    console.log('📝 Creating test user...');
    const createResult = await client.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: testEmail,
      UserAttributes: [
        {
          Name: 'email',
          Value: testEmail,
        },
        {
          Name: 'name',
          Value: 'Test User',
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
      MessageAction: 'SUPPRESS',
    }));

    console.log('✅ User created successfully!');
    console.log(`   User Status: ${createResult.User.UserStatus}`);

    // Set password and make user permanent
    console.log('🔐 Setting password...');
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: testEmail,
      Password: testPassword,
      Permanent: true,
    }));

    console.log('✅ Password set successfully!');
    console.log('✅ User is now ready for sign-in!\n');

    console.log('🎉 Test user setup completed!');
    console.log('   You can now sign in with:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

  } catch (error) {
    console.error('❌ Error adding test user:', error.message);
    
    if (error.name === 'UsernameExistsException') {
      console.log('💡 User already exists. This is fine!');
    } else if (error.name === 'InvalidParameterException') {
      console.log('💡 Check your User Pool ID and credentials.');
    }
  }
}

addTestUser();
