import { NextRequest, NextResponse } from 'next/server';
import { getUserTopics } from '@/lib/topics';
import { createUserTopic } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');



    if (!userId) {

      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const topics = await getUserTopics(userId);

    
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



    if (!userId || !title || !description || !icon || !color || !category) {

      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a topic with the same title already exists for this user
    const existingTopics = await getUserTopics(userId);
    const titleExists = existingTopics.some(topic => 
      topic.title.toLowerCase().trim() === title.toLowerCase().trim()
    );

    if (titleExists) {
      return NextResponse.json({ 
        error: 'A topic with this title already exists. Please choose a different title.' 
      }, { status: 409 });
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


    return NextResponse.json({ topic: newTopic }, { status: 201 });
  } catch (error) {
    console.error('❌ API: Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
