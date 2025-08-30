// Test script to verify AI suggestions API endpoint
require('dotenv').config({ path: '.env.local' });

async function testAISuggestionsAPI() {
  console.log('🤖 Testing AI Suggestions API Endpoint...\n');

  // Test data
  const testUserId = '34d864b8-40c1-709c-5019-07bba93a5ec5'; // Your test user ID
  const testTopicTitle = 'Daily Reflection';
  const testTopicDescription = 'Process your day and understand your experiences';

  try {
    console.log('🔄 Testing AI suggestions API...');
    
    const url = `http://localhost:3000/api/ai-suggestions?userId=${encodeURIComponent(testUserId)}&topicTitle=${encodeURIComponent(testTopicTitle)}&topicDescription=${encodeURIComponent(testTopicDescription)}`;
    
    console.log(`📡 Making request to: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ AI suggestions API call successful!');
    console.log(`📝 Generated ${data.suggestions?.length || 0} suggestions`);
    console.log(`⏰ Generated at: ${data.generatedAt}`);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('\n📋 Sample suggestions:');
      data.suggestions.slice(0, 2).forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.title}`);
        console.log(`   Difficulty: ${suggestion.difficulty}`);
        console.log(`   Time: ${suggestion.estimatedTime} min`);
        console.log(`   Tags: ${suggestion.tags?.join(', ') || 'None'}`);
        console.log(`   Confidence: ${suggestion.confidence || 'N/A'}`);
        console.log(`   Prompt: "${(suggestion.prompt || '').substring(0, 100)}..."`);
      });
    }
    
    console.log('\n🎉 AI suggestions API is working perfectly!');
    console.log('\nYou can now test the full feature:');
    console.log('1. Go to http://localhost:3000/new-entry');
    console.log('2. Click on any topic');
    console.log('3. Click on the "AI Suggestions" tab');
    console.log('4. See personalized AI-generated writing suggestions!');

  } catch (error) {
    console.log('❌ AI suggestions API test failed:');
    console.log(error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   npm run dev');
    } else if (error.message.includes('500')) {
      console.log('\n💡 Check the server logs for more details.');
    }
  }
}

// Run the test
testAISuggestionsAPI();
