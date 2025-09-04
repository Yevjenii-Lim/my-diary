import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { encryptDiaryEntry, decryptDiaryEntry, generateUserEncryptionSecret } from './encryption';
import { getUserEncryptionSecret } from './encryption-keys';
import { DiaryEntry, EncryptedDiaryEntry } from '@/types/database';

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

// Table names
const ENTRIES_TABLE = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries-encrypted';

// ===== ENCRYPTED ENTRIES OPERATIONS =====

export const createEncryptedDiaryEntry = async (
  userId: string,
  topicId: string,
  title: string,
  content: string,
  userEncryptionSecret: string
): Promise<DiaryEntry> => {
  try {
    // Create entry ID using userId, topicId, and title for multiple entries per topic
    const entryId = `${userId}-${topicId}-${title}`;
    const wordCount = content.trim().split(/\s+/).length;
    
    console.log(`🔐 Creating encrypted entry: ${entryId}`);
    console.log(`📝 Content preview: "${title}" - ${content.substring(0, 50)}...`);
    
    // Encrypt the entry data
    const encryptedData = encryptDiaryEntry(content, title, userId, userEncryptionSecret);
    
    // Create the encrypted entry item
    const encryptedEntry: EncryptedDiaryEntry = {
      id: entryId,
      userId,
      entryId: entryId, // Store the full userId-topicId-title for unique identification
      topicId,
      encryptedTitle: encryptedData.encryptedTitle,
      encryptedContent: encryptedData.encryptedContent,
      wordCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: ENTRIES_TABLE,
      Item: encryptedEntry,
    }));
    
    console.log(`✅ Encrypted entry stored successfully: ${entryId}`);
    
    // Return the decrypted entry for the response
    return {
      id: entryId,
      userId,
      entryId,
      topicId,
      title,
      content,
      wordCount,
      createdAt: encryptedEntry.createdAt,
      updatedAt: encryptedEntry.updatedAt,
    };
    
  } catch (error) {
    console.error('❌ Error creating encrypted diary entry:', error);
    throw new Error('Failed to create encrypted diary entry');
  }
};

export const getEncryptedDiaryEntry = async (
  entryId: string,
  userId: string
): Promise<DiaryEntry | null> => {
  try {
    console.log(`🔐 Fetching encrypted entry: ${entryId}`);
    
    // With new format, entryId is userId-topicId-title
    // We need to query by userId and find the entry with matching entryId
    const result = await docClient.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'entryId = :entryId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':entryId': entryId,
      },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.log(`⚠️ Entry not found: ${entryId}`);
      return null;
    }
    
    const encryptedEntry = result.Items[0] as EncryptedDiaryEntry;
    
    // Get user encryption secret
    const userEncryptionSecret = await getUserEncryptionSecret(userId);
    if (!userEncryptionSecret) {
      throw new Error('User encryption secret not found');
    }
    
    // Decrypt the entry
    const decryptedData = decryptDiaryEntry(encryptedEntry.encryptedContent, encryptedEntry.encryptedTitle, userId, userEncryptionSecret);
    
    console.log(`✅ Successfully decrypted entry: ${entryId}`);
    
    return {
      id: entryId,
      userId: encryptedEntry.userId,
      entryId: encryptedEntry.entryId,
      topicId: encryptedEntry.topicId,
      title: decryptedData.title,
      content: decryptedData.content,
      wordCount: encryptedEntry.wordCount,
      createdAt: encryptedEntry.createdAt,
      updatedAt: encryptedEntry.updatedAt,
    };
    
  } catch (error) {
    console.error(`❌ Error fetching/decrypting entry ${entryId}:`, error);
    return null;
  }
};

