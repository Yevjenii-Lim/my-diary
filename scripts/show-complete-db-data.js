// Script to show complete DynamoDB data structure
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function showCompleteDBData() {
  const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';

  console.log('🗄️ COMPLETE DYNAMODB DATA STRUCTURE');
  console.log('===================================\n');

  try {
    // 1. User Topics
    console.log('📚 1. USER TOPICS TABLE:');
    console.log('========================');
    const topicsResponse = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TOPICS_TABLE || 'user-topics',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    
    console.log(`Found ${topicsResponse.Items?.length || 0} topics\n`);
    
    if (topicsResponse.Items && topicsResponse.Items.length > 0) {
      topicsResponse.Items.forEach((topic, index) => {
        console.log(`Topic ${index + 1}:`);
        console.log(`  ID: ${topic.topicId}`);
        console.log(`  Title: ${topic.title}`);
        console.log(`  Description: ${topic.description}`);
        console.log(`  Icon: ${topic.icon}`);
        console.log(`  Created: ${topic.createdAt}`);
        console.log(`  Updated: ${topic.updatedAt || 'N/A'}`);
        console.log(`  Raw data:`, JSON.stringify(topic, null, 2));
        console.log('');
      });
    }

    // 2. User Entries
    console.log('📝 2. USER ENTRIES TABLE:');
    console.log('=========================');
    const entriesResponse = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));
    
    console.log(`Found ${entriesResponse.Items?.length || 0} entries\n`);
    
    if (entriesResponse.Items && entriesResponse.Items.length > 0) {
      entriesResponse.Items.forEach((entry, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log(`  ID: ${entry.id}`);
        console.log(`  Title: ${entry.title}`);
        console.log(`  Topic ID: ${entry.topicId}`);
        console.log(`  Content: ${entry.content}`);
        console.log(`  Word Count: ${entry.wordCount}`);
        console.log(`  Created: ${entry.createdAt}`);
        console.log(`  Updated: ${entry.updatedAt}`);
        console.log(`  Raw data:`, JSON.stringify(entry, null, 2));
        console.log('');
      });
    }

    // 3. Show table structure
    console.log('🏗️ 3. TABLE STRUCTURES:');
    console.log('=======================');
    
    console.log('\n📚 User Topics Table Structure:');
    console.log('Primary Key: userId (String)');
    console.log('Sort Key: topicId (String)');
    console.log('Attributes:');
    console.log('  - title (String)');
    console.log('  - description (String)');
    console.log('  - icon (String)');
    console.log('  - createdAt (String - ISO date)');
    console.log('  - updatedAt (String - ISO date)');
    
    console.log('\n📝 User Entries Table Structure:');
    console.log('Primary Key: id (String)');
    console.log('Sort Key: userId (String)');
    console.log('Attributes:');
    console.log('  - title (String)');
    console.log('  - content (String)');
    console.log('  - topicId (String)');
    console.log('  - wordCount (Number)');
    console.log('  - createdAt (String - ISO date)');
    console.log('  - updatedAt (String - ISO date)');

    // 4. Data Analysis
    console.log('\n📊 4. DATA ANALYSIS:');
    console.log('===================');
    
    const entries = entriesResponse.Items || [];
    const topics = topicsResponse.Items || [];
    
    console.log(`Total users in system: 1 (${userId})`);
    console.log(`Total topics for user: ${topics.length}`);
    console.log(`Total entries for user: ${entries.length}`);
    
    if (entries.length > 0) {
      const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
      const avgWords = Math.round(totalWords / entries.length);
      console.log(`Total words written: ${totalWords}`);
      console.log(`Average words per entry: ${avgWords}`);
      
      // Topic distribution
      const topicStats = {};
      entries.forEach(entry => {
        topicStats[entry.topicId] = (topicStats[entry.topicId] || 0) + 1;
      });
      
      console.log('\nEntries per topic:');
      Object.entries(topicStats).forEach(([topicId, count]) => {
        const topic = topics.find(t => t.topicId === topicId);
        console.log(`  ${topic?.title || topicId}: ${count} entries`);
      });
    }

    console.log('\n✅ Complete DynamoDB data structure analysis complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
showCompleteDBData();
