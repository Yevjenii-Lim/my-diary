const { DynamoDBClient, GetCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const ENTRIES_TABLE = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries-encrypted';
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'diary-users';

async function debugEncryptionKeys() {
  try {
    console.log('🔍 Debugging Encryption Keys Issue');
    console.log('=====================================');
    
    // The problematic entry IDs from your logs
    const entryId1 = 'hear-break-recovery-1756590641205-1756947241867'; // ❌ Fails to decrypt
    const entryId2 = 'hear-break-recovery-1756590641205-1756947383169'; // ✅ Decrypts successfully
    const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
    
    console.log(`\n📋 Entry Details:`);
    console.log(`Entry 1 (Failing): ${entryId1}`);
    console.log(`Entry 2 (Working): ${entryId2}`);
    console.log(`User ID: ${userId}`);
    
    // Get both entries from DynamoDB
    console.log('\n🔍 Fetching Entry 1 (Failing)...');
    const entry1Result = await client.send(new GetCommand({
      TableName: ENTRIES_TABLE,
      Key: { userId, entryId: entryId1 }
    }));
    
    console.log('\n🔍 Fetching Entry 2 (Working)...');
    const entry2Result = await client.send(new GetCommand({
      TableName: ENTRIES_TABLE,
      Key: { userId, entryId: entryId2 }
    }));
    
    if (!entry1Result.Item) {
      console.log('❌ Entry 1 not found in DynamoDB');
      return;
    }
    
    if (!entry2Result.Item) {
      console.log('❌ Entry 2 not found in DynamoDB');
      return;
    }
    
    const entry1 = entry1Result.Item;
    const entry2 = entry2Result.Item;
    
    console.log('\n📊 Entry 1 (Failing) Structure:');
    console.log('================================');
    console.log(`userId: ${entry1.userId?.S}`);
    console.log(`entryId: ${entry1.entryId?.S}`);
    console.log(`topicId: ${entry1.topicId?.S}`);
    console.log(`encryptedTitle length: ${entry1.encryptedTitle?.S?.length || 'N/A'}`);
    console.log(`encryptedContent length: ${entry1.encryptedContent?.S?.length || 'N/A'}`);
    console.log(`createdAt: ${entry1.createdAt?.S}`);
    console.log(`updatedAt: ${entry1.updatedAt?.S}`);
    
    console.log('\n📊 Entry 2 (Working) Structure:');
    console.log('================================');
    console.log(`userId: ${entry2.userId?.S}`);
    console.log(`entryId: ${entry2.entryId?.S}`);
    console.log(`topicId: ${entry2.topicId?.S}`);
    console.log(`encryptedTitle length: ${entry2.encryptedTitle?.S?.length || 'N/A'}`);
    console.log(`encryptedContent length: ${entry2.encryptedContent?.S?.length || 'N/A'}`);
    console.log(`createdAt: ${entry2.createdAt?.S}`);
    console.log(`updatedAt: ${entry2.updatedAt?.S}`);
    
    // Check if they were created at different times (different encryption keys)
    console.log('\n⏰ Creation Time Analysis:');
    console.log('==========================');
    const time1 = new Date(entry1.createdAt?.S || 0);
    const time2 = new Date(entry2.createdAt?.S || 0);
    const timeDiff = Math.abs(time2 - time1);
    
    console.log(`Entry 1 created: ${time1.toISOString()}`);
    console.log(`Entry 2 created: ${time2.toISOString()}`);
    console.log(`Time difference: ${Math.round(timeDiff / 1000)} seconds`);
    
    // Check user encryption secret
    console.log('\n🔑 Checking User Encryption Secret...');
    const userResult = await client.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    }));
    
    if (userResult.Item) {
      const user = userResult.Item;
      console.log(`User found: ${user.email?.S || 'N/A'}`);
      console.log(`Has encryption secret: ${!!user.encryptionSecret?.S}`);
      console.log(`Encryption secret length: ${user.encryptionSecret?.S?.length || 'N/A'}`);
      console.log(`Encryption secret hash: ${user.encryptionSecretHash?.S || 'N/A'}`);
    } else {
      console.log('❌ User not found in users table');
    }
    
    // Check if there are multiple encryption secrets for this user
    console.log('\n🔍 Checking for Multiple Encryption Secrets...');
    const userEntriesResult = await client.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': { S: userId } }
    }));
    
    if (userEntriesResult.Items) {
      console.log(`\n📝 Total entries for user: ${userEntriesResult.Items.length}`);
      
      // Group entries by creation time to see if there are patterns
      const entriesByHour = {};
      userEntriesResult.Items.forEach(item => {
        const createdAt = item.createdAt?.S;
        if (createdAt) {
          const hour = createdAt.substring(0, 13); // YYYY-MM-DDTHH
          if (!entriesByHour[hour]) entriesByHour[hour] = [];
          entriesByHour[hour].push(item.entryId?.S);
        }
      });
      
      console.log('\n⏰ Entries grouped by hour:');
      Object.keys(entriesByHour).sort().forEach(hour => {
        console.log(`${hour}:00 - ${entriesByHour[hour].length} entries`);
      });
    }
    
    console.log('\n🎯 Analysis Complete!');
    console.log('=====================');
    
    // Provide recommendations
    if (timeDiff > 3600000) { // More than 1 hour
      console.log('\n⚠️  WARNING: Entries created more than 1 hour apart!');
      console.log('This suggests they might have been created with different encryption keys.');
      console.log('Recommendation: Check if user encryption secret was regenerated between entries.');
    }
    
    if (entry1.encryptedTitle?.S?.length !== entry2.encryptedTitle?.S?.length) {
      console.log('\n⚠️  WARNING: Different encrypted title lengths!');
      console.log('This suggests different encryption methods or corrupted data.');
    }
    
    if (entry1.encryptedContent?.S?.length !== entry2.encryptedContent?.S?.length) {
      console.log('\n⚠️  WARNING: Different encrypted content lengths!');
      console.log('This suggests different encryption methods or corrupted data.');
    }
    
  } catch (error) {
    console.error('❌ Error debugging encryption keys:', error);
  }
}

debugEncryptionKeys();
