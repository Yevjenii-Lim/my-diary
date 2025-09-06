// AI Writing Suggestions Service using OpenAI API
export interface WritingSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number;
  tags: string[];
  confidence: number;
  reasoning: string;
}

export interface UserWritingProfile {
  userId: string;
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  mostActiveTopics: Array<{ topicId: string; entryCount: number; title: string }>;
  writingPatterns: {
    preferredTimeOfDay?: string;
    averageEntryLength: 'short' | 'medium' | 'long';
    commonThemes: string[];
    writingStyle: 'reflective' | 'creative' | 'analytical' | 'emotional';
  };
  recentActivity: {
    lastEntryDate?: string;
    currentStreak: number;
    longestStreak: number;
  };
  topicPreferences: Array<{ topicId: string; engagement: number; lastEntryDate?: string }>;
}

export interface AIAnalysisResult {
  userProfile: UserWritingProfile;
  suggestions: WritingSuggestion[];
  insights: string[];
  recommendations: string[];
}

// Analyze user's writing history to create a profile
export async function analyzeUserWritingHistory(userId: string): Promise<UserWritingProfile> {
  try {
    // Fetch all user entries
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/entries?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user entries');
    
    const { entries } = await response.json();
    
    if (!entries || entries.length === 0) {
      return createDefaultProfile(userId);
    }

    // Analyze entry patterns
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum: number, entry: any) => sum + (entry.wordCount || 0), 0);
    const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Analyze topic engagement
    const topicStats = new Map<string, { count: number; words: number; lastEntry?: string; title?: string }>();
    entries.forEach((entry: any) => {
      const existing = topicStats.get(entry.topicId) || { count: 0, words: 0 };
      existing.count += 1;
      existing.words += entry.wordCount || 0;
      if (!existing.lastEntry || entry.createdAt > existing.lastEntry) {
        existing.lastEntry = entry.createdAt;
      }
      existing.title = entry.topicTitle || entry.topicId;
      topicStats.set(entry.topicId, existing);
    });

    // Get most active topics
    const mostActiveTopics = Array.from(topicStats.entries())
      .map(([topicId, stats]) => ({
        topicId,
        entryCount: stats.count,
        title: stats.title || topicId,
        totalWords: stats.words
      }))
      .sort((a, b) => b.entryCount - a.entryCount)
      .slice(0, 5);

    // Analyze writing patterns
    const writingPatterns = analyzeWritingPatterns(entries);
    
    // Analyze recent activity
    const recentActivity = analyzeRecentActivity(entries);
    
    // Calculate topic preferences
    const topicPreferences = Array.from(topicStats.entries())
      .map(([topicId, stats]) => ({
        topicId,
        engagement: stats.count / totalEntries, // percentage of total entries
        lastEntryDate: stats.lastEntry
      }))
      .sort((a, b) => b.engagement - a.engagement);

    return {
      userId,
      totalEntries,
      totalWords,
      averageWordsPerEntry,
      mostActiveTopics,
      writingPatterns,
      recentActivity,
      topicPreferences
    };

  } catch (error) {
    console.error('Error analyzing user writing history:', error);
    return createDefaultProfile(userId);
  }
}

// Analyze writing patterns from entries
function analyzeWritingPatterns(entries: any[]) {
  const themes = extractCommonThemes(entries);
  const averageLength = calculateAverageLength(entries);
  const writingStyle = determineWritingStyle(entries);

  return {
    averageEntryLength: averageLength,
    commonThemes: themes,
    writingStyle
  };
}

