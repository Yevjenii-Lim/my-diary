# AWS & DynamoDB Setup Guide

## 🚀 **Step 1: AWS Account Setup**

### 1.1 Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Follow the signup process
4. **Note**: You'll need a credit card, but AWS has a free tier

### 1.2 Access AWS Console
- Sign in to [AWS Console](https://console.aws.amazon.com/)
- Make sure you're in the **us-east-1** region (top right corner)

## 🔐 **Step 2: Create IAM User**

### 2.1 Go to IAM Service
1. In AWS Console, search for "IAM"
2. Click on "IAM" service

### 2.2 Create New User
1. Click "Users" in the left sidebar
2. Click "Create user"
3. Enter username: `diary-app-user`
4. Check "Access key - Programmatic access"
5. Click "Next: Permissions"

### 2.3 Attach Permissions
1. Click "Attach policies directly"
2. Search for "DynamoDB"
3. Select "AmazonDynamoDBFullAccess" (for development)
4. Click "Next: Tags" (skip tags)
5. Click "Next: Review"
6. Click "Create user"

### 2.4 Get Access Keys
1. Click on your new user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Choose "Application running outside AWS"
5. **IMPORTANT**: Copy and save both:
   - **Access key ID**
   - **Secret access key**
6. Click "Create access key"

## ⚙️ **Step 3: Configure Your App**

### 3.1 Create Environment File
Create a `.env.local` file in your project root:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here

# DynamoDB Table Names
USERS_TABLE=diary-users
TOPICS_TABLE=diary-topics
ENTRIES_TABLE=diary-entries
```

### 3.2 Replace Placeholder Values
Replace the placeholder values with your actual AWS credentials:
- `your-access-key-id-here` → Your actual Access Key ID
- `your-secret-access-key-here` → Your actual Secret Access Key

## 🗄️ **Step 4: Create DynamoDB Tables**

### 4.1 Run Setup Script
```bash
node scripts/setup-dynamodb.js
```

This will create three tables:
- `diary-users`
- `diary-topics` 
- `diary-entries`

### 4.2 Verify Tables Created
1. Go to AWS Console
2. Search for "DynamoDB"
3. Click "Tables" in left sidebar
4. You should see your three tables

## 🧪 **Step 5: Test the Connection**

### 5.1 Add Test User
```bash
node scripts/add-test-user.js
```

### 5.2 View Users
```bash
node scripts/view-users.js
```

### 5.3 View All User Data
```bash
node scripts/view-user-data.js
```

## 🔧 **Step 6: Update Your App**

### 6.1 Replace Mock User
In `src/contexts/UserContext.tsx`, replace the mock user with real authentication:

```typescript
// Replace this mock user:
const mockUser: User = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// With real user authentication
const [user, setUser] = useState<User | null>(null);

// Add login function
const login = async (email: string, password: string) => {
  // Implement real authentication here
  // For now, you can create a user if they don't exist
  const newUser = await createUser({
    id: `user-${Date.now()}`,
    email,
    name: email.split('@')[0], // Use email prefix as name
  });
  setUser(newUser);
};
```

## 🚨 **Security Best Practices**

### For Development:
- Use the full DynamoDB access policy (as shown above)
- Keep your `.env.local` file secure
- Never commit credentials to git

### For Production:
1. **Use IAM Roles** instead of access keys
2. **Restrict permissions** to only needed tables
3. **Use AWS Secrets Manager** for credentials
4. **Enable CloudTrail** for audit logging

## 📊 **Verify Everything Works**

### Test the Complete Flow:
1. **Start your app**: `npm run dev`
2. **Go to Goals page**: Add some topics
3. **Go to New Entry page**: Create entries
4. **Check DynamoDB**: Verify data is being saved

### Expected Results:
- Users table should have your user record
- Topics table should have your selected topics
- Entries table should have your diary entries

## 🆘 **Troubleshooting**

### Common Issues:

1. **"Invalid credentials" error**
   - Check your Access Key ID and Secret Access Key
   - Make sure they're copied correctly

2. **"Table doesn't exist" error**
   - Run `node scripts/setup-dynamodb.js` again
   - Check AWS Console to verify tables exist

3. **"Region not found" error**
   - Make sure AWS_REGION is set to `us-east-1`
   - Check that you're in the right AWS region

4. **"Permission denied" error**
   - Verify your IAM user has DynamoDB permissions
   - Check that the policy is attached correctly

## 💰 **Cost Considerations**

### AWS Free Tier (First 12 months):
- **DynamoDB**: 25 GB storage, 25 WCU, 25 RCU
- **This should be more than enough for development**

### After Free Tier:
- **DynamoDB**: Pay per request and storage
- **Typical cost**: $1-5/month for small apps

## 🎉 **You're Ready!**

Once you've completed these steps, your diary app will be fully connected to DynamoDB and ready to store real user data!

