import { NextRequest, NextResponse } from 'next/server';
import { getEncryptedDiaryEntry, updateEncryptedDiaryEntry, deleteEncryptedDiaryEntry, ensureUserEncryption } from '@/lib/dynamodb-encrypted';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { entryId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    console.log(`🔐 Fetching and decrypting entry: ${entryId}`);
    
    const userEncryptionSecret = await ensureUserEncryption(userId);
    const decryptedEntry = await getEncryptedDiaryEntry(entryId, userEncryptionSecret);
    
    if (!decryptedEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    console.log(`✅ Successfully decrypted entry: ${entryId}`);
    
    return NextResponse.json({ 
      entry: decryptedEntry,
      encryptionStatus: 'decrypted'
    });
  } catch (error) {
    console.error('Error fetching/decrypting entry:', error);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const body = await request.json();
    const { userId, title, content } = body;
    const { entryId } = await params;

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const wordCount = content.trim().split(/\s+/).length;

    console.log(`🔐 Updating encrypted entry: ${entryId}`);
    console.log(`📝 Update details: title="${title}", content="${content.substring(0, 50)}...", wordCount=${wordCount}`);

    // Get the user's encryption secret
    console.log('🔑 Getting user encryption secret...');
    const userEncryptionSecret = await ensureUserEncryption(userId);
    console.log('✅ User encryption secret retrieved');

    // Update encrypted diary entry
    console.log('🔒 Updating encrypted diary entry...');
    const updatedEntry = await updateEncryptedDiaryEntry(entryId, {
      title,
      content,
      wordCount,
    }, userEncryptionSecret);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { entryId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    console.log(`🗑️ Deleting entry: ${entryId}`);
    
    // Get user encryption secret for secure deletion
    const userEncryptionSecret = await ensureUserEncryption(userId);
    
    // Delete the encrypted diary entry
    const deleteResult = await deleteEncryptedDiaryEntry(entryId);
    
    if (deleteResult) {
      console.log('✅ Entry deleted successfully');
    } else {
      console.log('❌ Failed to delete entry');
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
