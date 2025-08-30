const { CognitoIdentityProviderClient, DescribeUserPoolCommand, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function checkCognitoConfig() {
  try {
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    console.log('🔍 Checking Cognito Configuration...\n');

    if (!userPoolId || !clientId) {
      console.error('❌ Missing environment variables:');
      console.log(`   User Pool ID: ${userPoolId ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Client ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
      return;
    }

    console.log(`📋 Environment Variables:`);
    console.log(`   User Pool ID: ${userPoolId}`);
    console.log(`   Client ID: ${clientId}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    // Check User Pool
    console.log('🏊 Checking User Pool...');
    const userPoolResult = await client.send(new DescribeUserPoolCommand({
      UserPoolId: userPoolId,
    }));

    console.log(`✅ User Pool Status: ${userPoolResult.UserPool.Status}`);
    console.log(`   Name: ${userPoolResult.UserPool.Name}`);
    console.log(`   Auto Verified Attributes: ${userPoolResult.UserPool.AutoVerifiedAttributes?.join(', ') || 'None'}`);
    console.log(`   Username Attributes: ${userPoolResult.UserPool.UsernameAttributes?.join(', ') || 'None'}\n`);

    // Check User Pool Client
    console.log('📱 Checking User Pool Client...');
    const clientResult = await client.send(new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    }));

    const clientConfig = clientResult.UserPoolClient;
    console.log(`✅ Client Status: ${clientConfig.Status}`);
    console.log(`   Name: ${clientConfig.ClientName}`);
    console.log(`   Generate Secret: ${clientConfig.GenerateSecret}`);
    console.log(`   Explicit Auth Flows: ${clientConfig.ExplicitAuthFlows?.join(', ') || 'None'}`);
    console.log(`   Allowed OAuth Flows: ${clientConfig.AllowedOAuthFlows?.join(', ') || 'None'}`);
    console.log(`   Allowed OAuth Scopes: ${clientConfig.AllowedOAuthScopes?.join(', ') || 'None'}\n`);

    // Check if USER_PASSWORD_AUTH is enabled
    const hasUserPasswordAuth = clientConfig.ExplicitAuthFlows?.includes('ALLOW_USER_PASSWORD_AUTH');
    console.log(`🔐 Authentication Flow Check:`);
    console.log(`   USER_PASSWORD_AUTH enabled: ${hasUserPasswordAuth ? '✅ Yes' : '❌ No'}`);

    if (!hasUserPasswordAuth) {
      console.log('\n⚠️  ISSUE FOUND: USER_PASSWORD_AUTH is not enabled!');
      console.log('   This is likely causing the 400 Bad Request error.');
      console.log('   The client needs ALLOW_USER_PASSWORD_AUTH in ExplicitAuthFlows.');
    } else {
      console.log('\n✅ Configuration looks correct!');
    }

  } catch (error) {
    console.error('❌ Error checking Cognito configuration:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The User Pool or Client might not exist. Check your environment variables.');
    } else if (error.name === 'UnauthorizedOperation') {
      console.log('💡 AWS credentials might not have permission to describe Cognito resources.');
    }
  }
}

checkCognitoConfig();