export const updateEncryptedDiaryEntry = async (
  entryId: string,
  userId: string,
  updates: { title?: string; content?: string }
): Promise<DiaryEntry | null> => {
  try {
    console.log(`🔐 Updating encrypted entry: ${entryId}`);
    
    // Get the current entry to merge updates
    const currentEntry = await getEncryptedDiaryEntry(entryId, userId);
    if (!currentEntry) {
      console.error(`❌ Entry not found for update: ${entryId}`);
      return null;
    }
    
    // Merge updates
    const updatedTitle = updates.title || currentEntry.title;
    const updatedContent = updates.content || currentEntry.content;
    
    // Get user encryption secret
    const userEncryptionSecret = await getUserEncryptionSecret(userId);
    if (!userEncryptionSecret) {
      throw new Error('User encryption secret not found');
    }
    
    // Re-encrypt the updated data
    const encryptedData = encryptDiaryEntry(updatedContent, updatedTitle, userId, userEncryptionSecret);
    
    // Update in DynamoDB - need to find the entry first
    const currentEntryResult = await docClient.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'entryId = :entryId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':entryId': entryId,
      },
    }));
    
    if (!currentEntryResult.Items || currentEntryResult.Items.length === 0) {
      throw new Error('Entry not found for update');
    }
    
    const currentEncryptedEntry = currentEntryResult.Items[0] as EncryptedDiaryEntry;
    
    await docClient.send(new UpdateCommand({
      TableName: ENTRIES_TABLE,
      Key: { userId, entryId: currentEncryptedEntry.entryId },
      UpdateExpression: 'SET encryptedTitle = :encryptedTitle, encryptedContent = :encryptedContent, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':encryptedTitle': encryptedData.encryptedTitle,
        ':encryptedContent': encryptedData.encryptedContent,
        ':updatedAt': new Date().toISOString(),
      },
    }));
    
    console.log(`✅ Encrypted entry updated successfully: ${entryId}`);
    
    return {
      id: entryId,
      userId,
      entryId: entryId,
      topicId: currentEntry.topicId,
      title: updatedTitle,
      content: updatedContent,
      wordCount: updatedContent.trim().split(/\s+/).length,
      createdAt: currentEntry.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`❌ Error updating encrypted entry ${entryId}:`, error);
    return null;
  }
};

