// Check DynamoDB table structure
require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function checkTableStructure() {
  console.log('🔍 Checking DynamoDB Table Structure...\n');

  const tableName = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries';

  try {
    console.log(`📋 Table: ${tableName}\n`);

    const describeCommand = new DescribeTableCommand({
      TableName: tableName,
    });

    const result = await client.send(describeCommand);
    const table = result.Table;

    console.log('🏗️ Table Structure:');
    console.log(`   Table Name: ${table.TableName}`);
    console.log(`   Table Status: ${table.TableStatus}`);
    console.log(`   Item Count: ${table.ItemCount || 'N/A'}`);
    console.log(`   Table Size: ${table.TableSizeBytes || 'N/A'} bytes\n`);

    console.log('🔑 Primary Key:');
    const keySchema = table.KeySchema;
    keySchema.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.AttributeName} (${key.KeyType})`);
    });

    console.log('\n📝 Attribute Definitions:');
    const attributeDefinitions = table.AttributeDefinitions;
    attributeDefinitions.forEach((attr, index) => {
      console.log(`   ${index + 1}. ${attr.AttributeName} (${attr.AttributeType})`);
    });

    if (table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0) {
      console.log('\n🌐 Global Secondary Indexes:');
      table.GlobalSecondaryIndexes.forEach((gsi, index) => {
        console.log(`   ${index + 1}. ${gsi.IndexName}:`);
        console.log(`      Status: ${gsi.IndexStatus}`);
        console.log(`      Key Schema:`);
        gsi.KeySchema.forEach((key, keyIndex) => {
          console.log(`         ${keyIndex + 1}. ${key.AttributeName} (${key.KeyType})`);
        });
      });
    }

    if (table.LocalSecondaryIndexes && table.LocalSecondaryIndexes.length > 0) {
      console.log('\n🏠 Local Secondary Indexes:');
      table.LocalSecondaryIndexes.forEach((lsi, index) => {
        console.log(`   ${index + 1}. ${lsi.IndexName}:`);
        console.log(`      Key Schema:`);
        lsi.KeySchema.forEach((key, keyIndex) => {
          console.log(`         ${keyIndex + 1}. ${key.AttributeName} (${key.KeyType})`);
        });
      });
    }

    console.log('\n📊 Analysis:');
    const hashKey = keySchema.find(key => key.KeyType === 'HASH')?.AttributeName;
    const rangeKey = keySchema.find(key => key.KeyType === 'RANGE')?.AttributeName;
    
    if (hashKey && rangeKey) {
      console.log(`   ✅ Composite Primary Key: ${hashKey} (HASH) + ${rangeKey} (RANGE)`);
    } else if (hashKey) {
      console.log(`   ✅ Simple Primary Key: ${hashKey} (HASH)`);
    }

    console.log('\n🎯 Expected vs Actual:');
    console.log('   Expected (from schema): userId (HASH) + entryId (RANGE)');
    console.log(`   Actual: ${hashKey} (HASH)${rangeKey ? ` + ${rangeKey} (RANGE)` : ''}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n💡 The table might not exist or have a different name.');
      console.log('   Check your environment variables:');
      console.log(`   DYNAMODB_ENTRIES_TABLE: ${process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries'}`);
    }
  }
}

// Run the check
checkTableStructure();
