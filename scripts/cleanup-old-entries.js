const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.NODE_ENV === 'production' ? {} : {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(client);

const ENTRIES_TABLE = process.env.ENTRIES_TABLE || 'diary-entries';

async function cleanupOldEntries() {
  try {
    console.log('🧹 Starting cleanup of old entries...');
    
    // Scan all entries
    const scanResult = await docClient.send(new ScanCommand({
      TableName: ENTRIES_TABLE,
    }));
    
    const entries = scanResult.Items || [];
    console.log(`📊 Found ${entries.length} total entries in database`);
    
    if (entries.length === 0) {
      console.log('✅ No entries to clean up');
      return;
    }
    
    // Delete all entries
    let deletedCount = 0;
    for (const entry of entries) {
      try {
        await docClient.send(new DeleteCommand({
          TableName: ENTRIES_TABLE,
          Key: {
            userId: entry.userId,
            entryId: entry.entryId,
          },
        }));
        deletedCount++;
        console.log(`🗑️ Deleted entry: ${entry.id || entry.entryId}`);
      } catch (error) {
        console.error(`❌ Failed to delete entry ${entry.id || entry.entryId}:`, error.message);
      }
    }
    
    console.log(`✅ Cleanup complete! Deleted ${deletedCount} out of ${entries.length} entries`);
    
    // Verify cleanup
    const verifyResult = await docClient.send(new ScanCommand({
      TableName: ENTRIES_TABLE,
    }));
    
    const remainingEntries = verifyResult.Items || [];
    console.log(`🔍 Verification: ${remainingEntries.length} entries remaining in database`);
    
    if (remainingEntries.length === 0) {
      console.log('🎉 Database is now clean and ready for new encrypted entries!');
    } else {
      console.log('⚠️ Some entries could not be deleted');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldEntries();
}

module.exports = { cleanupOldEntries };

