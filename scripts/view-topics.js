const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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

async function viewTopics() {
  try {
    console.log('📚 Viewing all topics in diary-topics table...\n');

    const response = await docClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics',
    }));

    const topics = response.Items || [];
    console.log(`✅ Found ${topics.length} topics\n`);

    if (topics.length === 0) {
      console.log('📝 No topics found. Run the populate script first:');
      console.log('   node scripts/populate-topics.js\n');
      return;
    }

    // Group topics by user
    const topicsByUser = {};
    topics.forEach(topic => {
      if (!topicsByUser[topic.userId]) {
        topicsByUser[topic.userId] = [];
      }
      topicsByUser[topic.userId].push(topic);
    });

    // Display topics by user
    Object.entries(topicsByUser).forEach(([userId, userTopics]) => {
      console.log(`👤 User: ${userId}`);
      console.log(`   📊 Total topics: ${userTopics.length}`);
      
      // Group by category
      const byCategory = {};
      userTopics.forEach(topic => {
        if (!byCategory[topic.category]) {
          byCategory[topic.category] = [];
        }
        byCategory[topic.category].push(topic);
      });

      Object.entries(byCategory).forEach(([category, categoryTopics]) => {
        console.log(`   📂 ${category} (${categoryTopics.length}):`);
        categoryTopics.forEach(topic => {
          console.log(`      ${topic.icon} ${topic.title} - ${topic.description}`);
        });
      });
      console.log('');
    });

    // Summary statistics
    console.log('📈 Summary:');
    console.log(`   Total topics: ${topics.length}`);
    console.log(`   Total users: ${Object.keys(topicsByUser).length}`);
    
    const categories = [...new Set(topics.map(t => t.category))];
    console.log(`   Categories: ${categories.join(', ')}`);

  } catch (error) {
    console.error('❌ Error viewing topics:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Make sure the diary-topics table exists. Run:');
      console.log('   node scripts/setup-dynamodb.js');
    } else if (error.name === 'UnrecognizedClientException') {
      console.log('💡 AWS credentials might not be configured properly.');
    }
  }
}

viewTopics();


