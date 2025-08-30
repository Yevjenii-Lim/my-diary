import { NextRequest, NextResponse } from 'next/server';
import { getUserTopics, createUserTopic } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log(`🔍 API: Fetching topics for userId: ${userId}`);

    if (!userId) {
      console.log('❌ API: No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const topics = await getUserTopics(userId);
    console.log(`✅ API: Found ${topics.length} topics for user ${userId}:`, topics.map(t => t.title));
    
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('❌ API: Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, icon, color, category } = body;

    console.log(`➕ API: Creating custom topic for userId: ${userId}`);

    if (!userId || !title || !description || !icon || !color || !category) {
      console.log('❌ API: Missing required fields:', { userId, title, description, icon, color, category });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique topicId based on title and timestamp
    const timestamp = Date.now();
    const topicId = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`;

    const newTopic = await createUserTopic({
      userId,
      topicId,
      title,
      description,
      icon,
      color,
      category,
      isActive: true,
    });

    console.log(`✅ API: Successfully created custom topic: ${newTopic.title} for user ${userId}`);
    return NextResponse.json({ topic: newTopic }, { status: 201 });
  } catch (error) {
    console.error('❌ API: Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
