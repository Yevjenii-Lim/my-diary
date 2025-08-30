// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const tables = [
  {
    TableName: 'diary-users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'diary-topics',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'topicId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'topicId', AttributeType: 'S' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  },
  {
    TableName: 'diary-entries',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'entryId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'entryId', AttributeType: 'S' },
      { AttributeName: 'topicId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TopicEntriesIndex',
        KeySchema: [
          { AttributeName: 'topicId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  }
];

async function setupTables() {
  try {
    // List existing tables
    const listResponse = await client.send(new ListTablesCommand({}));
    const existingTables = listResponse.TableNames || [];

    for (const tableConfig of tables) {
      if (existingTables.includes(tableConfig.TableName)) {
        console.log(`Table ${tableConfig.TableName} already exists`);
        continue;
      }

      console.log(`Creating table: ${tableConfig.TableName}`);
      await client.send(new CreateTableCommand(tableConfig));
      console.log(`✅ Table ${tableConfig.TableName} created successfully`);
    }

    console.log('🎉 All tables are ready!');
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

setupTables();
