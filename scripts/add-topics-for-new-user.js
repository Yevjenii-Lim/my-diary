const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Initial writing goals from the app
const initialTopics = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    description: 'Process your day and understand your experiences',
    icon: '🤔',
    color: 'from-blue-500 to-blue-600',
    category: 'reflection'
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    description: 'Explore your imagination and develop creative skills',
    icon: '✨',
    color: 'from-purple-500 to-purple-600',
    category: 'creativity'
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Work through challenges and find solutions',
    icon: '🧩',
    color: 'from-green-500 to-green-600',
    category: 'learning'
  },
  {
    id: 'learning-notes',
    title: 'Learning Notes',
    description: 'Document what you\'ve learned and insights gained',
    icon: '📚',
    color: 'from-orange-500 to-orange-600',
    category: 'learning'
  },
  {
    id: 'gratitude-practice',
    title: 'Gratitude Practice',
    description: 'Focus on what you\'re thankful for',
    icon: '🙏',
    color: 'from-pink-500 to-pink-600',
    category: 'personal'
  },
  {
    id: 'goal-setting',
    title: 'Goal Setting',
    description: 'Plan your future and track your progress',
    icon: '🎯',
    color: 'from-red-500 to-red-600',
    category: 'personal'
  },
  {
    id: 'emotional-processing',
    title: 'Emotional Processing',
    description: 'Understand and work through your emotions',
    icon: '💭',
    color: 'from-indigo-500 to-indigo-600',
    category: 'personal'
  },
  {
    id: 'decision-making',
    title: 'Decision Making',
    description: 'Think through important decisions systematically',
    icon: '⚖️',
    color: 'from-teal-500 to-teal-600',
    category: 'professional'
  },
  {
    id: 'skill-development',
    title: 'Skill Development',
    description: 'Track your progress in developing new skills',
    icon: '🚀',
    color: 'from-cyan-500 to-cyan-600',
    category: 'professional'
  },
  {
    id: 'relationship-reflection',
    title: 'Relationship Reflection',
    description: 'Reflect on your relationships and interactions',
    icon: '❤️',
    color: 'from-rose-500 to-rose-600',
    category: 'personal'
  },
  {
    id: 'career-planning',
    title: 'Career Planning',
    description: 'Plan and reflect on your career development',
    icon: '💼',
    color: 'from-slate-500 to-slate-600',
    category: 'professional'
  },
  {
    id: 'mindfulness-practice',
    title: 'Mindfulness Practice',
    description: 'Practice present-moment awareness and meditation',
    icon: '🧘',
    color: 'from-emerald-500 to-emerald-600',
    category: 'personal'
  }
];

async function addTopicsForNewUser(userId, userName = 'New User') {
  try {
    console.log(`📚 Adding initial topics for user: ${userName} (${userId})\n`);
    console.log('⚠️  NOTE: This is for manual topic addition. New users start empty by default.\n');

    const addedTopics = [];
    const failedTopics = [];

    for (const topic of initialTopics) {
      const userTopic = {
        userId: userId,
        topicId: topic.id,
        title: topic.title,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        category: topic.category,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await docClient.send(new PutCommand({
          TableName: process.env.DYNAMODB_TOPICS_TABLE || 'diary-topics',
          Item: userTopic,
        }));
        addedTopics.push(topic.title);
        console.log(`✅ Added: ${topic.title}`);
      } catch (error) {
        failedTopics.push({ title: topic.title, error: error.message });
        console.log(`❌ Failed to add ${topic.title}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Topics setup completed for ${userName}!`);
    console.log(`📊 Successfully added: ${addedTopics.length} topics`);
    
    if (failedTopics.length > 0) {
      console.log(`⚠️  Failed to add: ${failedTopics.length} topics`);
      failedTopics.forEach(failed => {
        console.log(`   - ${failed.title}: ${failed.error}`);
      });
    }

    // Show summary by category
    const categoryCounts = {};
    addedTopics.forEach(title => {
      const topic = initialTopics.find(t => t.title === title);
      if (topic) {
        categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
      }
    });

    console.log('\n📋 Topics by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} topics`);
    });

    return {
      success: true,
      addedCount: addedTopics.length,
      failedCount: failedTopics.length,
      addedTopics,
      failedTopics
    };

  } catch (error) {
    console.error('❌ Error adding topics for new user:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the function for use in other scripts
module.exports = { addTopicsForNewUser, initialTopics };

// If run directly, use command line arguments
if (require.main === module) {
  const userId = process.argv[2];
  const userName = process.argv[3] || 'New User';

  if (!userId) {
    console.log('❌ Please provide a user ID');
    console.log('Usage: node scripts/add-topics-for-new-user.js <userId> [userName]');
    console.log('Example: node scripts/add-topics-for-new-user.js user-456 "John Doe"');
    process.exit(1);
  }

  addTopicsForNewUser(userId, userName);
}
