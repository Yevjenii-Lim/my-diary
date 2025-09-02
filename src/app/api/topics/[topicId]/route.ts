import { NextRequest, NextResponse } from 'next/server';
import { deleteUserTopic, getUserEntries, updateUserTopic } from '@/lib/dynamodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!resolvedParams.topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 });
    }

    // Check if topic has entries
    const entries = await getUserEntries(userId, resolvedParams.topicId);
    if (entries.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete topic with existing entries. Please delete all entries first.' 
      }, { status: 400 });
    }

    // Delete the topic
    await deleteUserTopic(resolvedParams.topicId, userId);
    
    return NextResponse.json({ 
      message: 'Topic deleted successfully',
      deletedTopicId: resolvedParams.topicId 
    });
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
    const resolvedParams = await params;
    const body = await request.json();
    const { userId, title, description } = body;



    if (!userId || !title || !description) {

      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the topic
    const updatedTopic = await updateUserTopic(resolvedParams.topicId, userId, {
      title: title.trim(),
      description: description.trim(),
    });

    if (!updatedTopic) {

      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }


    return NextResponse.json({ 
      topic: updatedTopic,
      message: 'Topic updated successfully' 
    });

  } catch (error) {
    console.error('❌ API: Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

