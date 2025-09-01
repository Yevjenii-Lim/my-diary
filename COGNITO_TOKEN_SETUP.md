# Cognito Token Validity Setup Guide

## Current Issue
Users are experiencing `NotAuthorizedException: Access Token has expired` errors because the default Cognito token validity is too short (typically 1 hour for access tokens).

## Solution: Extend Token Validity

### Option 1: AWS Console (Recommended)

1. **Go to AWS Cognito Console**
   - Navigate to: https://console.aws.amazon.com/cognito/
   - Select your region (us-east-1)

2. **Find Your User Pool**
   - Click on "User pools" in the left sidebar
   - Find and click on your user pool: `us-east-1_99OpnsijO`

3. **Update User Pool Client**
   - Click on "App integration" tab
   - Scroll down to "App clients and analytics"
   - Click on your app client: `36vrpbi8t5liep8ahn5lao75a2`
   - Click "Edit" button

4. **Update Token Settings**
   - Scroll down to "Token validity" section
   - Update the following values:
     - **Access token**: `168` hours (7 days)
     - **ID token**: `168` hours (7 days)  
     - **Refresh token**: `30` days
   - Click "Save changes"

### Option 2: AWS CLI (If you have admin access)

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_99OpnsijO \
  --client-id 36vrpbi8t5liep8ahn5lao75a2 \
  --token-validity-units AccessToken=hours,IdToken=hours,RefreshToken=days \
  --access-token-validity 168 \
  --id-token-validity 168 \
  --refresh-token-validity 30
```

### Option 3: IAM Policy Update (For automated scripts)

If you want to use the automated script, add this policy to your AWS user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:UpdateUserPoolClient",
                "cognito-idp:DescribeUserPoolClient"
            ],
            "Resource": "arn:aws:cognito-idp:us-east-1:111491017547:userpool/us-east-1_99OpnsijO/client/36vrpbi8t5liep8ahn5lao75a2"
        }
    ]
}
```

## What This Changes

- **Access Token**: Valid for 7 days instead of 1 hour
- **ID Token**: Valid for 7 days instead of 1 hour  
- **Refresh Token**: Valid for 30 days instead of 30 days (unchanged)

## Benefits

✅ Users stay logged in for 7 days  
✅ Fewer token refresh requests  
✅ Better user experience  
✅ Reduced authentication errors  

## Client-Side Improvements

The app has also been updated with better token refresh logic:

- Automatic token refresh when expired
- Better error handling for token failures
- Automatic cleanup of invalid tokens
- Improved logging for debugging

## Testing

After updating the Cognito settings:

1. Sign out and sign back in
2. Check browser console for token refresh logs
3. Verify you stay logged in for extended periods
4. Test token refresh functionality

## Notes

- Changes take effect immediately for new tokens
- Existing tokens will still expire at their original time
- Users may need to sign out and back in to get new tokens with extended validity
