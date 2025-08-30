const { CognitoIdentityProviderClient, AdminDeleteUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'diary-users';
const TOPICS_TABLE = process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics';
const ENTRIES_TABLE = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries';

async function testDeleteUser() {
  try {
    console.log('🧪 Testing Delete User functionality...\n');

    console.log('📋 Configuration:');
    console.log(`   User Pool ID: ${USER_POOL_ID}`);
    console.log(`   Users Table: ${USERS_TABLE}`);
    console.log(`   Topics Table: ${TOPICS_TABLE}`);
    console.log(`   Entries Table: ${ENTRIES_TABLE}`);
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}\n`);

    if (!USER_POOL_ID) {
      console.log('❌ User Pool ID is missing from environment variables');
      return;
    }

    // Test user ID (you can change this to test with a different user)
    const testUserId = 'test@example.com';

    console.log(`🗑️ Testing deletion for user: ${testUserId}\n`);

    // Step 1: Check if user exists in DynamoDB
    console.log('📊 Step 1: Checking user data in DynamoDB...');
    
    try {
      const userResult = await docClient.send(new QueryCommand({
        TableName: USERS_TABLE,
        KeyConditionExpression: 'id = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId,
        },
      }));

      if (userResult.Items && userResult.Items.length > 0) {
        console.log(`✅ User found in DynamoDB: ${userResult.Items[0].name}`);
      } else {
        console.log('❌ User not found in DynamoDB');
      }
    } catch (error) {
      console.log('❌ Error checking user in DynamoDB:', error.message);
    }

    // Step 2: Check user topics
    console.log('\n📚 Step 2: Checking user topics...');
    
    try {
      const topicsResult = await docClient.send(new QueryCommand({
        TableName: TOPICS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId,
        },
      }));

      if (topicsResult.Items && topicsResult.Items.length > 0) {
        console.log(`✅ Found ${topicsResult.Items.length} topics for user`);
        topicsResult.Items.forEach(topic => {
          console.log(`   - ${topic.title}`);
        });
      } else {
        console.log('✅ No topics found for user');
      }
    } catch (error) {
      console.log('❌ Error checking user topics:', error.message);
    }

    // Step 3: Check user entries
    console.log('\n📝 Step 3: Checking user entries...');
    
    try {
      const entriesResult = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': testUserId,
        },
      }));

      if (entriesResult.Items && entriesResult.Items.length > 0) {
        console.log(`✅ Found ${entriesResult.Items.length} entries for user`);
      } else {
        console.log('✅ No entries found for user');
      }
    } catch (error) {
      console.log('❌ Error checking user entries:', error.message);
    }

    // Step 4: Test Cognito deletion (commented out for safety)
    console.log('\n🔐 Step 4: Testing Cognito deletion...');
    console.log('⚠️  Cognito deletion is commented out for safety');
    console.log('💡 To actually delete the user, uncomment the code below');
    
    /*
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: testUserId,
      });

      await cognitoClient.send(command);
      console.log('✅ User deleted from Cognito successfully');
    } catch (error) {
      console.log('❌ Error deleting user from Cognito:', error.message);
    }
    */

    console.log('\n🎯 Test completed!');
    console.log('💡 To actually delete a user, use the settings page in the app');

  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
}

testDeleteUser();