export const deleteEncryptedDiaryEntry = async (entryId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting encrypted entry: ${entryId}`);
    console.log(`🗃️ Table: ${ENTRIES_TABLE}`);
    
        // First, verify the entry exists before deleting
    const getResult = await docClient.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'entryId = :entryId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':entryId': entryId,
      },
    }));
    
    if (!getResult.Items || getResult.Items.length === 0) {
      console.error(`❌ Entry not found for deletion: userId=${userId}, entryId=${entryId}`);
      return false;
    }
    
    const entryToDelete = getResult.Items[0];
    console.log(`✅ Entry found, proceeding with deletion`);
    
    // Now delete the entry using the correct key structure
    await docClient.send(new DeleteCommand({
      TableName: ENTRIES_TABLE,
      Key: { userId, entryId: entryToDelete.entryId },
    }));
    
    console.log(`✅ Encrypted entry deleted successfully: ${entryId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error deleting encrypted entry ${entryId}:`, error);
    return false;
  }
};

export const getUserEncryptedEntries = async (
  userId: string,
  userEncryptionSecret: string,
  topicId?: string
): Promise<DiaryEntry[]> => {
  try {
    console.log(`🔐 Fetching encrypted entries for user: ${userId}${topicId ? `, topic: ${topicId}` : ''}`);
    
    const entries: DiaryEntry[] = [];
    
    if (topicId) {
      // Query entries directly by userId and filter by topicId (more reliable than GSI)
      console.log(`🔍 Querying entries directly by userId: ${userId}, topicId: ${topicId}`);
      
      const result = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));
      
      console.log(`✅ Direct query successful, found ${result.Items?.length || 0} total entries for user`);
      
      // Filter entries by topicId in memory (more reliable than GSI)
      if (result.Items) {
        // Debug: Log all entries to see what's actually stored
        console.log(`🔍 Debug: All ${result.Items.length} entries found:`);
        result.Items.forEach((item, index) => {
          console.log(`  Entry ${index + 1}: userId="${item.userId}", topicId="${item.topicId}", entryId="${item.entryId}"`);
        });
        
        const topicEntries = result.Items.filter(item => item.topicId === topicId);
        console.log(`🔍 Filtered to ${topicEntries.length} entries for topic: ${topicId}`);
        console.log(`🔍 Topic ID comparison: searching for "${topicId}" (type: ${typeof topicId})`);
        
        // Process the filtered entries
        for (const encryptedEntry of topicEntries) {
          try {
            const decryptedData = decryptDiaryEntry(encryptedEntry.encryptedContent, encryptedEntry.encryptedTitle, userId, userEncryptionSecret);
            const entry: DiaryEntry = {
              id: encryptedEntry.entryId, // entryId already contains userId-topicId
              userId: encryptedEntry.userId,
              entryId: encryptedEntry.entryId,
              topicId: encryptedEntry.topicId,
              title: decryptedData.title,
              content: decryptedData.content,
              wordCount: encryptedEntry.wordCount,
              createdAt: encryptedEntry.createdAt,
              updatedAt: encryptedEntry.updatedAt,
            };
            entries.push(entry);
          } catch (error) {
            console.error(`❌ Failed to decrypt entry ${encryptedEntry.entryId}:`, error);
            // Skip corrupted entries
          }
        }
        
        // Return early since we've processed the entries
        console.log(`✅ Successfully processed ${entries.length} entries for topic: ${topicId}`);
        return entries;
      }
    } else {
      // Get all entries for the user
      const result = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));
      
      if (result.Items) {
        for (const encryptedEntry of result.Items) {
          try {
            const decryptedData = decryptDiaryEntry(encryptedEntry.encryptedContent, encryptedEntry.encryptedTitle, userId, userEncryptionSecret);
            const entry: DiaryEntry = {
              id: encryptedEntry.entryId, // entryId already contains userId-topicId
              userId: encryptedEntry.userId,
              entryId: encryptedEntry.entryId,
              topicId: encryptedEntry.topicId,
              title: decryptedData.title,
              content: decryptedData.content,
              wordCount: encryptedEntry.wordCount,
              createdAt: encryptedEntry.createdAt,
              updatedAt: encryptedEntry.updatedAt,
            };
            entries.push(entry);
          } catch (error) {
            console.error(`❌ Failed to decrypt entry ${encryptedEntry.entryId}:`, error);
            // Skip corrupted entries
          }
        }
      }
    }
    
    console.log(`✅ Successfully decrypted ${entries.length} entries for user: ${userId}`);
    return entries;
    
  } catch (error) {
    console.error('❌ Error fetching encrypted entries:', error);
    return [];
  }
};

// ===== EFFICIENT COUNTING OPERATIONS =====

export const countUserEntries = async (userId: string, topicId?: string): Promise<number> => {
  try {
    if (topicId) {
      // Count entries for a specific topic using direct query (more reliable than GSI)
      console.log(`🔍 Counting entries for topic: ${topicId}, user: ${userId}`);
      
      const result = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));
      
      if (result.Items) {
        const topicEntries = result.Items.filter(item => item.topicId === topicId);
        console.log(`✅ Counted ${topicEntries.length} entries for topic ${topicId}`);
        return topicEntries.length;
      }
      
      return 0;
    } else {
      // Count all entries for a user
      const result = await docClient.send(new QueryCommand({
        TableName: ENTRIES_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Select: 'COUNT',
      }));
      
      console.log(`✅ Counted ${result.Count || 0} total entries for user ${userId}`);
      return result.Count || 0;
    }
  } catch (error) {
    console.error('❌ Error counting entries:', error);
    return 0;
  }
};

export const countUserEntriesByTopic = async (userId: string): Promise<Map<string, number>> => {
  try {
    const topicCounts = new Map<string, number>();
    
    // Get all topics for the user (you'll need to implement this or import from existing dynamodb.ts)
    // For now, we'll scan all entries and group by topicId
    const result = await docClient.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
    
    if (result.Items) {
      for (const entry of result.Items) {
        const topicId = entry.topicId;
        const currentCount = topicCounts.get(topicId) || 0;
        topicCounts.set(topicId, currentCount + 1);
      }
    }
    
    console.log(`✅ Counted entries for ${topicCounts.size} topics`);
    return topicCounts;
  } catch (error) {
    console.error('❌ Error counting entries by topic:', error);
    return new Map();
  }
};

// ===== USER ENCRYPTION MANAGEMENT =====

export const deleteUserEntries = async (userId: string): Promise<void> => {
  try {
    console.log(`🗑️ Deleting all encrypted entries for user: ${userId}`);
    
    // Get all user entries
    const result = await docClient.send(new QueryCommand({
      TableName: ENTRIES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
    
    if (result.Items && result.Items.length > 0) {
      console.log(`🗑️ Found ${result.Items.length} entries to delete for user: ${userId}`);
      
      // Delete each entry
      for (const entry of result.Items) {
        await docClient.send(new DeleteCommand({
          TableName: ENTRIES_TABLE,
          Key: {
            userId: entry.userId,
            entryId: entry.entryId,
          },
        }));
        console.log(`🗑️ Deleted entry: ${entry.entryId}`);
      }
      
      console.log(`✅ Successfully deleted ${result.Items.length} entries for user: ${userId}`);
    } else {
      console.log(`ℹ️ No entries found for user: ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting entries for user ${userId}:`, error);
    throw new Error('Failed to delete user entries');
  }
};

export const ensureUserEncryption = async (userId: string): Promise<string> => {
  try {
    let userEncryptionSecret = await getUserEncryptionSecret(userId);
    
    if (!userEncryptionSecret) {
      console.log(`🔑 No encryption secret found for user ${userId}, generating new one`);
      userEncryptionSecret = await generateUserEncryptionSecret(userId);
      console.log(`✅ New encryption secret generated for user: ${userId}`);
    }
    
    return userEncryptionSecret;
  } catch (error) {
    console.error(`❌ Error ensuring user encryption for ${userId}:`, error);
    throw new Error('Failed to ensure user encryption');
  }
};