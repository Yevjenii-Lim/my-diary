import { NextRequest, NextResponse } from 'next/server';
import { getUserTopics } from '@/lib/dynamodb';
import { countUserEntriesByTopic } from '@/lib/dynamodb-encrypted';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const topics = await getUserTopics(userId);
    
    // Efficiently count entries for each topic without decryption
    const topicEntryCounts = await countUserEntriesByTopic(userId);
    
    // Calculate overall stats
    const totalEntries = Array.from(topicEntryCounts.values()).reduce((sum, count) => sum + count, 0);
    
    // For now, we'll provide basic counts without detailed analytics
    // Detailed analytics would require decryption, but we can add that later if needed
    const averageWordsPerEntry = 0; // Would need decryption to calculate
    const currentStreak = 0; // Would need decryption to calculate
    const longestStreak = 0; // Would need decryption to calculate
    const mostActiveDay = null; // Would need decryption to calculate
    const averageEntriesPerWeek = 0; // Would need decryption to calculate

    return NextResponse.json({
      topics: topics.map(topic => ({
        ...topic,
        entryCount: topicEntryCounts.get(topic.topicId) || 0
      })),
      overallStats: {
        totalTopics: topics.length,
        totalEntries,
        totalWords: 0, // Would need decryption to calculate
        averageWordsPerEntry,
        currentStreak,
        longestStreak,
        lastEntryDate: null, // Would need decryption to calculate
        mostActiveDay,
        averageEntriesPerWeek
      }
    });
  } catch (error) {
    console.error('Error fetching topics stats:', error);
    return NextResponse.json({ error: 'Failed to fetch topics stats' }, { status: 500 });
  }
}

