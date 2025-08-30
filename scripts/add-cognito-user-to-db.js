require('dotenv').config({ path: '.env.local' });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function addCognitoUserToDB() {
  try {
    // Replace these with your actual Cognito user details
    const cognitoUserId = 'c4c864a8-f061-7051-b6ab-8e7128f0eca2'; // Your Cognito user ID
    const userEmail = 'your-email@example.com'; // Replace with your email
    const userName = 'Your Name'; // Replace with your name

    const user = {
      id: cognitoUserId,
      email: userEmail,
      name: userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: 'diary-users',
      Item: user,
    }));

    console.log(`✅ Successfully added Cognito user to database:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Update the email and name above with your actual details`);
    console.log(`   2. Run this script again`);
    console.log(`   3. Your topics will now be properly associated with your Cognito account`);

  } catch (error) {
    console.error('❌ Error adding Cognito user to database:', error);
  }
}

addCognitoUserToDB();

