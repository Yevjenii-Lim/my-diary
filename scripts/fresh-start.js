const http = require('http');

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

    const req = http.request(url, options, (res) => {
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

async function freshStart() {
  try {
    console.log('🧹 Starting fresh database setup...');
    
    // Step 1: Get current state
    console.log('\n📊 Step 1: Checking current database state...');
    const topicsResponse = await makeRequest(`${BASE_URL}/api/topics/stats?userId=${USER_ID}`);
    console.log('Current topics:', topicsResponse.data);
    
    // Step 2: Clear all entries (we'll need to do this manually for now)
    console.log('\n🗑️ Step 2: Database cleanup required...');
    console.log('To start completely fresh, you need to:');
    console.log('1. Go to AWS DynamoDB Console');
    console.log('2. Delete the "diary-entries" table');
    console.log('3. Delete the "diary-topics" table');
    console.log('4. Delete the "diary-users" table');
    console.log('5. Run the setup script to recreate everything');
    
    // Step 3: Show what will be recreated
    console.log('\n🔄 Step 3: What will be recreated:');
    console.log('- Clean database tables with proper encryption structure');
    console.log('- Fresh user registration with proper encryption keys');
    console.log('- New topics with clean data');
    console.log('- New entries with working encryption/decryption');
    
    console.log('\n✅ Fresh start plan ready!');
    console.log('After clearing the database, run: npm run setup-db');
    
  } catch (error) {
    console.error('❌ Error during fresh start planning:', error);
  }
}

// Run fresh start if this script is executed directly
if (require.main === module) {
  freshStart();
}

module.exports = { freshStart };
