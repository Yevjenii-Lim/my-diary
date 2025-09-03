const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3000';
const USER_ID = '34d864b8-40c1-709c-5019-07bba93a5ec5';

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function cleanupOldEntries() {
  try {
    console.log('🧹 Starting cleanup of old entries via API...');
    
    // First, get all topics to see what entries exist
    const topicsResponse = await makeRequest(`${BASE_URL}/api/topics/stats?userId=${USER_ID}`);
    console.log('📊 Topics found:', topicsResponse.data);
    
    if (topicsResponse.data.topics) {
      for (const topic of topicsResponse.data.topics) {
        console.log(`\n🔍 Processing topic: ${topic.title} (${topic.entryCount} entries)`);
        
        if (topic.entryCount > 0) {
          // Get entries for this topic
          const entriesResponse = await makeRequest(`${BASE_URL}/api/entries/topic/${topic.topicId}?userId=${USER_ID}`);
          
          if (entriesResponse.data.entries && entriesResponse.data.entries.length > 0) {
            console.log(`📝 Found ${entriesResponse.data.entries.length} entries for topic ${topic.title}`);
            
            // Delete each entry
            for (const entry of entriesResponse.data.entries) {
              try {
                console.log(`🗑️ Attempting to delete entry: ${entry.id}`);
                
                // Note: We don't have a DELETE endpoint for individual entries yet
                // For now, we'll just log what we found
                console.log(`   - Entry ID: ${entry.id}`);
                console.log(`   - Title: ${entry.title}`);
                console.log(`   - Created: ${entry.createdAt}`);
              } catch (error) {
                console.error(`❌ Error processing entry ${entry.id}:`, error.message);
              }
            }
          } else {
            console.log(`ℹ️ No entries found for topic ${topic.title}`);
          }
        }
      }
    }
    
    console.log('\n✅ Cleanup analysis complete!');
    console.log('📋 To actually delete entries, you can:');
    console.log('   1. Use the DynamoDB console to delete the diary-entries table');
    console.log('   2. Or create a DELETE endpoint in the API');
    console.log('   3. Or manually delete entries through the UI');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldEntries();
}

module.exports = { cleanupOldEntries };

