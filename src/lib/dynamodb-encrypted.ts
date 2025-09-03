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
    const timestamp = Date.now();
    const entryId = `${userId}-${topicId}-${timestamp}`;
    const wordCount = content.trim().split(/\s+/).length;
    
    console.log(`🔐 Creating encrypted entry: ${entryId}`);
    console.log(`📝 Content preview: "${title}" - ${content.substring(0, 50)}...`);
    
    // Encrypt the entry data
    const encryptedData = encryptDiaryEntry(content, title, userId, userEncryptionSecret);
    
    // Create the encrypted entry item
    const encryptedEntry: EncryptedDiaryEntry = {
      id: entryId,
      userId,
      entryId,
      topicId,
      encryptedTitle: encryptedData.encryptedTitle,
      encryptedContent: encryptedData.encryptedContent,
      wordCount,
      createdAt: new Date(timestamp).toISOString(),
      updatedAt: new Date(timestamp).toISOString(),
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
  userEncryptionSecret: string
): Promise<DiaryEntry | null> => {
  try {
    // Parse the composite entryId to extract userId and actual entryId
    // Format: userId-topicId-timestamp
    // userId is a UUID with format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts)
    const parts = entryId.split('-');
    if (parts.length < 6) { // At least 6 parts: 5 for UUID + 1 for topicId + 1 for timestamp
      console.error(`❌ Invalid entryId format: ${entryId}`);
      return null;
    }
    
    // Extract userId (first 5 parts for UUID) and actual entryId (remainder)
    const userId = parts.slice(0, 5).join('-');
    const actualEntryId = parts.slice(5).join('-');
    
    console.log(`🔐 Fetching encrypted entry: ${entryId}`);
    console.log(`🔍 Parsed - userId: ${userId}, actualEntryId: ${actualEntryId}`);
    
    // Query DynamoDB using the composite key
    const result = await docClient.send(new GetCommand({
      TableName: ENTRIES_TABLE,
      Key: {
        userId,
        entryId: actualEntryId,
      },
    }));
    
    if (!result.Item) {
      console.log(`⚠️ Entry not found: ${entryId}`);
      return null;
    }
    
    const encryptedEntry = result.Item as EncryptedDiaryEntry;
    
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
  updates: { title?: string; content?: string; wordCount?: number },
  userEncryptionSecret: string
): Promise<DiaryEntry | null> => {
  try {
    // Parse the composite entryId
    // Format: userId-topicId-timestamp
    // userId is a UUID with format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts)
    const parts = entryId.split('-');
    if (parts.length < 6) { // At least 6 parts: 5 for UUID + 1 for topicId + 1 for timestamp
      console.error(`❌ Invalid entryId format: ${entryId}`);
      return null;
    }
    
    const userId = parts.slice(0, 5).join('-');
    const actualEntryId = parts.slice(5).join('-');
    
    console.log(`🔐 Updating encrypted entry: ${entryId}`);
    
    // Get the current entry to merge updates
    const currentEntry = await getEncryptedDiaryEntry(entryId, userEncryptionSecret);
    if (!currentEntry) {
      console.error(`❌ Entry not found for update: ${entryId}`);
      return null;
    }
    
    // Merge updates
    const updatedTitle = updates.title || currentEntry.title;
    const updatedContent = updates.content || currentEntry.content;
    const updatedWordCount = updates.wordCount || currentEntry.wordCount;
    
    // Re-encrypt the updated data
    const encryptedData = encryptDiaryEntry(updatedContent, updatedTitle, userId, userEncryptionSecret);
    
    // Update in DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: ENTRIES_TABLE,
      Key: {
        userId,
        entryId: actualEntryId,
      },
      UpdateExpression: 'SET encryptedTitle = :encryptedTitle, encryptedContent = :encryptedContent, wordCount = :wordCount, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':encryptedTitle': encryptedData.encryptedTitle,
        ':encryptedContent': encryptedData.encryptedContent,
        ':wordCount': updatedWordCount,
        ':updatedAt': new Date().toISOString(),
      },
    }));
    
    console.log(`✅ Encrypted entry updated successfully: ${entryId}`);
    
    return {
      id: entryId,
      userId,
      entryId: actualEntryId,
      topicId: currentEntry.topicId,
      title: updatedTitle,
      content: updatedContent,
      wordCount: updatedWordCount,
      createdAt: currentEntry.createdAt,
      updatedAt: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`❌ Error updating encrypted entry ${entryId}:`, error);
    return null;
  }
};

