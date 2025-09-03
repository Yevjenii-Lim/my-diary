import { NextRequest, NextResponse } from 'next/server';
import { getAISuggestions } from '@/lib/ai-suggestions';
import { validateEnvironmentVariables } from '@/lib/env-validation';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    validateEnvironmentVariables();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const topicTitle = searchParams.get('topicTitle');
    const topicDescription = searchParams.get('topicDescription');
    const language = searchParams.get('language') || 'en'; // Default to English

    if (!userId || !topicTitle) {
      return NextResponse.json({ 
        error: 'User ID and topic title are required' 
      }, { status: 400 });
    }

    // Get AI suggestions
    const suggestions = await getAISuggestions(
      userId, 
      topicTitle, 
      topicDescription || '',
      [], // recentEntries
      language
    );

    return NextResponse.json({ 
      suggestions,
      generatedAt: new Date().toISOString(),
      language
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI suggestions' 
    }, { status: 500 });
  }
}
