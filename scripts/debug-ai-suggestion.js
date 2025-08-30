// Debug script to check AI suggestion data
require('dotenv').config({ path: '.env.local' });

async function debugAISuggestion() {
  const userId = '34d864b8-40c1-709c-5019-07bba93a5ec5';
  const topicTitle = 'Daily Reflection';
  const topicDescription = 'Process your day and understand your experiences';

  try {
    console.log('🔍 Debugging AI suggestion data...\n');
    
    const response = await fetch(`http://localhost:3000/api/ai-suggestions?userId=${encodeURIComponent(userId)}&topicTitle=${encodeURIComponent(topicTitle)}&topicDescription=${encodeURIComponent(topicDescription)}`);
    
    const data = await response.json();
    
    console.log('📋 Raw AI Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.suggestions && data.suggestions.length > 0) {
      console.log('\n🔍 First suggestion details:');
      const suggestion = data.suggestions[0];
      
      console.log('Title:', suggestion.title);
      console.log('Prompt:', suggestion.prompt);
      console.log('Prompt length:', suggestion.prompt?.length || 0);
      console.log('Prompt type:', typeof suggestion.prompt);
      console.log('Is prompt empty?', !suggestion.prompt);
      console.log('Is prompt null?', suggestion.prompt === null);
      console.log('Is prompt undefined?', suggestion.prompt === undefined);
      
      console.log('\n🔍 All suggestion fields:');
      Object.keys(suggestion).forEach(key => {
        console.log(`${key}:`, suggestion[key]);
      });
    } else {
      console.log('❌ No suggestions found in response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the debug
debugAISuggestion();