// Extract common themes from entry content
function extractCommonThemes(entries: any[]): string[] {
  const allContent = entries.map(entry => entry.content || '').join(' ').toLowerCase();
  const words = allContent.split(/\s+/).filter(word => word.length > 3);
  
  // Simple theme detection based on common words
  const themeKeywords = {
    'relationships': ['friend', 'family', 'relationship', 'love', 'partner', 'parent', 'child'],
    'work': ['work', 'job', 'career', 'project', 'meeting', 'colleague', 'boss'],
    'health': ['health', 'exercise', 'workout', 'diet', 'sleep', 'energy', 'stress'],
    'learning': ['learn', 'study', 'course', 'book', 'knowledge', 'skill', 'education'],
    'creativity': ['creative', 'art', 'music', 'write', 'design', 'imagine', 'inspire'],
    'emotions': ['feel', 'emotion', 'happy', 'sad', 'angry', 'anxious', 'excited'],
    'goals': ['goal', 'plan', 'achieve', 'success', 'progress', 'target', 'dream']
  };

  const themeCounts = new Map<string, number>();
  
  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    const count = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\w*`, 'gi');
      return sum + (allContent.match(regex) || []).length;
    }, 0);
    if (count > 0) {
      themeCounts.set(theme, count);
    }
  });

  return Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);
}

// Calculate average entry length category
function calculateAverageLength(entries: any[]): 'short' | 'medium' | 'long' {
  const avgWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0) / entries.length;
  
  if (avgWords < 100) return 'short';
  if (avgWords < 300) return 'medium';
  return 'long';
}

// Determine writing style based on content analysis
function determineWritingStyle(entries: any[]): 'reflective' | 'creative' | 'analytical' | 'emotional' {
  const allContent = entries.map(entry => entry.content || '').join(' ').toLowerCase();
  
  const styleIndicators = {
    reflective: ['think', 'reflect', 'consider', 'realize', 'understand', 'learned'],
    creative: ['imagine', 'story', 'character', 'scene', 'creative', 'artistic'],
    analytical: ['analyze', 'data', 'research', 'evidence', 'conclusion', 'because'],
    emotional: ['feel', 'emotion', 'heart', 'love', 'hate', 'fear', 'joy', 'sad']
  };

  const scores = Object.entries(styleIndicators).map(([style, keywords]) => {
    const score = keywords.reduce((sum, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\w*`, 'gi');
      return sum + (allContent.match(regex) || []).length;
    }, 0);
    return { style, score };
  });

  const dominantStyle = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );

  return dominantStyle.style as any;
}

// Analyze recent activity patterns
function analyzeRecentActivity(entries: any[]): { lastEntryDate?: string; currentStreak: number; longestStreak: number } {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedEntries = entries
    .map(entry => new Date(entry.createdAt))
    .sort((a, b) => b.getTime() - a.getTime());

  const lastEntryDate = sortedEntries[0].toISOString();
  
  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentDate = new Date(sortedEntries[i]);
    currentDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(sortedEntries[i + 1]);
    nextDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff <= 1) {
      tempStreak++;
      if (i === 0 && Math.abs(currentDate.getTime() - new Date().getTime()) <= 24 * 60 * 60 * 1000) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    lastEntryDate,
    currentStreak,
    longestStreak
  };
}

// Create default profile for new users
function createDefaultProfile(userId: string): UserWritingProfile {
  return {
    userId,
    totalEntries: 0,
    totalWords: 0,
    averageWordsPerEntry: 0,
    mostActiveTopics: [],
    writingPatterns: {
      averageEntryLength: 'medium',
      commonThemes: [],
      writingStyle: 'reflective'
    },
    recentActivity: {
      currentStreak: 0,
      longestStreak: 0
    },
    topicPreferences: []
  };
}

// Generate AI suggestions using OpenAI API
export async function generateAISuggestions(
  userProfile: UserWritingProfile, 
  topicTitle: string, 
  topicDescription: string,
  recentEntries: any[] = [],
  language: string = 'en'
): Promise<WritingSuggestion[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using fallback suggestions');
      return generateFallbackSuggestions(topicTitle, topicDescription);
    }

    // Prepare context for AI
    const context = buildAIContext(userProfile, topicTitle, topicDescription, recentEntries, language);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert writing coach and journaling specialist. Your job is to generate personalized writing prompts and suggestions for users based on their writing history and preferences.

IMPORTANT: Generate the suggestion in ${language === 'en' ? 'English' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'zh' ? 'Chinese' : language === 'pt' ? 'Portuguese' : language === 'it' ? 'Italian' : language === 'ru' ? 'Russian' : language === 'pl' ? 'Polish' : language === 'uk' ? 'Ukrainian' : language === 'hi' ? 'Hindi' : 'English'}.

Generate 1 high-quality writing suggestion that is:
1. Personalized to the user's writing style and patterns
2. Relevant to the specific topic they're writing about
3. Perfectly suited to their current writing level and preferences
4. Engaging and inspiring
5. Specific enough to be actionable
6. DIFFERENT from previous suggestions - be creative and varied
7. The best possible suggestion for this user and topic
8. Written in the specified language (${language})

