import { NextRequest, NextResponse } from 'next/server';
import { getUserEntries, createDiaryEntry } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const topicId = searchParams.get('topicId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const entries = await getUserEntries(userId, topicId || undefined);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
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

    const newEntry = await createDiaryEntry({
      userId,
      topicId,
      title,
      content,
      wordCount,
    });

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

