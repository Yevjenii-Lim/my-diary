import { NextRequest, NextResponse } from 'next/server';
import { getUserEncryptedEntries, ensureUserEncryption } from '@/lib/dynamodb-encrypted';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { topicId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    console.log(`🔐 Fetching and decrypting entries for topic: ${topicId}, user: ${userId}`);
    
    const userEncryptionSecret = await ensureUserEncryption(userId);
    const decryptedEntries = await getUserEncryptedEntries(userId, userEncryptionSecret, topicId);
    
    console.log(`✅ Successfully decrypted ${decryptedEntries.length} entries for topic: ${topicId}`);
    
    return NextResponse.json({ 
      entries: decryptedEntries,
      encryptionStatus: 'decrypted',
      totalEntries: decryptedEntries.length
    });
  } catch (error) {
    console.error('Error fetching entries by topic:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
