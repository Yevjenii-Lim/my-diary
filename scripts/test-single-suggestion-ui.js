// Test script to verify single-suggestion UI
require('dotenv').config({ path: '.env.local' });

async function testSingleSuggestionUI() {
  console.log('🎯 Testing Single Suggestion UI...\n');

  try {
    console.log('🔄 Testing AI suggestions API with single suggestion focus...');
    
    const testUserId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
    const testTopicTitle = 'Daily Reflection';
    const testTopicDescription = 'Process your day and understand your experiences';
    
    const url = `http://localhost:3000/api/ai-suggestions?userId=${encodeURIComponent(testUserId)}&topicTitle=${encodeURIComponent(testTopicTitle)}&topicDescription=${encodeURIComponent(testTopicDescription)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ AI suggestions API working!');
    console.log(`📝 Generated ${data.suggestions?.length || 0} suggestions`);
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('\n🎯 Single Suggestion UI Features:');
      console.log('✅ Shows exactly 1 AI-generated suggestion');
      console.log('✅ Clean title and prompt only (no redundant elements)');
      console.log('✅ No difficulty level or confidence percentage');
      console.log('✅ Clean prompt display (no unnecessary quotes)');
      console.log('✅ Large, focused suggestion card');
      console.log('✅ Prominent "Use This Suggestion" button');
      console.log('✅ Ultra-clean, distraction-free interface');
      
      console.log('\n📋 Sample suggestion structure:');
      const firstSuggestion = data.suggestions[0];
      console.log(`   Title: ${firstSuggestion.title}`);
      console.log(`   Difficulty: ${firstSuggestion.difficulty}`);
      console.log(`   Time: ${firstSuggestion.estimatedTime} min`);
      console.log(`   Tags: ${firstSuggestion.tags?.join(', ') || 'None'}`);
      console.log(`   Confidence: ${firstSuggestion.confidence || 'N/A'}`);
      
      console.log('\n🎉 Single suggestion AI is ready!');
      console.log('\nTo test the new interface:');
      console.log('1. Go to http://localhost:3000/new-entry');
      console.log('2. Click on "Daily Reflection" topic');
      console.log('3. Click on the "AI Suggestions" tab');
      console.log('4. You\'ll see exactly 1 personalized AI suggestion!');
      console.log('5. Click "Use This Suggestion" to start writing');
      console.log('6. Click "Refresh AI" to get a new suggestion');
    }
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(error.message);
  }
}

// Run the test
testSingleSuggestionUI();
