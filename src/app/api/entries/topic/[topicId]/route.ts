import { NextRequest, NextResponse } from 'next/server';
import { getUserEntries } from '@/lib/dynamodb';

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

    const entries = await getUserEntries(userId, topicId);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching entries by topic:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}
