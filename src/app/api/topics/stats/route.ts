import { NextRequest, NextResponse } from 'next/server';
import { getUserTopics, getUserEntries } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all user topics
    const topics = await getUserTopics(userId);
    
    // Get entry counts for each topic
    const topicStats = await Promise.all(
      topics.map(async (topic) => {
        const entries = await getUserEntries(userId, topic.topicId);
        return {
          topicId: topic.topicId,
          entryCount: entries.length,
        };
      })
    );

    return NextResponse.json({ topicStats });
  } catch (error) {
    console.error('Error fetching topic stats:', error);
    return NextResponse.json({ error: 'Failed to fetch topic stats' }, { status: 500 });
  }
}

