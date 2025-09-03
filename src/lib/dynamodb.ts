import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { User, UserTopic } from '@/types/database';
import { 
  generateUserEncryptionSecret,
  hashData
} from '@/lib/encryption';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Use IAM role when deployed, fallback to credentials for local development
  ...(process.env.NODE_ENV === 'production' ? {} : {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  }),
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
const USERS_TABLE = process.env.USERS_TABLE || 'diary-users';
const TOPICS_TABLE = process.env.TOPICS_TABLE || 'diary-topics';

// User operations
export const createUser = async (user: Omit<User, 'createdAt' | 'updatedAt' | 'encryptionSecret' | 'encryptionSalt'>): Promise<User> => {
  const now = new Date().toISOString();
  
  // Generate encryption secret and salt for the user
  const { hash: encryptionSecret, salt: encryptionSalt } = hashData(
    generateUserEncryptionSecret(user.id)
  );
  
  const newUser: User = {
    ...user,
    encryptionSecret,
    encryptionSalt,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: USERS_TABLE,
    Item: newUser,
  }));

  return newUser;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const result = await docClient.send(new GetCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
  }));

  return result.Item as User || null;
};

// Topic operations
export const createUserTopic = async (topic: Omit<UserTopic, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserTopic> => {
  const now = new Date().toISOString();
  const newTopic: UserTopic = {
    ...topic,
    id: `${topic.userId}-${topic.topicId}`,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TOPICS_TABLE,
    Item: newTopic,
  }));

  return newTopic;
};

export const getUserTopics = async (userId: string): Promise<UserTopic[]> => {
  
  
  const result = await docClient.send(new QueryCommand({
    TableName: TOPICS_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  }));

  const topics = (result.Items || []) as UserTopic[];
  
  
  // Sort topics by creation date (oldest first)
  const sortedTopics = topics.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateA.getTime() - dateB.getTime();
  });
  
  return sortedTopics;
};

export const getUserCategories = async (userId: string): Promise<Array<{ id: string; name: string; color: string; icon: string }>> => {
  const topics = await getUserTopics(userId);
  
  // Extract unique categories from user's topics
  const categoryMap = new Map();
  
  topics.forEach(topic => {
    if (topic.category && !categoryMap.has(topic.category)) {
      categoryMap.set(topic.category, {
        id: topic.category,
        name: topic.category.charAt(0).toUpperCase() + topic.category.slice(1), // Capitalize first letter
        color: topic.color || 'from-gray-500 to-gray-600',
        icon: topic.icon || '📝'
      });
    }
  });
  
  // Convert to array and sort by name
  const categories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  return categories;
};

export const updateUserTopic = async (topicId: string, userId: string, updates: Partial<UserTopic>): Promise<UserTopic | null> => {
  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'userId' && key !== 'createdAt') {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  updateExpression.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const result = await docClient.send(new UpdateCommand({
    TableName: TOPICS_TABLE,
    Key: { 
      userId: userId,
      topicId: topicId 
    },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes as UserTopic || null;
};

export const deleteUserTopic = async (topicId: string, userId: string): Promise<void> => {
  await docClient.send(new DeleteCommand({
    TableName: TOPICS_TABLE,
    Key: { 
      userId: userId,
      topicId: topicId 
    },
  }));
};



// Delete user and all associated data
export const deleteUser = async (userId: string): Promise<void> => {
  await docClient.send(new DeleteCommand({
    TableName: USERS_TABLE,
    Key: { id: userId },
  }));
};

export const deleteUserTopics = async (userId: string): Promise<void> => {
  // First, get all user topics
  const userTopics = await getUserTopics(userId);
  
  // Delete each topic
  for (const topic of userTopics) {
    await docClient.send(new DeleteCommand({
      TableName: TOPICS_TABLE,
      Key: { 
        userId: topic.userId,
        topicId: topic.topicId 
      },
    }));
  }
};














