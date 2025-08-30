const { DynamoDBClient, GetCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || 'diary-users';
const TOPICS_TABLE = process.env.TOPICS_TABLE || 'diary-topics';
const ENTRIES_TABLE = process.env.ENTRIES_TABLE || 'diary-entries';

async function viewUserData(userId = 'user-123') {
  try {
    console.log(`🔍 Fetching all data for user: ${userId}\n`);

    // 1. Get user information
    console.log('👤 USER INFORMATION:');
    console.log('===================');
    try {
      const userResult = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
      }));

      if (userResult.Item) {
        const user = userResult.Item;
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
        console.log(`   Updated: ${new Date(user.updatedAt).toLocaleString()}`);
      } else {
        console.log(`   ❌ User ${userId} not found in users table`);
        console.log(`   💡 This might be a mock user for development`);
      }
    } catch (error) {
      console.log(`   ❌ Error fetching user: ${error.message}`);
    }
    console.log('');

    // 2. Get user's topics
    console.log('📚 USER TOPICS:');
    console.log('===============');
    try {
      const topicsResult = await docClient.send(new QueryCommand({
        TableName: TOPICS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));

      const topics = topicsResult.Items || [];
      if (topics.length === 0) {
        console.log(`   📭 No topics found for user ${userId}`);
        console.log(`   💡 User hasn't added any topics yet`);
      } else {
        console.log(`   📊 Found ${topics.length} topic(s):\n`);
        topics.forEach((topic, index) => {
          console.log(`   ${index + 1}. ${topic.icon} ${topic.title}`);
          console.log(`      Description: ${topic.description}`);
          console.log(`      Category: ${topic.category}`);
          console.log(`      Status: ${topic.isActive ? 'Active' : 'Inactive'}`);
          console.log(`      Created: ${new Date(topic.createdAt).toLocaleDateString()}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ Error fetching topics: ${error.message}`);
    }

    // 3. Get user's entries
    console.log('📝 USER ENTRIES:');
    console.log('================');
    try {
      const entriesResult = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));

      const entries = entriesResult.Items || [];
      if (entries.length === 0) {
        console.log(`   📭 No entries found for user ${userId}`);
        console.log(`   💡 User hasn't written any entries yet`);
      } else {
        console.log(`   📊 Found ${entries.length} entry(ies):\n`);
        entries.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.title}`);
          console.log(`      Topic: ${entry.topicId}`);
          console.log(`      Words: ${entry.wordCount}`);
          console.log(`      Created: ${new Date(entry.createdAt).toLocaleDateString()}`);
          console.log(`      Preview: ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(`   ❌ Error fetching entries: ${error.message}`);
    }

    console.log('✅ User data fetch completed!');

  } catch (error) {
    console.error('❌ Error fetching user data:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 One or more tables do not exist yet.');
      console.log('   Run "node scripts/setup-dynamodb.js" to create the tables.');
    } else if (error.name === 'UnrecognizedClientException') {
      console.log('💡 AWS credentials might not be configured properly.');
      console.log('   Make sure to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
  }
}

// Get userId from command line argument or use default
const userId = process.argv[2] || 'user-123';
viewUserData(userId);

