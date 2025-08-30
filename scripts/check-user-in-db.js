const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'diary-users';

async function checkUserInDB(userId) {
  try {
    console.log(`🔍 Checking if user exists in DynamoDB: ${userId}\n`);

    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: {
        id: userId,
      },
    }));

    if (result.Item) {
      console.log('✅ User found in DynamoDB:');
      console.log(`   ID: ${result.Item.id}`);
      console.log(`   Name: ${result.Item.name}`);
      console.log(`   Email: ${result.Item.email}`);
      console.log(`   Created: ${new Date(result.Item.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(result.Item.updatedAt).toLocaleString()}`);
    } else {
      console.log('❌ User not found in DynamoDB');
    }

  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 The users table does not exist yet.');
      console.log('   Run "node scripts/setup-dynamodb.js" to create the tables.');
    }
  }
}

// Check for test user (using Cognito user ID)
const testUserId = 'a468d4b8-7031-700a-fd49-aa978e8654e3';
checkUserInDB(testUserId);
