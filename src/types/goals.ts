export interface WritingGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'reflection' | 'creativity' | 'learning' | 'personal' | 'professional';
}

export interface UserGoal {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description: string;
  targetDate?: Date;
  completed: boolean;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goalId: string;
  entriesCount: number;
  totalWords: number;
  averageWordsPerEntry: number;
  lastEntryDate?: Date;
  streakDays: number;
}

export interface GoalStats {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  currentStreak: number;
  longestStreak: number;
  goalsCompleted: number;
  totalGoals: number;
}
