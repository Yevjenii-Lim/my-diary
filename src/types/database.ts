import { EncryptedData } from '@/lib/encryption';

export interface User {
  id: string;
  email: string;
  name: string;
  encryptionSecret: string; // Hash of user's encryption key
  encryptionSalt: string; // Salt for encryption key derivation
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserTopic {
  id: string;
  userId: string;
  topicId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'reflection' | 'creativity' | 'learning' | 'personal' | 'professional';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  entryId: string;
  topicId: string;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  isPartiallyDecrypted?: boolean; // Flag to indicate if entry couldn't be fully decrypted
}

// New interface for encrypted diary entries
export interface EncryptedDiaryEntry {
  id: string;
  userId: string;
  entryId: string;
  topicId: string;
  encryptedTitle: EncryptedData;
  encryptedContent: EncryptedData;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicStats {
  topicId: string;
  entriesCount: number;
  totalWords: number;
  averageWordsPerEntry: number;
  lastEntryDate?: string;
  streakDays: number;
}

export interface UserStats {
  userId: string;
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  currentStreak: number;
  longestStreak: number;
  activeTopics: number;
  totalTopics: number;
}
