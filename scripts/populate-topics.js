const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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

async function populateTopics() {
  try {
    console.log('📚 Populating diary-topics table with initial topics...\n');
    console.log('⚠️  NOTE: New users now start with empty topics lists by default.\n');
    console.log('   This script is for adding topics to existing users only.\n');

    // First, get all users from the users table
    console.log('👥 Fetching all users...');
    const usersResponse = await docClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE || 'diary-users',
    }));

    const users = usersResponse.Items || [];
    console.log(`✅ Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found. Please create a user first using:');
      console.log('   node scripts/add-test-user.js\n');
      return;
    }

    // For each user, add all initial topics
    for (const user of users) {
      console.log(`📝 Adding topics for user: ${user.name} (${user.id})`);
      
      for (const topic of initialTopics) {
        const userTopic = {
          userId: user.id,
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
          console.log(`   ✅ Added: ${topic.title}`);
        } catch (error) {
          console.log(`   ❌ Failed to add ${topic.title}: ${error.message}`);
        }
      }
      console.log('');
    }

    console.log('🎉 Topics population completed!');
    console.log(`📊 Added ${initialTopics.length} topics for ${users.length} users`);
    console.log(`   Total topics created: ${initialTopics.length * users.length}\n`);

    // Show summary by category
    const categoryCounts = {};
    initialTopics.forEach(topic => {
      categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
    });

    console.log('📋 Topics by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} topics`);
    });

  } catch (error) {
    console.error('❌ Error populating topics:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Make sure the diary-topics table exists. Run:');
      console.log('   node scripts/setup-dynamodb.js');
    } else if (error.name === 'UnrecognizedClientException') {
      console.log('💡 AWS credentials might not be configured properly.');
    }
  }
}

// Also create a function to add topics for a specific user
async function addTopicsForUser(userId) {
  try {
    console.log(`📚 Adding topics for specific user: ${userId}\n`);

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
        console.log(`✅ Added: ${topic.title}`);
      } catch (error) {
        console.log(`❌ Failed to add ${topic.title}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Added ${initialTopics.length} topics for user ${userId}`);

  } catch (error) {
    console.error('❌ Error adding topics for user:', error.message);
  }
}

// Check if a specific user ID was provided
const userId = process.argv[2];

if (userId) {
  console.log(`🎯 Adding topics for specific user: ${userId}`);
  addTopicsForUser(userId);
} else {
  populateTopics();
}
