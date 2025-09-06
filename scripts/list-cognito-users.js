const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

async function listCognitoUsers() {
  try {
    console.log('👥 Listing all users in Cognito User Pool...\n');

    console.log(`📋 User Pool Details:`);
    console.log(`   User Pool ID: ${USER_POOL_ID}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    if (!USER_POOL_ID) {
      console.log('❌ User Pool ID is missing from environment variables');
      return;
    }

    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
    });

    const result = await client.send(command);
    
    if (result.Users && result.Users.length > 0) {
      console.log(`✅ Found ${result.Users.length} user(s) in the User Pool:\n`);
      
      result.Users.forEach((user, index) => {
        const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value || 'No email';
        const name = user.Attributes?.find(attr => attr.Name === 'name')?.Value || 'No name';
        const emailVerified = user.Attributes?.find(attr => attr.Name === 'email_verified')?.Value === 'true';
        
        console.log(`${index + 1}. User Details:`);
        console.log(`   Username: ${user.Username}`);
        console.log(`   Email: ${email}`);
        console.log(`   Name: ${name}`);
        console.log(`   Status: ${user.UserStatus}`);
        console.log(`   Email Verified: ${emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Enabled: ${user.Enabled ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.UserCreateDate}`);
        console.log(`   Modified: ${user.UserLastModifiedDate}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in the User Pool');
      console.log('💡 You may need to create users or check if you\'re looking at the correct User Pool');
    }

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The User Pool does not exist. Check your User Pool ID.');
    } else if (error.name === 'NotAuthorizedException') {
      console.log('💡 You don\'t have permission to list users in this User Pool.');
    } else if (error.name === 'InvalidParameterException') {
      console.log('💡 Invalid User Pool ID or region.');
    }
  }
}

listCognitoUsers();




