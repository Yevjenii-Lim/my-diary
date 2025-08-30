import { NextRequest, NextResponse } from 'next/server';
import { getUserCategories } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get categories from user's topics
    const categories = await getUserCategories(userId);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching user categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

