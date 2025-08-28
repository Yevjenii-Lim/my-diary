'use client';

import { useState } from 'react';
import Link from 'next/link';
import { writingGoals, getGoalsByCategory } from '@/data/writingGoals';
import { WritingGoal, UserGoal } from '@/types/goals';

// Mock user goals data - in a real app, this would come from a database
const mockUserGoals: UserGoal[] = [
  {
    id: '1',
    goalId: 'daily-reflection',
    userId: 'user1',
    title: 'Daily Reflection Practice',
    description: 'Write daily reflections to improve self-awareness',
    targetDate: new Date('2025-03-01'),
    completed: false,
    progress: 65,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-15')
  },
  {
    id: '2',
    goalId: 'creative-writing',
    userId: 'user1',
    title: 'Creative Writing Development',
    description: 'Develop creative writing skills through regular practice',
    targetDate: new Date('2025-06-01'),
    completed: false,
    progress: 30,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-10')
  }
];

export default function GoalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userGoals, setUserGoals] = useState<UserGoal[]>(mockUserGoals);

  const categories = [
    { id: 'all', name: 'All Goals', color: 'from-gray-500 to-gray-600' },
    { id: 'reflection', name: 'Reflection', color: 'from-blue-500 to-blue-600' },
    { id: 'creativity', name: 'Creativity', color: 'from-purple-500 to-purple-600' },
    { id: 'learning', name: 'Learning', color: 'from-orange-500 to-orange-600' },
    { id: 'personal', name: 'Personal', color: 'from-pink-500 to-pink-600' },
    { id: 'professional', name: 'Professional', color: 'from-teal-500 to-teal-600' }
  ];

  const filteredGoals = selectedCategory === 'all' 
    ? writingGoals 
    : getGoalsByCategory(selectedCategory as any);

  const getUserGoal = (goalId: string) => {
    return userGoals.find(ug => ug.goalId === goalId);
  };

  const addUserGoal = (goal: WritingGoal) => {
    const newUserGoal: UserGoal = {
      id: Date.now().toString(),
      goalId: goal.id,
      userId: 'user1',
      title: goal.title,
      description: goal.description,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      completed: false,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setUserGoals([...userGoals, newUserGoal]);
  };

  const removeUserGoal = (goalId: string) => {
    setUserGoals(userGoals.filter(ug => ug.goalId !== goalId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-playfair font-bold text-gray-900">
                My Diary
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/new-entry"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                New Entry
              </Link>
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Your Writing Goals
          </h1>
          <p className="text-xl text-gray-600">
            Track your progress and discover new writing objectives
          </p>
        </div>

        {/* Active Goals Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Active Goals</h2>
          {userGoals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-4">You haven't set any goals yet.</p>
              <p className="text-sm text-gray-500">Choose from the available goals below to get started.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userGoals.map((userGoal) => {
                const goal = writingGoals.find(g => g.id === userGoal.goalId);
                if (!goal) return null;
                
                return (
                  <div key={userGoal.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{goal.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{userGoal.title}</h3>
                        <p className="text-sm text-gray-600">{userGoal.description}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{userGoal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${goal.color}`}
                          style={{ width: `${userGoal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => removeUserGoal(userGoal.goalId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                      <Link
                        href="/new-entry"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Write Entry
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Goals Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Goals</h2>
          
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const isActive = userGoals.some(ug => ug.goalId === goal.id);
              
              return (
                <div key={goal.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">{goal.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {goal.category}
                    </span>
                    {isActive ? (
                      <span className="text-green-600 text-sm font-medium">Active</span>
                    ) : (
                      <button
                        onClick={() => addUserGoal(goal)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Add Goal
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
