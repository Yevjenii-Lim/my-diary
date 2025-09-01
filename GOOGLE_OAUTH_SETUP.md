# Google OAuth Redirect URI Configuration Guide

## 🔍 **The Problem**

The `token_exchange_failed` error occurs because Google Cloud Console requires **exact matches** for redirect URIs, but your app uses different URLs for local development vs. production.

## 🛠️ **Solution: Configure Multiple Redirect URIs**

### **Step 1: Update Google Cloud Console**

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**
3. In the **Authorized redirect URIs** section, add **BOTH** URLs:

```
http://localhost:3000/api/auth/google/callback
https://your-amplify-domain.amplifyapp.com/api/auth/google/callback
```

4. Click **Save**

### **Step 2: Verify Environment Variables**

#### **Local Development (.env.local)**
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### **Amplify Environment Variables**
```env
NEXTAUTH_URL=https://your-amplify-domain.amplifyapp.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Step 3: Test Both Environments**

1. **Local Test**: `http://localhost:3000` → Should work with local redirect URI
2. **Amplify Test**: `https://your-amplify-domain.amplifyapp.com` → Should work with Amplify redirect URI

## 🔍 **How It Works**

Your app dynamically determines the redirect URI:

```typescript
// In GoogleOAuthButton.tsx
const currentOrigin = window.location.origin;
const redirect_uri = `${currentOrigin}/api/auth/google/callback`;
```

This means:
- **Local**: `http://localhost:3000/api/auth/google/callback`
- **Amplify**: `https://your-amplify-domain.amplifyapp.com/api/auth/google/callback`

Google Cloud Console must have **both** URIs registered to work in both environments.

## ✅ **Verification Steps**

1. **Check Google Cloud Console**: Both redirect URIs are listed
2. **Check Local Environment**: `.env.local` has `NEXTAUTH_URL=http://localhost:3000`
3. **Check Amplify Environment**: Environment variables have `NEXTAUTH_URL=https://your-amplify-domain.amplifyapp.com`
4. **Test Local**: Try Google OAuth on `localhost:3000`
5. **Test Amplify**: Try Google OAuth on your Amplify domain

## 🚨 **Common Issues**

### **"Invalid redirect_uri" Error**
- **Cause**: Redirect URI not registered in Google Cloud Console
- **Solution**: Add the exact redirect URI to Google Cloud Console

### **"token_exchange_failed" Error**
- **Cause**: Mismatch between redirect URI used and registered
- **Solution**: Ensure both local and production URIs are registered

### **"Client ID not configured" Error**
- **Cause**: Missing environment variables
- **Solution**: Check `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set

## 📝 **Important Notes**

- ✅ **Multiple URIs**: Google Cloud Console supports multiple redirect URIs
- ✅ **Exact Match**: URIs must match exactly (including protocol, domain, and path)
- ✅ **Environment Variables**: `NEXTAUTH_URL` determines the base URL for redirects
- ✅ **Dynamic Detection**: Your app automatically detects the current environment

This configuration allows your app to work seamlessly in both local development and production environments!
