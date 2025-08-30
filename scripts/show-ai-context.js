// Script to show the exact AI context data
require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Analyze user's writing history (same as in ai-suggestions.ts)
async function analyzeUserWritingHistory(userId) {
  try {
    // Fetch all user entries
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/entries?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user entries');
    
    const data = await response.json();
    const entries = data.entries || [];
    
    if (entries.length === 0) {
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
        }
      };
    }

    // Analyze entry patterns
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Analyze topic engagement
    const topicStats = new Map();
    entries.forEach((entry) => {
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
    const allContent = entries.map(entry => entry.content || '').join(' ').toLowerCase();
    const words = allContent.split(/\s+/).filter(word => word.length > 3);
    
    // Simple theme detection
    const themeKeywords = {
      'relationships': ['friend', 'family', 'relationship', 'love', 'partner', 'parent', 'child'],
      'work': ['work', 'job', 'career', 'project', 'meeting', 'colleague', 'boss'],
      'health': ['health', 'exercise', 'workout', 'diet', 'sleep', 'energy', 'stress'],
      'learning': ['learn', 'study', 'course', 'book', 'knowledge', 'skill', 'education'],
      'creativity': ['creative', 'art', 'music', 'write', 'design', 'imagine', 'inspire'],
      'emotions': ['feel', 'emotion', 'happy', 'sad', 'angry', 'anxious', 'excited'],
      'goals': ['goal', 'plan', 'achieve', 'success', 'progress', 'target', 'dream']
    };

    const themeCounts = new Map();
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const count = keywords.reduce((sum, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\w*`, 'gi');
        return sum + (allContent.match(regex) || []).length;
      }, 0);
      if (count > 0) themeCounts.set(theme, count);
    });

    const commonThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);

    // Determine writing style
    const styleKeywords = {
      'reflective': ['think', 'reflect', 'consider', 'realize', 'understand', 'learn'],
      'creative': ['imagine', 'create', 'dream', 'fantasy', 'story', 'character'],
      'analytical': ['analyze', 'examine', 'compare', 'contrast', 'evaluate', 'assess'],
      'emotional': ['feel', 'emotion', 'heart', 'love', 'hate', 'fear', 'joy']
    };

    const styleCounts = new Map();
    Object.entries(styleKeywords).forEach(([style, keywords]) => {
      const count = keywords.reduce((sum, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\w*`, 'gi');
        return sum + (allContent.match(regex) || []).length;
      }, 0);
      styleCounts.set(style, count);
    });

    const writingStyle = Array.from(styleCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'reflective';

    // Calculate average entry length
    const avgLength = averageWordsPerEntry;
    let averageEntryLength = 'medium';
    if (avgLength < 50) averageEntryLength = 'short';
    else if (avgLength > 200) averageEntryLength = 'long';

    // Analyze recent activity
    const sortedEntries = entries
      .map(entry => new Date(entry.createdAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentDate = new Date(sortedEntries[i]);
      currentDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(sortedEntries[i + 1]);
      nextDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        tempStreak++;
        if (i === 0 && Math.abs(currentDate.getTime() - today.getTime()) <= 24 * 60 * 60 * 1000) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      userId,
      totalEntries,
      totalWords,
      averageWordsPerEntry,
      mostActiveTopics,
      writingPatterns: {
        averageEntryLength,
        commonThemes,
        writingStyle
      },
      recentActivity: {
        currentStreak,
        longestStreak
      }
    };

  } catch (error) {
    console.error('Error analyzing user writing history:', error);
    return null;
  }
}

// Build context for AI (same as in ai-suggestions.ts)
function buildAIContext(userProfile, topicTitle, topicDescription, recentEntries) {
  const recentContent = recentEntries
    .slice(0, 3)
    .map(entry => `${entry.title}: ${entry.content.substring(0, 200)}...`)
    .join('\n\n');

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

Recent entries (for context):
${recentContent || 'No recent entries'}

Please generate personalized writing suggestions for this user and topic.`;
}

async function showAIContext() {
  const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
  const topicTitle = 'Daily Reflection';
  const topicDescription = 'Process your day and understand your experiences';

  console.log('🤖 AI CONTEXT DATA ANALYSIS');
  console.log('==========================\n');

  try {
    // Analyze user profile
    console.log('📊 Step 1: Analyzing User Profile...');
    const userProfile = await analyzeUserWritingHistory(userId);
    
    if (!userProfile) {
      console.log('❌ Failed to analyze user profile');
      return;
    }

    console.log('✅ User Profile Analysis Complete!\n');
    console.log('📋 USER PROFILE DATA:');
    console.log('=====================');
    console.log(`Total entries: ${userProfile.totalEntries}`);
    console.log(`Total words written: ${userProfile.totalWords}`);
    console.log(`Average words per entry: ${userProfile.averageWordsPerEntry}`);
    console.log(`Writing style: ${userProfile.writingPatterns.writingStyle}`);
    console.log(`Average entry length: ${userProfile.writingPatterns.averageEntryLength}`);
    console.log(`Common themes: ${userProfile.writingPatterns.commonThemes.join(', ') || 'None detected'}`);
    console.log(`Current streak: ${userProfile.recentActivity.currentStreak} days`);
    console.log(`Longest streak: ${userProfile.recentActivity.longestStreak} days`);
    console.log(`Most active topics: ${userProfile.mostActiveTopics.map(t => t.title).join(', ')}`);

    // Get recent entries for context
    console.log('\n📝 Step 2: Fetching Recent Entries...');
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/entries?userId=${userId}`);
    const data = await response.json();
    const recentEntries = data.entries || [];
    
    console.log(`✅ Found ${recentEntries.length} recent entries\n`);

    // Build AI context
    console.log('🔧 Step 3: Building AI Context...');
    const aiContext = buildAIContext(userProfile, topicTitle, topicDescription, recentEntries);
    
    console.log('✅ AI Context Built!\n');
    console.log('🤖 EXACT CONTEXT SENT TO AI:');
    console.log('============================');
    console.log(aiContext);

    console.log('\n🎯 This is the exact context data that gets sent to OpenAI GPT-3.5-turbo');
    console.log('   to generate personalized writing suggestions for this user!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
showAIContext();
