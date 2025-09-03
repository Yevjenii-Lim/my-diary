const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

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

// Table configurations
const TABLES = {
  'diary-users': {
    TableName: 'diary-users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: []
  },
  'diary-topics': {
    TableName: 'diary-topics',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'id', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: []
  },
  'diary-entries-encrypted': {
    TableName: 'diary-entries-encrypted',
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'entryId', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'entryId', AttributeType: 'S' },
      { AttributeName: 'topicId', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST',
    GlobalSecondaryIndexes: [
      {
        IndexName: 'TopicEntriesIndex',
        KeySchema: [
          { AttributeName: 'topicId', KeyType: 'HASH' },
          { AttributeName: 'userId', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ]
  }
};

async function checkTableExists(tableName) {
  try {
    await docClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

async function createTable(tableConfig) {
  try {
    console.log(`🔨 Creating table: ${tableConfig.TableName}`);
    
    const command = new CreateTableCommand(tableConfig);
    await docClient.send(command);
    
    console.log(`✅ Table ${tableConfig.TableName} created successfully`);
    return true;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️ Table ${tableConfig.TableName} already exists`);
      return true;
    }
    console.error(`❌ Error creating table ${tableConfig.TableName}:`, error.message);
    return false;
  }
}

async function setupFreshDatabase() {
  try {
    console.log('🚀 Setting up fresh database with proper encryption structure...\n');
    
    // Check existing tables
    console.log('📊 Checking existing tables...');
    for (const tableName of Object.keys(TABLES)) {
      const exists = await checkTableExists(tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'Exists' : 'Missing'}`);
    }
    
    // Check if old entries table exists
    const oldEntriesExists = await checkTableExists('diary-entries');
    if (oldEntriesExists) {
      console.log('\n⚠️  Old table "diary-entries" exists - this will be kept for now');
      console.log('   New encrypted data will go to "diary-entries-encrypted"');
    }
    
    console.log('\n🔨 Creating/updating tables...');
    
    // Create tables in order (users first, then topics, then new encrypted entries)
    const tableOrder = ['diary-users', 'diary-topics', 'diary-entries-encrypted'];
    
    for (const tableName of tableOrder) {
      const tableConfig = TABLES[tableName];
      const success = await createTable(tableConfig);
      
      if (!success) {
        console.error(`❌ Failed to create table ${tableName}. Stopping setup.`);
        return false;
      }
      
      // Wait a moment for table to be ready
      if (tableName !== 'diary-entries-encrypted') {
        console.log('⏳ Waiting for table to be ready...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your Next.js development server');
    console.log('2. All new entries will use the new encrypted table');
    console.log('3. Old entries remain in the old table (can be deleted later)');
    console.log('4. Test with new topics and entries to ensure encryption works!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    return false;
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupFreshDatabase();
}

module.exports = { setupFreshDatabase };
