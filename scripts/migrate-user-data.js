const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'diary-users';
const TOPICS_TABLE = process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics';
const ENTRIES_TABLE = process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries';

async function migrateUserData() {
  try {
    console.log('🔄 Starting user data migration...\n');

    console.log('📋 Configuration:');
    console.log(`   User Pool ID: ${USER_POOL_ID}`);
    console.log(`   Users Table: ${USERS_TABLE}`);
    console.log(`   Topics Table: ${TOPICS_TABLE}`);
    console.log(`   Entries Table: ${ENTRIES_TABLE}\n`);

    // Step 1: Get all Cognito users
    console.log('👥 Step 1: Getting all Cognito users...');
    const cognitoUsers = await cognitoClient.send(new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
    }));

    if (!cognitoUsers.Users || cognitoUsers.Users.length === 0) {
      console.log('❌ No users found in Cognito');
      return;
    }

    console.log(`✅ Found ${cognitoUsers.Users.length} users in Cognito\n`);

    // Step 2: For each Cognito user, find and migrate their data
    for (const cognitoUser of cognitoUsers.Users) {
      const email = cognitoUser.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const name = cognitoUser.Attributes?.find(attr => attr.Name === 'name')?.Value;
      const sub = cognitoUser.Attributes?.find(attr => attr.Name === 'sub')?.Value;

      if (!email || !sub) {
        console.log(`⚠️  Skipping user ${cognitoUser.Username} - missing email or sub`);
        continue;
      }

      console.log(`🔄 Processing user: ${name} (${email})`);
      console.log(`   Cognito Username: ${cognitoUser.Username}`);
      console.log(`   Cognito Sub: ${sub}`);

      // Step 3: Find user data in DynamoDB using email as ID
      console.log('   📊 Looking for user data with email as ID...');
      
      try {
        const userResult = await docClient.send(new QueryCommand({
          TableName: USERS_TABLE,
          KeyConditionExpression: 'id = :userId',
          ExpressionAttributeValues: {
            ':userId': email,
          },
        }));

        if (userResult.Items && userResult.Items.length > 0) {
          const oldUser = userResult.Items[0];
          console.log(`   ✅ Found user data with email ID: ${oldUser.name}`);

          // Step 4: Create new user record with correct ID
          console.log('   📝 Creating new user record with correct ID...');
          await docClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { id: sub },
            UpdateExpression: 'SET #name = :name, #email = :email, #createdAt = :createdAt, #updatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#name': 'name',
              '#email': 'email',
              '#createdAt': 'createdAt',
              '#updatedAt': 'updatedAt',
            },
            ExpressionAttributeValues: {
              ':name': oldUser.name,
              ':email': oldUser.email,
              ':createdAt': oldUser.createdAt,
              ':updatedAt': new Date().toISOString(),
            },
          }));

          // Step 5: Migrate topics
          console.log('   📚 Migrating topics...');
          const topicsResult = await docClient.send(new QueryCommand({
            TableName: TOPICS_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': email,
            },
          }));

          if (topicsResult.Items && topicsResult.Items.length > 0) {
            console.log(`   ✅ Found ${topicsResult.Items.length} topics to migrate`);
            
            for (const topic of topicsResult.Items) {
              // Create new topic with correct user ID
              await docClient.send(new UpdateCommand({
                TableName: TOPICS_TABLE,
                Key: { 
                  userId: sub,
                  topicId: topic.topicId 
                },
                UpdateExpression: 'SET #title = :title, #description = :description, #icon = :icon, #color = :color, #category = :category, #imageUrl = :imageUrl, #isActive = :isActive, #createdAt = :createdAt, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                  '#title': 'title',
                  '#description': 'description',
                  '#icon': 'icon',
                  '#color': 'color',
                  '#category': 'category',
                  '#imageUrl': 'imageUrl',
                  '#isActive': 'isActive',
                  '#createdAt': 'createdAt',
                  '#updatedAt': 'updatedAt',
                },
                ExpressionAttributeValues: {
                  ':title': topic.title,
                  ':description': topic.description,
                  ':icon': topic.icon,
                  ':color': topic.color,
                  ':category': topic.category,
                  ':imageUrl': topic.imageUrl || null,
                  ':isActive': topic.isActive,
                  ':createdAt': topic.createdAt,
                  ':updatedAt': topic.updatedAt,
                },
              }));

              // Delete old topic
              await docClient.send(new DeleteCommand({
                TableName: TOPICS_TABLE,
                Key: { 
                  userId: email,
                  topicId: topic.topicId 
                },
              }));
            }
          }

          // Step 6: Migrate entries
          console.log('   📝 Migrating entries...');
          const entriesResult = await docClient.send(new QueryCommand({
            TableName: ENTRIES_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': email,
            },
          }));

          if (entriesResult.Items && entriesResult.Items.length > 0) {
            console.log(`   ✅ Found ${entriesResult.Items.length} entries to migrate`);
            
            for (const entry of entriesResult.Items) {
              // Create new entry with correct user ID
              const newEntryId = `${sub}-${entry.entryId}`;
              await docClient.send(new UpdateCommand({
                TableName: ENTRIES_TABLE,
                Key: { id: newEntryId },
                UpdateExpression: 'SET #userId = :userId, #entryId = :entryId, #topicId = :topicId, #title = :title, #content = :content, #wordCount = :wordCount, #createdAt = :createdAt, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                  '#userId': 'userId',
                  '#entryId': 'entryId',
                  '#topicId': 'topicId',
                  '#title': 'title',
                  '#content': 'content',
                  '#wordCount': 'wordCount',
                  '#createdAt': 'createdAt',
                  '#updatedAt': 'updatedAt',
                },
                ExpressionAttributeValues: {
                  ':userId': sub,
                  ':entryId': entry.entryId,
                  ':topicId': entry.topicId,
                  ':title': entry.title,
                  ':content': entry.content,
                  ':wordCount': entry.wordCount,
                  ':createdAt': entry.createdAt,
                  ':updatedAt': entry.updatedAt,
                },
              }));

              // Delete old entry
              await docClient.send(new DeleteCommand({
                TableName: ENTRIES_TABLE,
                Key: { id: entry.id },
              }));
            }
          }

          // Step 7: Delete old user record
          console.log('   🗑️ Deleting old user record...');
          await docClient.send(new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { id: email },
          }));

          console.log(`   ✅ Successfully migrated user: ${name}\n`);
        } else {
          console.log(`   ℹ️  No user data found with email ID for: ${email}\n`);
        }
      } catch (error) {
        console.log(`   ❌ Error migrating user ${email}:`, error.message);
      }
    }

    console.log('🎉 Migration completed!');
    console.log('💡 Users should now see their topics when they sign in');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateUserData();