The suggestion should include:
- A compelling title (in ${language})
- A description (this is the main writing instruction for the user, in ${language}) 
- Relevant tags
- Confidence level (0.1-1.0)
- Brief reasoning for why this suggestion fits the user (in ${language})

Format your response as a JSON array with exactly one suggestion object.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI API');
    }

    // Parse AI response
    try {
                  const suggestions = JSON.parse(aiResponse);
            return suggestions.map((suggestion: any, index: number) => ({
              id: `ai-suggestion-${Date.now()}-${index}`,
              title: suggestion.title,
              description: suggestion.description,
              prompt: suggestion.prompt || suggestion.description || suggestion.reasoning, // Use description or reasoning as fallback
              tags: suggestion.tags || [],
              confidence: suggestion.confidence || 0.8,
              reasoning: suggestion.reasoning || 'AI-generated suggestion based on your writing patterns'
            }));
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generateFallbackSuggestions(topicTitle, topicDescription);
    }

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return generateFallbackSuggestions(topicTitle, topicDescription);
  }
}

// Build context for AI based on user profile and topic
function buildAIContext(
  userProfile: UserWritingProfile, 
  topicTitle: string, 
  topicDescription: string,
  recentEntries: any[],
  language: string = 'en'
): string {
  const recentContent = recentEntries
    .slice(0, 3)
    .map(entry => `${entry.title}: ${entry.content.substring(0, 200)}...`)
    .join('\n\n');

      const languageName = language === 'en' ? 'English' : 
                      language === 'es' ? 'Spanish' : 
                      language === 'fr' ? 'French' : 
                      language === 'de' ? 'German' : 
                      language === 'ja' ? 'Japanese' : 
                      language === 'ko' ? 'Korean' : 
                      language === 'zh' ? 'Chinese' : 
                      language === 'pt' ? 'Portuguese' : 
                      language === 'it' ? 'Italian' : 
                      language === 'ru' ? 'Russian' : 
                      language === 'pl' ? 'Polish' : 
                      language === 'uk' ? 'Ukrainian' : 'English';

  return `User Profile:
- Total entries: ${userProfile.totalEntries}
- Total words written: ${userProfile.totalWords}
- Average words per entry: ${userProfile.averageWordsPerEntry}
- Writing style: ${userProfile.writingPatterns.writingStyle}
- Average entry length: ${userProfile.writingPatterns.averageEntryLength}
- Common themes: ${userProfile.writingPatterns.commonThemes.join(', ')}
- Current streak: ${userProfile.recentActivity.currentStreak} days
- Longest streak: ${userProfile.recentActivity.longestStreak} days

Topic: ${topicTitle}
Description: ${topicDescription}
Target Language: ${languageName} (${language})

Recent entries (for context):
${recentContent || 'No recent entries'}

Request timestamp: ${new Date().toISOString()}
Random seed: ${Math.random().toString(36).substring(2, 15)}

Please generate a UNIQUE and DIFFERENT personalized writing suggestion for this user and topic in ${languageName}. Make it creative and varied from previous suggestions.`;
}

// Fallback suggestions when AI is not available
function generateFallbackSuggestions(topicTitle: string, topicDescription: string): WritingSuggestion[] {
  return [
    {
      id: 'fallback-reflection',
      title: 'Deep Reflection',
      description: 'Take a deeper look at your experiences with this topic',
      prompt: `Reflect on your journey with ${topicTitle.toLowerCase()}. What patterns do you notice? What has changed over time? What insights have you gained?`,
      tags: ['reflection', 'insights', 'patterns'],
      confidence: 0.7,
      reasoning: 'Fallback suggestion based on topic analysis'
    }
  ];
}

// Main function to get AI suggestions for a user and topic
export async function getAISuggestions(
  userId: string, 
  topicTitle: string, 
  topicDescription: string,
  recentEntries: any[] = [],
  language: string = 'en'
): Promise<WritingSuggestion[]> {
  try {
    // Analyze user's writing history
    const userProfile = await analyzeUserWritingHistory(userId);
    
    // Generate AI suggestions
    const suggestions = await generateAISuggestions(userProfile, topicTitle, topicDescription, recentEntries, language);
    
    return suggestions;
    
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return generateFallbackSuggestions(topicTitle, topicDescription);
  }
}
