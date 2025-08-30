const fs = require('fs');
const path = require('path');

console.log('🚀 Quick DynamoDB Setup Guide\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here

# DynamoDB Table Names
USERS_TABLE=diary-users
TOPICS_TABLE=diary-topics
ENTRIES_TABLE=diary-entries
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created!\n');
} else {
  console.log('✅ .env.local file already exists!\n');
}

console.log('📋 Next Steps:');
console.log('1. Get your AWS credentials:');
console.log('   - Go to AWS Console → IAM → Users');
console.log('   - Create a new user with DynamoDB permissions');
console.log('   - Get Access Key ID and Secret Access Key\n');

console.log('2. Update .env.local with your credentials:');
console.log('   - Replace "your-access-key-id-here" with your Access Key ID');
console.log('   - Replace "your-secret-access-key-here" with your Secret Access Key\n');

console.log('3. Create DynamoDB tables:');
console.log('   node scripts/setup-dynamodb.js\n');

console.log('4. Test the connection:');
console.log('   node scripts/add-test-user.js');
console.log('   node scripts/view-users.js\n');

console.log('5. Start your app:');
console.log('   npm run dev\n');

console.log('💡 Need help? Check AWS_SETUP_GUIDE.md for detailed instructions!');

