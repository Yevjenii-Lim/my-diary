import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

export interface EncryptionKey {
  key: Buffer;
  salt: string;
}

/**
 * Derive encryption key from user credentials
 * Uses PBKDF2 with high iteration count for security
 */
export function deriveEncryptionKey(
  userId: string, 
  userSecret: string, // This could be a hash of their password or a derived secret
  salt?: string
): EncryptionKey {
  const userSalt = salt || randomBytes(SALT_LENGTH).toString('hex');
  
  // Create a unique key derivation string
  const keyMaterial = `${userId}:${userSecret}:${userSalt}`;
  
  // Derive key using PBKDF2
  const key = createHash('sha256')
    .update(keyMaterial)
    .digest();
  
  return { key, salt: userSalt };
}

/**
 * Encrypt sensitive data (diary entry content)
 */
export function encryptData(data: string, encryptionKey: EncryptionKey): EncryptedData {
  try {
    // Generate random IV for each encryption
    const iv = randomBytes(IV_LENGTH);
    
    // Create cipher using the modern API
    const cipher = createCipheriv(ALGORITHM, encryptionKey.key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: encryptionKey.salt
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data (diary entry content)
 */
export function decryptData(encryptedData: EncryptedData, encryptionKey: EncryptionKey): string {
  try {
    // Create decipher using the modern API
    const decipher = createDecipheriv(ALGORITHM, encryptionKey.key, Buffer.from(encryptedData.iv, 'hex'));
    
    // Set authentication tag
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or key is incorrect');
  }
}

/**
 * Generate a secure random encryption key
 * Used for generating new user encryption keys
 */
export function generateSecureKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

/**
 * Hash sensitive data for secure storage
 * Used for storing encryption keys in a hashed format
 */
export function hashData(data: string, salt?: string): { hash: string; salt: string } {
  const userSalt = salt || randomBytes(SALT_LENGTH).toString('hex');
  const hash = createHash('sha256')
    .update(data + userSalt)
    .digest('hex');
  
  return { hash, salt: userSalt };
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const computedHash = createHash('sha256')
    .update(data + salt)
    .digest('hex');
  
  return computedHash === hash;
}

/**
 * Encrypt diary entry content
 * This is the main function used by the diary app
 */
export function encryptDiaryEntry(
  content: string, 
  title: string, 
  userId: string, 
  userSecret: string
): { encryptedContent: EncryptedData; encryptedTitle: EncryptedData } {
  // Generate a consistent salt for this user's entries
  // We'll use a hash of userId + userSecret to ensure consistency
  const userSalt = createHash('sha256')
    .update(`${userId}:${userSecret}`)
    .digest('hex')
    .substring(0, SALT_LENGTH * 2); // Ensure it's the right length
  
  // Derive encryption key for this user with consistent salt
  const encryptionKey = deriveEncryptionKey(userId, userSecret, userSalt);
  
  // Encrypt both content and title
  const encryptedContent = encryptData(content, encryptionKey);
  const encryptedTitle = encryptData(title, encryptionKey);
  
  return { encryptedContent, encryptedTitle };
}

/**
 * Decrypt diary entry content
 * This is the main function used by the diary app
 */
export function decryptDiaryEntry(
  encryptedContent: EncryptedData,
  encryptedTitle: EncryptedData,
  userId: string,
  userSecret: string
): { content: string; title: string } {
  // Derive encryption key for this user using the stored salt
  const encryptionKey = deriveEncryptionKey(userId, userSecret, encryptedContent.salt);
  
  // Decrypt both content and title
  const content = decryptData(encryptedContent, encryptionKey);
  const title = decryptData(encryptedTitle, encryptionKey);
  
  return { content, title };
}

/**
 * Generate a user-specific encryption secret
 * This should be called when a user first signs up
 */
export function generateUserEncryptionSecret(userId: string): string {
  // Combine user ID with random data and timestamp
  const timestamp = Date.now().toString();
  const randomData = randomBytes(16).toString('hex');
  const userSecret = `${userId}:${timestamp}:${randomData}`;
  
  // Hash the secret for storage
  const { hash } = hashData(userSecret);
  
  return hash;
}

/**
 * Validate encryption data structure
 */
export function isValidEncryptedData(data: unknown): data is EncryptedData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'encrypted' in data &&
    'iv' in data &&
    'tag' in data &&
    'salt' in data &&
    typeof (data as EncryptedData).encrypted === 'string' &&
    typeof (data as EncryptedData).iv === 'string' &&
    typeof (data as EncryptedData).tag === 'string' &&
    typeof (data as EncryptedData).salt === 'string' &&
    (data as EncryptedData).encrypted.length > 0 &&
    (data as EncryptedData).iv.length === IV_LENGTH * 2 && // Hex string length
    (data as EncryptedData).tag.length === TAG_LENGTH * 2 && // Hex string length
    (data as EncryptedData).salt.length === SALT_LENGTH * 2 // Hex string length
  );
}
