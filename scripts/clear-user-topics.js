const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

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

async function clearUserTopics(userId) {
  try {
    console.log(`🗑️  Clearing all topics for user: ${userId}\n`);

    // First, get all topics for this user
    const response = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));

    const topics = response.Items || [];
    console.log(`📋 Found ${topics.length} topics to delete\n`);

    if (topics.length === 0) {
      console.log('✅ User already has no topics');
      return;
    }

    // Delete each topic
    let deletedCount = 0;
    for (const topic of topics) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics',
          Key: {
            userId: topic.userId,
            topicId: topic.topicId,
          },
        }));
        console.log(`✅ Deleted: ${topic.title}`);
        deletedCount++;
      } catch (error) {
        console.log(`❌ Failed to delete ${topic.title}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully deleted ${deletedCount} topics for user ${userId}`);
    console.log('📝 User now has an empty topics list and can add topics manually via the UI');

  } catch (error) {
    console.error('❌ Error clearing user topics:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Make sure the diary-topics table exists.');
    } else if (error.name === 'UnrecognizedClientException') {
      console.log('💡 AWS credentials might not be configured properly.');
    }
  }
}

// Check if a user ID was provided
const userId = process.argv[2];

if (!userId) {
  console.log('❌ Please provide a user ID');
  console.log('Usage: node scripts/clear-user-topics.js <userId>');
  console.log('Example: node scripts/clear-user-topics.js user-123');
  console.log('\n⚠️  WARNING: This will delete ALL topics for the specified user!');
  process.exit(1);
}

console.log('⚠️  WARNING: This will delete ALL topics for the specified user!');
console.log('   The user will need to manually add topics via the UI afterward.\n');

clearUserTopics(userId);


