import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { initializeUserEncryption } from '@/lib/encryption-keys';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names
const USERS_TABLE = process.env.USERS_TABLE || 'diary-users';

// GET: Check if Google user exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Query users by email
    const queryCommand = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await docClient.send(queryCommand);

    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          writingGoal: user.writingGoal,
          experienceLevel: user.experienceLevel,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        exists: true,
      });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

   } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('❌ Error checking Google user:', error);
    console.error('❌ Error details:', {
      message: errorMessage,
      name: errorName,
      stack: errorStack,
      region: process.env.AWS_REGION,
      tableName: USERS_TABLE,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}

// POST: Create new Google user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, writingGoal, experienceLevel } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }



    // Generate unique user ID
    const userId = `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const userData = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      writingGoal: writingGoal || 'improve-writing',
      experienceLevel: experienceLevel || 'beginner',
      authProvider: 'google',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    // Check if user already exists
    const existingUserQuery = new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim(),
      },
    });

    const existingResult = await docClient.send(existingUserQuery);

    if (existingResult.Items && existingResult.Items.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Initialize encryption for the new user
    console.log(`🔐 Initializing encryption for new Google user: ${userId}`);
    const encryptionSecret = await initializeUserEncryption(userId);
    console.log(`✅ Encryption initialized for Google user: ${userId}`);

    // Create new user
    const putCommand = new PutCommand({
      TableName: USERS_TABLE,
      Item: userData,
    });

    await docClient.send(putCommand);



    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        writingGoal: userData.writingGoal,
        experienceLevel: userData.experienceLevel,
        authProvider: userData.authProvider,
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      message: 'Google user account created successfully with encryption enabled',
      encryptionStatus: 'initialized'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating Google user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
