# 🔐 Manual Setup Guide for New Encrypted Entries Table

## 🚀 **Step 1: Create New Table in AWS DynamoDB Console**

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Click **"Create table"**
3. Fill in the details:

### **Table Details:**
- **Table name**: `diary-entries-encrypted`
- **Partition key**: `userId` (String)
- **Sort key**: `entryId` (String)

### **Table Settings:**
- **Capacity mode**: On-demand (recommended for development)

### **Global Secondary Index (GSI):**
- **Index name**: `TopicEntriesIndex`
- **Partition key**: `topicId` (String)
- **Sort key**: `userId` (String)
- **Projection type**: All

## 🔧 **Step 2: Update Environment Variables**

Make sure your `.env.local` has the correct AWS credentials:

```bash
AWS_REGION=us-east-1  # or your preferred region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## 🧪 **Step 3: Test the New System**

1. **Restart your Next.js development server**
2. **Create a new entry** - it will automatically use the new encrypted table
3. **Check the logs** - you should see encryption working properly

## 📊 **What This Gives You:**

✅ **Clean, working encryption** from the start  
✅ **No corrupted data** from old entries  
✅ **Proper table structure** with GSI for efficient queries  
✅ **Fresh start** with working encryption/decryption  

## 🗑️ **Old Table Cleanup (Optional):**

After confirming the new system works:
1. Go to DynamoDB Console
2. Delete the old `diary-entries` table
3. All new data will be in `diary-entries-encrypted`

## 🔍 **Verification:**

The new system will:
- Create entries with proper encryption
- Store them in `diary-entries-encrypted` table
- Use the new `dynamodb-encrypted.ts` library
- Skip the old corrupted data entirely

---

**Ready to test?** After creating the table, restart your server and try creating a new entry!
