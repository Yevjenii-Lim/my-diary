# AWS Amplify IAM Role Setup Guide

## 🔐 **Why Use IAM Roles Instead of Hardcoded Credentials?**

- **Security**: No hardcoded AWS credentials in your code
- **Best Practice**: Follows AWS security recommendations
- **Automatic Rotation**: IAM roles handle credential management
- **Least Privilege**: Grant only necessary permissions

## 📋 **Step-by-Step Setup**

### **1. Create IAM Policy**

1. Go to **AWS IAM Console** → **Policies** → **Create Policy**
2. Choose **JSON** tab
3. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/diary-users",
        "arn:aws:dynamodb:us-east-1:*:table/diary-users/index/*",
        "arn:aws:dynamodb:us-east-1:*:table/diary-topics",
        "arn:aws:dynamodb:us-east-1:*:table/diary-topics/index/*",
        "arn:aws:dynamodb:us-east-1:*:table/diary-entries",
        "arn:aws:dynamodb:us-east-1:*:table/diary-entries/index/*"
      ]
    }
  ]
}
```

4. Name it: `DiaryAppDynamoDBPolicy`
5. Click **Create Policy**

### **2. Create IAM Role**

1. Go to **AWS IAM Console** → **Roles** → **Create Role**
2. Select **AWS Service** → **Lambda** (Amplify uses Lambda functions)
3. Click **Next**
4. Search for and select the policy you just created: `DiaryAppDynamoDBPolicy`
5. Click **Next**
6. Name: `DiaryAppAmplifyRole`
7. Description: `IAM role for Diary App Amplify deployment`
8. Click **Create Role**

### **3. Configure Amplify to Use IAM Role**

1. Go to **AWS Amplify Console** → Your app
2. **App settings** → **General**
3. Scroll down to **Service role**
4. Click **Edit**
5. Select the role you created: `DiaryAppAmplifyRole`
6. Click **Save**

### **4. Update Environment Variables**

In Amplify Console → **App settings** → **Environment variables**:

**Remove these (no longer needed):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**Keep these:**
- `AWS_REGION=us-east-1`
- `DYNAMODB_USERS_TABLE=diary-users`
- `DYNAMODB_TOPICS_TABLE=diary-topics`
- `DYNAMODB_ENTRIES_TABLE=diary-entries`
- `OPENAI_API_KEY=your-openai-key`
- `NEXTAUTH_URL=https://your-amplify-domain.amplifyapp.com`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id`
- `GOOGLE_CLIENT_SECRET=your-google-client-secret`

### **5. Update Google OAuth Redirect URIs**

In **Google Cloud Console** → **OAuth 2.0 Client IDs**:

Add your Amplify domain:
```
https://your-amplify-domain.amplifyapp.com/api/auth/google/callback
```

## 🔄 **Redeploy Your App**

1. In Amplify Console, trigger a new deployment
2. The app will now use IAM roles instead of hardcoded credentials

## ✅ **Verification**

After deployment, check the logs for:
- ✅ No credential-related errors
- ✅ Successful DynamoDB operations
- ✅ Proper IAM role usage

## 🚨 **Troubleshooting**

### **If you get "Access Denied" errors:**

1. **Check IAM Role**: Ensure the role is attached to your Amplify app
2. **Verify Policy**: Make sure the policy includes all necessary DynamoDB permissions
3. **Check Table Names**: Ensure table names in the policy match your actual DynamoDB tables
4. **Region**: Verify the region in the policy matches your DynamoDB tables

### **If you get "Role not found" errors:**

1. **Role Name**: Double-check the role name in Amplify settings
2. **Role ARN**: Ensure you're using the correct role ARN
3. **Permissions**: Verify the role has the necessary trust relationship

## 📝 **Code Changes Made**

The code has been updated to:
- Use IAM roles in production (`NODE_ENV === 'production'`)
- Fall back to credentials for local development
- Remove hardcoded credentials from deployment

This ensures your app works both locally and in production securely!
