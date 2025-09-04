// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const TABLE_NAME = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries-encrypted';

async function addGSIToEncryptedTable() {
  try {
    console.log('🔍 Checking current table structure...');
    
    // First, describe the current table to see what GSIs exist
    const describeCommand = new DescribeTableCommand({
      TableName: TABLE_NAME,
    });
    
    const tableDescription = await client.send(describeCommand);
    console.log(`📋 Table: ${TABLE_NAME}`);
    console.log(`📊 Status: ${tableDescription.Table.TableStatus}`);
    
    // Check if GSI already exists
    const existingGSIs = tableDescription.Table.GlobalSecondaryIndexes || [];
    const topicEntriesIndex = existingGSIs.find(gsi => gsi.IndexName === 'TopicEntriesIndex');
    
    if (topicEntriesIndex) {
      console.log('✅ TopicEntriesIndex GSI already exists!');
      console.log(`   Status: ${topicEntriesIndex.IndexStatus}`);
      console.log('   Key Schema:');
      topicEntriesIndex.KeySchema.forEach((key, index) => {
        console.log(`     ${index + 1}. ${key.AttributeName} (${key.KeyType})`);
      });
      return;
    }
    
    console.log('❌ TopicEntriesIndex GSI is missing');
    console.log('🔧 Adding GSI to table...');
    
    // Add the GSI
    const updateCommand = new UpdateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'topicId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'TopicEntriesIndex',
            KeySchema: [
              { AttributeName: 'topicId', KeyType: 'HASH' },
              { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            },
            // Note: PAY_PER_REQUEST tables don't need ProvisionedThroughput
          }
        }
      ]
    });
    
    console.log('⏳ Creating GSI (this may take a few minutes)...');
    await client.send(updateCommand);
    
    console.log('✅ GSI creation initiated successfully!');
    console.log('⏳ Please wait for the GSI to become ACTIVE before testing');
    console.log('💡 You can check the status with: node scripts/check-table-structure.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.name === 'ResourceInUseException') {
      console.log('💡 This usually means the table is being updated. Please wait and try again.');
    } else if (error.name === 'ValidationException') {
      console.log('💡 This might mean the GSI already exists or there\'s a schema issue.');
    }
  }
}

// Run the script
addGSIToEncryptedTable();
