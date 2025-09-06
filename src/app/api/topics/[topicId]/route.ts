import { NextRequest, NextResponse } from 'next/server';
import { deleteUserTopic, updateUserTopic } from '@/lib/dynamodb';
import { getUserEncryptedEntries, deleteEncryptedDiaryEntry } from '@/lib/dynamodb-encrypted';
import { getUserEncryptionSecret } from '@/lib/encryption-keys';

export async function DELETE(
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

    // Get entries to delete them first
    try {
      const userEncryptionSecret = await getUserEncryptionSecret(userId);
      const entries = await getUserEncryptedEntries(userId, userEncryptionSecret, topicId);
      
      // Delete all entries for this topic
      for (const entry of entries) {
        console.log(`🗑️ Deleting entry ${entry.id} for topic ${topicId}`);
        await deleteEncryptedDiaryEntry(entry.id, userId);
      }
      console.log(`✅ Deleted ${entries.length} entries for topic ${topicId}`);
    } catch (error) {
      console.error('Error fetching or deleting entries for topic:', error);
      // Continue with topic deletion even if entry cleanup fails
    }

    // Delete the topic
    await deleteUserTopic(topicId, userId);

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { topicId } = await params;
    const body = await request.json();
    const { title, description } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const updatedTopic = await updateUserTopic(topicId, userId, { title, description });

    if (!updatedTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ topic: updatedTopic });
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

