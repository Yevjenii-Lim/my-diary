// Debug script for entry deletion issue
require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function debugEntryDelete() {
  console.log('🔍 Debugging Entry Deletion Issue...\n');

  const entryId = '34d864b8-40c1-709c-5019-07bba93a5ec5-creative-writing-1756423622315-1756587193539';
  const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
  const tableName = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries';

  try {
    console.log('📋 Entry Details:');
    console.log(`   Entry ID: ${entryId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Table: ${tableName}\n`);

    // First, let's check if the entry exists
    console.log('🔍 Checking if entry exists...');
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        userId: userId,
        entryId: entryId,
      },
    });

    try {
      const result = await docClient.send(getCommand);
      if (result.Item) {
        console.log('✅ Entry found:');
        console.log('   Title:', result.Item.title);
        console.log('   Created:', result.Item.createdAt);
        console.log('   Updated:', result.Item.updatedAt);
        console.log('   Word Count:', result.Item.wordCount);
        console.log('   Topic ID:', result.Item.topicId);
      } else {
        console.log('❌ Entry not found with the provided key');
      }
    } catch (error) {
      console.log('❌ Error checking entry:', error.message);
    }

    // Let's also scan for entries with similar IDs to understand the structure
    console.log('\n🔍 Scanning for similar entries...');
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: 'contains(#id, :partialId)',
      ExpressionAttributeNames: {
        '#id': 'id',
      },
      ExpressionAttributeValues: {
        ':partialId': '34d864b8-40c1-709c-5019-07bba93a5ec5',
      },
      Limit: 5,
    });

    try {
      const scanResult = await docClient.send(scanCommand);
      console.log(`📊 Found ${scanResult.Items?.length || 0} entries with similar ID pattern:`);
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        scanResult.Items.forEach((item, index) => {
          console.log(`   ${index + 1}. ID: ${item.id}`);
          console.log(`      User ID: ${item.userId}`);
          console.log(`      Title: ${item.title}`);
          console.log(`      Topic ID: ${item.topicId}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('❌ Error scanning entries:', error.message);
    }

    // Now let's try the actual delete operation
    console.log('🗑️ Attempting to delete entry...');
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: {
        userId: userId,
        entryId: entryId,
      },
    });

    try {
      await docClient.send(deleteCommand);
      console.log('✅ Entry deleted successfully!');
    } catch (error) {
      console.log('❌ Delete operation failed:');
      console.log('   Error:', error.message);
      console.log('   Error Code:', error.name);
      
      if (error.name === 'ConditionalCheckFailedException') {
        console.log('   This usually means the item doesn\'t exist or the key is incorrect');
      } else if (error.name === 'ResourceNotFoundException') {
        console.log('   The table doesn\'t exist');
      } else if (error.name === 'AccessDeniedException') {
        console.log('   Permission denied - check AWS credentials');
      }
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

// Run the debug
debugEntryDelete();