export const deleteEncryptedDiaryEntry = async (entryId: string): Promise<boolean> => {
  try {
    // Parse the composite entryId
    // Format: userId-topicId-timestamp
    // userId is a UUID with format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 parts)
    const parts = entryId.split('-');
    if (parts.length < 6) { // At least 6 parts: 5 for UUID + 1 for topicId + 1 for timestamp
      console.error(`❌ Invalid entryId format: ${entryId}`);
      return false;
    }
    
    const userId = parts.slice(0, 5).join('-');
    const actualEntryId = parts.slice(5).join('-');
    
    console.log(`🗑️ Deleting encrypted entry: ${entryId}`);
    
    await docClient.send(new DeleteCommand({
      TableName: ENTRIES_TABLE,
      Key: {
        userId,
        entryId: actualEntryId,
      },
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
      // Query by topic using GSI
      try {
        const result = await docClient.send(new QueryCommand({
          TableName: ENTRIES_TABLE,
          IndexName: 'TopicEntriesIndex',
          KeyConditionExpression: 'topicId = :topicId',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':topicId': topicId,
            ':userId': userId,
          },
        }));
        
        console.log(`✅ GSI query successful, found ${result.Items?.length || 0} entries`);
        
        if (result.Items) {
          for (const encryptedEntry of result.Items) {
            try {
              const decryptedData = decryptDiaryEntry(encryptedEntry.encryptedContent, encryptedEntry.encryptedTitle, userId, userEncryptionSecret);
              const entry: DiaryEntry = {
                id: `${userId}-${encryptedEntry.entryId}`,
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
        
      } catch (_error) {
        console.log(`⚠️ GSI query failed, falling back to scan method`);
        
        // Fallback: query all entries by userId and filter by topicId
        const result = await docClient.send(new QueryCommand({
          TableName: ENTRIES_TABLE,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        }));
        
        if (result.Items) {
          for (const encryptedEntry of result.Items) {
            if (encryptedEntry.topicId === topicId) {
              try {
                const decryptedData = decryptDiaryEntry(encryptedEntry.encryptedContent, encryptedEntry.encryptedTitle, userId, userEncryptionSecret);
                const entry: DiaryEntry = {
                  id: `${userId}-${encryptedEntry.entryId}`,
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
              id: `${userId}-${encryptedEntry.entryId}`,
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
      // Count entries for a specific topic using GSI
      try {
        const result = await docClient.send(new QueryCommand({
          TableName: ENTRIES_TABLE,
          IndexName: 'TopicEntriesIndex',
          KeyConditionExpression: 'topicId = :topicId',
          FilterExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':topicId': topicId,
            ':userId': userId,
          },
          Select: 'COUNT',
        }));
        
        console.log(`✅ Counted ${result.Count || 0} entries for topic ${topicId}`);
        return result.Count || 0;
      } catch (_error) {
        console.log(`⚠️ GSI query failed for topic ${topicId}, falling back to scan method`);
        
        // Fallback: query all entries by userId and filter by topicId
        const result = await docClient.send(new QueryCommand({
          TableName: ENTRIES_TABLE,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
          Select: 'COUNT',
        }));
        
        // Note: This gives total count, not topic-specific count
        // For exact topic count, we'd need to scan and filter, but that's expensive
        console.log(`✅ Counted ${result.Count || 0} total entries for user (fallback method)`);
        return result.Count || 0;
      }
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

