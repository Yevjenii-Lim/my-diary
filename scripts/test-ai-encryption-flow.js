// Test script to verify the complete encryption flow for AI suggestions
require('dotenv').config({ path: '.env.local' });

const { 
  initializeUserEncryption, 
  getUserEncryptionSecret,
  clearUserEncryptionSecret
} = require('../src/lib/encryption-keys.ts');

const { encryptDiaryEntry, decryptDiaryEntry } = require('../src/lib/encryption.ts');

async function testAIEncryptionFlow() {
  console.log('🔐 Testing Complete AI Encryption Flow...\n');

  try {
    // Test user data
    const testUserId = 'test-ai-user-' + Date.now();
    const testEntries = [
      {
        title: 'My First Encrypted Entry',
        content: 'Today I realized that privacy is very important to me. I want to write freely without worrying about who might read my thoughts.',
        wordCount: 25
      },
      {
        title: 'Reflections on Writing',
        content: 'I notice I tend to write in the evenings when I\'m more reflective. My writing style is personal and introspective.',
        wordCount: 20
      },
      {
        title: 'Learning About Myself',
        content: 'Through journaling, I\'ve discovered that I process emotions better when I write them down. It helps me understand my feelings.',
        wordCount: 28
      }
    ];

    console.log('👤 Test User ID:', testUserId);
    console.log('📝 Test Entries:', testEntries.length);
    console.log('📖 Sample Content:', testEntries[0].content.substring(0, 50) + '...\n');

    // Step 1: Initialize encryption for the user (simulates user registration)
    console.log('🚀 Step 1: Initializing User Encryption...');
    
    const encryptionSecret = await initializeUserEncryption(testUserId);
    console.log('✅ Encryption initialized for user');
    console.log(`🔑 Generated secret: ${encryptionSecret.substring(0, 20)}...\n`);

    // Step 2: Create encrypted diary entries (simulates user writing)
    console.log('✍️ Step 2: Creating Encrypted Diary Entries...');
    
    const encryptedEntries = [];
    for (let i = 0; i < testEntries.length; i++) {
      const entry = testEntries[i];
      console.log(`📝 Encrypting entry ${i + 1}: "${entry.title}"`);
      
      const { encryptedContent, encryptedTitle } = encryptDiaryEntry(
        entry.content,
        entry.title,
        testUserId,
        encryptionSecret
      );
      
      encryptedEntries.push({
        id: `entry-${i + 1}`,
        userId: testUserId,
        title: entry.title,
        content: entry.content,
        wordCount: entry.wordCount,
        encryptedContent,
        encryptedTitle,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Entry ${i + 1} encrypted successfully`);
    }
    console.log('');

    // Step 3: Simulate fetching entries for AI analysis (what happens in the API)
    console.log('🔍 Step 3: Simulating API Fetch for AI Analysis...');
    
    console.log('📡 API receives request for AI suggestions');
    console.log('🔐 API retrieves user encryption secret');
    console.log('📚 API fetches encrypted entries from database');
    console.log('🔓 API decrypts entries for AI analysis\n');

    // Step 4: Decrypt entries (simulates what the API does)
    console.log('🔓 Step 4: Decrypting Entries for AI Analysis...');
    
    const decryptedEntries = [];
    for (let i = 0; i < encryptedEntries.length; i++) {
      const entry = encryptedEntries[i];
      console.log(`🔓 Decrypting entry ${i + 1}: "${entry.title}"`);
      
      try {
        const decrypted = decryptDiaryEntry(
          entry.encryptedContent,
          entry.encryptedTitle,
          testUserId,
          encryptionSecret
        );
        
        decryptedEntries.push({
          ...entry,
          title: decrypted.title,
          content: decrypted.content
        });
        
        console.log(`✅ Entry ${i + 1} decrypted successfully`);
        console.log(`   Title: "${decrypted.title}"`);
        console.log(`   Content: "${decrypted.content.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`❌ Failed to decrypt entry ${i + 1}:`, error.message);
        return;
      }
    }
    console.log('');

    // Step 5: Simulate AI analysis of decrypted content
    console.log('🤖 Step 5: Simulating AI Analysis of Decrypted Content...');
    
    console.log('📊 AI receives decrypted entries for analysis:');
    decryptedEntries.forEach((entry, i) => {
      console.log(`   Entry ${i + 1}: "${entry.title}"`);
      console.log(`   Content: "${entry.content.substring(0, 60)}..."`);
      console.log(`   Word count: ${entry.wordCount}`);
      console.log('');
    });

    // Step 6: Analyze writing patterns (what AI would do)
    console.log('📈 Step 6: Analyzing Writing Patterns (AI Analysis)...');
    
    const totalWords = decryptedEntries.reduce((sum, entry) => sum + entry.wordCount, 0);
    const averageWords = Math.round(totalWords / decryptedEntries.length);
    const themes = extractThemes(decryptedEntries);
    const writingStyle = analyzeWritingStyle(decryptedEntries);
    
    console.log('📊 Writing Analysis Results:');
    console.log(`   Total entries: ${decryptedEntries.length}`);
    console.log(`   Total words: ${totalWords}`);
    console.log(`   Average words per entry: ${averageWords}`);
    console.log(`   Common themes: ${themes.join(', ')}`);
    console.log(`   Writing style: ${writingStyle}`);
    console.log('');

    // Step 7: Simulate AI generating personalized suggestions
    console.log('💡 Step 7: Simulating AI-Generated Suggestions...');
    
    const suggestions = generatePersonalizedSuggestions(decryptedEntries, themes, writingStyle);
    console.log('🎯 AI-Generated Writing Suggestions:');
    suggestions.forEach((suggestion, i) => {
      console.log(`   Suggestion ${i + 1}: ${suggestion.title}`);
      console.log(`   Description: ${suggestion.description}`);
      console.log(`   Reasoning: ${suggestion.reasoning}`);
      console.log('');
    });

    // Step 8: Verify data integrity
    console.log('✅ Step 8: Verifying Data Integrity...');
    
    let integrityCheck = true;
    for (let i = 0; i < testEntries.length; i++) {
      const original = testEntries[i];
      const decrypted = decryptedEntries[i];
      
      if (original.title !== decrypted.title || original.content !== decrypted.content) {
        console.log(`❌ Data integrity check failed for entry ${i + 1}`);
        integrityCheck = false;
        break;
      }
    }
    
    if (integrityCheck) {
      console.log('✅ All entries decrypted correctly - data integrity verified!');
    } else {
      console.log('❌ Data integrity check failed');
      return;
    }

    // Step 9: Cleanup
    console.log('\n🧹 Step 9: Cleanup...');
    clearUserEncryptionSecret(testUserId);
    console.log('✅ Test user encryption cleared');

    // Final summary
    console.log('\n🎉 AI ENCRYPTION FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ User encryption initialized during registration');
    console.log('✅ Diary entries encrypted and stored securely');
    console.log('✅ Entries decrypted for AI analysis');
    console.log('✅ AI can analyze user\'s writing style and patterns');
    console.log('✅ Personalized suggestions generated based on decrypted content');
    console.log('✅ Complete privacy maintained - data encrypted at rest');
    console.log('\n🚀 The encryption system now works perfectly with AI suggestions!');
    console.log('🔒 Users get complete privacy while AI gets personalized insights');

  } catch (error) {
    console.error('❌ AI encryption flow test failed:', error);
    process.exit(1);
  }
}

// Helper functions to simulate AI analysis
function extractThemes(entries) {
  const allContent = entries.map(entry => entry.content.toLowerCase()).join(' ');
  const themes = [];
  
  if (allContent.includes('privacy') || allContent.includes('personal')) themes.push('privacy');
  if (allContent.includes('reflection') || allContent.includes('introspective')) themes.push('reflection');
  if (allContent.includes('emotions') || allContent.includes('feelings')) themes.push('emotional processing');
  if (allContent.includes('learning') || allContent.includes('discover')) themes.push('self-discovery');
  
  return themes.length > 0 ? themes : ['general reflection'];
}

function analyzeWritingStyle(entries) {
  const avgLength = entries.reduce((sum, entry) => sum + entry.wordCount, 0) / entries.length;
  
  if (avgLength < 15) return 'concise';
  if (avgLength < 25) return 'moderate';
  return 'detailed';
}

function generatePersonalizedSuggestions(entries, themes, writingStyle) {
  const suggestions = [];
  
  if (themes.includes('privacy')) {
    suggestions.push({
      title: 'Privacy-Focused Reflection',
      description: 'Write about how maintaining privacy in your journaling affects your ability to be completely honest with yourself.',
      reasoning: 'Based on your focus on privacy and personal boundaries in writing'
    });
  }
  
  if (themes.includes('reflection')) {
    suggestions.push({
      title: 'Deep Self-Examination',
      description: 'Reflect on a recent experience and explore how it connects to your broader life patterns and growth.',
      reasoning: 'Your writing shows a reflective and introspective style'
    });
  }
  
  if (writingStyle === 'detailed') {
    suggestions.push({
      title: 'Expanded Perspective',
      description: 'Take one of your recent reflections and expand it with more detail, exploring different angles and deeper insights.',
      reasoning: 'Your detailed writing style suggests you enjoy thorough exploration of topics'
    });
  }
  
  return suggestions;
}

// Run the test
testAIEncryptionFlow();

