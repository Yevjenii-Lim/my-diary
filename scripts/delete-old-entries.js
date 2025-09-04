const { DynamoDBClient, DeleteCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const ENTRIES_TABLE = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries-encrypted';

async function deleteOldEntries() {
  try {
    console.log('🗑️ Deleting old timestamp-based entries...');
    
    const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
    
    // Query all entries for this user
    const result = await client.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': { S: userId } }
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.log('✅ No entries found for user');
      return;
    }
    
    console.log(`📝 Found ${result.Items.length} entries for user`);
    
    // Delete entries that have the old timestamp format
    for (const item of result.Items) {
      const entryId = item.entryId?.S;
      if (entryId && entryId.includes('-1756947241867') || entryId.includes('-1756947383169')) {
        console.log(`🗑️ Deleting old entry: ${entryId}`);
        
        try {
          await client.send(new DeleteCommand({
            TableName: ENTRIES_TABLE,
            Key: { 
              userId: { S: userId }, 
              entryId: { S: entryId } 
            }
          }));
          console.log(`✅ Deleted: ${entryId}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete ${entryId}:`, deleteError);
        }
      } else {
        console.log(`⏭️  Skipping entry: ${entryId}`);
      }
    }
    
    console.log('✅ Old entries cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error deleting old entries:', error);
  }
}

deleteOldEntries();
