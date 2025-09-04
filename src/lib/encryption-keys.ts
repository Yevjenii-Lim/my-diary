import { createHash, randomBytes } from 'crypto';

// In-memory cache for encryption keys (for development)
// In production, this should be replaced with a secure key management service
const encryptionKeyCache = new Map<string, string>();

/**
 * Generate a deterministic encryption secret for a user
 * This should be called when a user first signs up
 * The key is deterministic - same userId always generates same key
 */
export function generateUserEncryptionSecret(userId: string): string {
  // Use only userId to generate a deterministic key
  // This ensures the same user always gets the same encryption key
  const userSecret = `user_${userId}_encryption_key_2024`;
  
  return userSecret;
}

/**
 * Store user's encryption secret securely
 * In production, this should use AWS KMS or similar service
 */
export async function storeUserEncryptionSecret(userId: string, encryptionSecret: string): Promise<void> {
  try {
    // Hash the secret before storing (not used in current implementation)
    // const hashedSecret = createHash('sha256').update(encryptionSecret).digest('hex');
    
    // Store in database (this would need to be implemented in the User model)
    // For now, we'll use the in-memory cache
    encryptionKeyCache.set(userId, encryptionSecret);
    
    console.log(`🔐 Encryption secret stored for user: ${userId}`);
  } catch (error) {
    console.error('Failed to store encryption secret:', error);
    throw new Error('Failed to store encryption secret');
  }
}

/**
 * Retrieve user's encryption secret
 * In production, this should use AWS KMS or similar service
 */
export async function getUserEncryptionSecret(userId: string): Promise<string> {
  try {
    // Check cache first
    if (encryptionKeyCache.has(userId)) {
      return encryptionKeyCache.get(userId)!;
    }
    
    // Generate a deterministic secret if not found
    // Since the key is deterministic, this is safe
    console.log(`🔐 Generating deterministic encryption secret for user: ${userId}`);
    const newSecret = generateUserEncryptionSecret(userId);
    await storeUserEncryptionSecret(userId, newSecret);
    
    return newSecret;
  } catch (error) {
    console.error('Failed to retrieve encryption secret:', error);
    throw new Error('Failed to retrieve encryption secret');
  }
}

/**
 * Initialize encryption for a new user
 * This should be called during user registration
 */
export async function initializeUserEncryption(userId: string): Promise<string> {
  try {
    console.log(`🔐 Starting encryption initialization for user: ${userId}`);
    
    // Generate a new encryption secret
    const encryptionSecret = generateUserEncryptionSecret(userId);
    console.log(`✅ Generated encryption secret for user: ${userId}`);
    
    // Store the encryption secret
    await storeUserEncryptionSecret(userId, encryptionSecret);
    console.log(`✅ Stored encryption secret for user: ${userId}`);
    
    console.log(`🎉 Encryption initialization completed for user: ${userId}`);
    return encryptionSecret;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to initialize encryption for user ${userId}:`, error);
    throw new Error(`Failed to initialize user encryption: ${errorMessage}`);
  }
}

/**
 * Clear encryption secret from cache (for logout)
 */
export function clearUserEncryptionSecret(userId: string): void {
  encryptionKeyCache.delete(userId);
  console.log(`🔓 Encryption secret cleared for user: ${userId}`);
}

/**
 * Check if user has encryption initialized
 */
export function hasUserEncryption(userId: string): boolean {
  return encryptionKeyCache.has(userId);
}

/**
 * Get encryption status for debugging
 */
export function getEncryptionStatus(): { totalUsers: number; cachedKeys: number; users: string[] } {
  return {
    totalUsers: 0, // This would be the actual user count from database
    cachedKeys: encryptionKeyCache.size,
    users: Array.from(encryptionKeyCache.keys())
  };
}

/**
 * Validate that a user's encryption is properly set up
 */
export function validateUserEncryption(userId: string): { isValid: boolean; hasKey: boolean; message: string } {
  const hasKey = encryptionKeyCache.has(userId);
  
  if (!hasKey) {
    return {
      isValid: false,
      hasKey: false,
      message: `User ${userId} does not have encryption initialized`
    };
  }
  
  const key = encryptionKeyCache.get(userId);
  if (!key || key.length < 32) {
    return {
      isValid: false,
      hasKey: true,
      message: `User ${userId} has invalid encryption key`
    };
  }
  
  return {
    isValid: true,
    hasKey: true,
    message: `User ${userId} has valid encryption setup`
  };
}
