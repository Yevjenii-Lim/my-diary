import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { userId, title, content } = body;

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;
    const updatedAt = new Date().toISOString();

    // Extract the actual entryId from the composite id
    const fullCompositeId = resolvedParams.entryId;
    const actualEntryId = fullCompositeId.replace(`${userId}-`, '');

    console.log(`✏️ API: Updating entry with userId: ${userId}, entryId: ${actualEntryId}`);

    // Update the entry using the correct composite key
    const updateCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries',
      Key: {
        userId: userId,
        entryId: actualEntryId,
      },
      UpdateExpression: 'SET title = :title, content = :content, wordCount = :wordCount, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':title': title,
        ':content': content,
        ':wordCount': wordCount,
        ':updatedAt': updatedAt,
      },
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(updateCommand);

    return NextResponse.json({ 
      entry: result.Attributes,
      message: 'Entry updated successfully' 
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Extract the actual entryId from the composite id
    // The entryId parameter contains the full composite id: userId-entryId
    // We need to extract just the entryId part
    const fullCompositeId = resolvedParams.entryId;
    const actualEntryId = fullCompositeId.replace(`${userId}-`, '');

    console.log(`🗑️ API: Deleting entry with userId: ${userId}, entryId: ${actualEntryId}`);

    // Delete the entry using the correct composite key
    const deleteCommand = new DeleteCommand({
      TableName: process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries',
      Key: {
        userId: userId,
        entryId: actualEntryId,
      },
    });

    await docClient.send(deleteCommand);

    return NextResponse.json({ 
      message: 'Entry deleted successfully',
      deletedEntryId: actualEntryId 
    });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Extract the actual entryId from the composite id
    const fullCompositeId = resolvedParams.entryId;
    const actualEntryId = fullCompositeId.replace(`${userId}-`, '');

    console.log(`📖 API: Getting entry with userId: ${userId}, entryId: ${actualEntryId}`);

    // Get the entry using the correct composite key
    const getCommand = new GetCommand({
      TableName: process.env.DYNAMODB_ENTRIES_TABLE || 'diary-entries',
      Key: {
        userId: userId,
        entryId: actualEntryId,
      },
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({ entry: result.Item });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}
