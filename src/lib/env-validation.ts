// Environment variable validation utility
export function validateEnvironmentVariables() {
  const requiredVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('🔍 Current environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    return false;
  }

  
  return true;
}

// Validate environment variables on module load
if (typeof window === 'undefined') {
  // Server-side only
  validateEnvironmentVariables();
}
