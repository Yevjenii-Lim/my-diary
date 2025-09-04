import { NextRequest, NextResponse } from 'next/server';
import { getUserEncryptedEntries, createEncryptedDiaryEntry, updateEncryptedDiaryEntry, ensureUserEncryption } from '@/lib/dynamodb-encrypted';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const topicId = searchParams.get('topicId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user's encryption secret to decrypt entries
    const userEncryptionSecret = await ensureUserEncryption(userId);
    console.log(`🔐 Fetching and decrypting entries for user: ${userId}`);

    // Fetch and decrypt all user entries
    const decryptedEntries = await getUserEncryptedEntries(userId, userEncryptionSecret, topicId || undefined);
    
    console.log(`✅ Successfully decrypted ${decryptedEntries.length} entries for user: ${userId}`);
    
    return NextResponse.json({ 
      entries: decryptedEntries,
      encryptionStatus: 'decrypted',
      totalEntries: decryptedEntries.length
    });
  } catch (error) {
    console.error('Error fetching/decrypting entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, topicId, title, content } = body;

    if (!userId || !topicId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;

    console.log(`🔐 Creating encrypted entry for user: ${userId}`);
    console.log(`📝 Entry details: title="${title}", content="${content.substring(0, 50)}...", wordCount=${wordCount}`);

    // Get the user's encryption secret
    console.log('🔑 Getting user encryption secret...');
    const userEncryptionSecret = await ensureUserEncryption(userId);
    console.log('✅ User encryption secret retrieved');

    // Create encrypted diary entry
    console.log('🔒 Creating encrypted diary entry...');
    const newEntry = await createEncryptedDiaryEntry(
      userId,
      topicId,
      title,
      content,
      userEncryptionSecret
    );

    console.log('✅ Encrypted diary entry created successfully');
    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating entry:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: 'Failed to create entry',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, title, content } = body;

    if (!id || !userId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;

    console.log(`🔐 Updating encrypted entry: ${id}`);
    console.log(`📝 Update details: title="${title}", content="${content.substring(0, 50)}...", wordCount=${wordCount}`);

    // Get the user's encryption secret
    console.log('🔑 Getting user encryption secret...');
    const userEncryptionSecret = await ensureUserEncryption(userId);
    console.log('✅ User encryption secret retrieved');

    // Update encrypted diary entry
    console.log('🔒 Updating encrypted diary entry...');
    const updatedEntry = await updateEncryptedDiaryEntry(id, userId, {
      title,
      content,
    });

    if (!updatedEntry) {
      return NextResponse.json({ error: 'Entry not found or failed to update' }, { status: 404 });
    }

    console.log('✅ Encrypted diary entry updated successfully');
    return NextResponse.json({ entry: updatedEntry });
  } catch (error: any) {
    console.error('❌ Error updating entry:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    return NextResponse.json({ 
      error: 'Failed to update entry',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

