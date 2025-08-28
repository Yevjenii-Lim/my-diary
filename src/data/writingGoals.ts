import { WritingGoal } from '@/types/goals';

export const writingGoals: WritingGoal[] = [
  {
    id: 'daily-reflection',
    title: 'Daily Reflection',
    description: 'Process your day and understand your experiences',
    icon: '🤔',
    color: 'from-blue-500 to-blue-600',
    category: 'reflection'
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    description: 'Explore your imagination and develop creative skills',
    icon: '✨',
    color: 'from-purple-500 to-purple-600',
    category: 'creativity'
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Work through challenges and find solutions',
    icon: '🧩',
    color: 'from-green-500 to-green-600',
    category: 'learning'
  },
  {
    id: 'learning-notes',
    title: 'Learning Notes',
    description: 'Document what you\'ve learned and insights gained',
    icon: '📚',
    color: 'from-orange-500 to-orange-600',
    category: 'learning'
  },
  {
    id: 'gratitude-practice',
    title: 'Gratitude Practice',
    description: 'Focus on what you\'re thankful for',
    icon: '🙏',
    color: 'from-pink-500 to-pink-600',
    category: 'personal'
  },
  {
    id: 'goal-setting',
    title: 'Goal Setting',
    description: 'Plan your future and track your progress',
    icon: '🎯',
    color: 'from-red-500 to-red-600',
    category: 'personal'
  },
  {
    id: 'emotional-processing',
    title: 'Emotional Processing',
    description: 'Understand and work through your emotions',
    icon: '💭',
    color: 'from-indigo-500 to-indigo-600',
    category: 'personal'
  },
  {
    id: 'decision-making',
    title: 'Decision Making',
    description: 'Think through important decisions systematically',
    icon: '⚖️',
    color: 'from-teal-500 to-teal-600',
    category: 'professional'
  },
  {
    id: 'skill-development',
    title: 'Skill Development',
    description: 'Track your progress in developing new skills',
    icon: '🚀',
    color: 'from-cyan-500 to-cyan-600',
    category: 'professional'
  },
  {
    id: 'relationship-reflection',
    title: 'Relationship Reflection',
    description: 'Reflect on your relationships and interactions',
    icon: '❤️',
    color: 'from-rose-500 to-rose-600',
    category: 'personal'
  },
  {
    id: 'career-planning',
    title: 'Career Planning',
    description: 'Plan and reflect on your career development',
    icon: '💼',
    color: 'from-slate-500 to-slate-600',
    category: 'professional'
  },
  {
    id: 'mindfulness-practice',
    title: 'Mindfulness Practice',
    description: 'Practice present-moment awareness and meditation',
    icon: '🧘',
    color: 'from-emerald-500 to-emerald-600',
    category: 'personal'
  }
];

export const getGoalsByCategory = (category: WritingGoal['category']) => {
  return writingGoals.filter(goal => goal.category === category);
};

export const getGoalById = (id: string) => {
  return writingGoals.find(goal => goal.id === id);
};
