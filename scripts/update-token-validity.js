const { CognitoIdentityProviderClient, UpdateUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function updateTokenValidity() {
  try {
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    console.log('🔧 Updating Cognito Token Validity...\n');

    if (!userPoolId || !clientId) {
      console.error('❌ Missing environment variables:');
      console.log(`   User Pool ID: ${userPoolId ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Client ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
      return;
    }

    console.log(`📋 Current Configuration:`);
    console.log(`   User Pool ID: ${userPoolId}`);
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Update User Pool Client with extended token validity
    const updateCommand = new UpdateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      TokenValidityUnits: {
        AccessToken: 'hours',
        IdToken: 'hours',
        RefreshToken: 'days',
      },
      AccessTokenValidity: 168, // 7 days in hours (7 * 24 = 168)
      IdTokenValidity: 168, // 7 days in hours
      RefreshTokenValidity: 30, // 30 days
      ExplicitAuthFlows: [
        'ALLOW_USER_PASSWORD_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
        'ALLOW_USER_SRP_AUTH'
      ],
      PreventUserExistenceErrors: 'ENABLED',
    });

    console.log('🔄 Updating token validity settings...');
    console.log('   Access Token: 7 days (168 hours)');
    console.log('   ID Token: 7 days (168 hours)');
    console.log('   Refresh Token: 30 days\n');

    const result = await client.send(updateCommand);

    console.log('✅ Successfully updated Cognito User Pool Client!');
    console.log(`   Client Name: ${result.UserPoolClient.ClientName}`);
    console.log(`   Status: ${result.UserPoolClient.Status}`);
    console.log(`   Access Token Validity: ${result.UserPoolClient.AccessTokenValidity} hours`);
    console.log(`   ID Token Validity: ${result.UserPoolClient.IdTokenValidity} hours`);
    console.log(`   Refresh Token Validity: ${result.UserPoolClient.RefreshTokenValidity} days\n`);

    console.log('🎉 Token validity has been extended!');
    console.log('   Users will now stay logged in for 7 days before needing to refresh.');
    console.log('   Refresh tokens will be valid for 30 days.');

  } catch (error) {
    console.error('❌ Error updating Cognito configuration:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The User Pool or Client might not exist. Check your environment variables.');
    } else if (error.name === 'UnauthorizedOperation') {
      console.log('💡 AWS credentials might not have permission to update Cognito resources.');
      console.log('   Make sure your AWS user has cognito-idp:UpdateUserPoolClient permission.');
    } else if (error.name === 'InvalidParameterException') {
      console.log('💡 Invalid parameter provided. Check the token validity values.');
    }
  }
}

updateTokenValidity();
