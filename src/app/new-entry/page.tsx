'use client';

import { useState } from 'react';
import Link from 'next/link';
import { writingGoals, getGoalsByCategory } from '@/data/writingGoals';
import { WritingGoal } from '@/types/goals';

export default function NewEntry() {
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            New Entry
          </h1>
          <p className="text-xl text-gray-600">
            Choose your writing goal and start developing your skills
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Goal Selection */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What's your writing goal today?
            </h2>
            
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedGoal === goal.id
                      ? `border-${goal.color.split('-')[1]}-500 bg-gradient-to-r ${goal.color} text-white shadow-lg`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{goal.icon}</span>
                    <h3 className={`font-semibold ${
                      selectedGoal === goal.id ? 'text-white' : 'text-gray-900'
                    }`}>
                      {goal.title}
                    </h3>
                  </div>
                  <p className={`text-sm ${
                    selectedGoal === goal.id ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {goal.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Entry Form */}
          {selectedGoal && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Give your entry a meaningful title..."
                />
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Thoughts
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Start writing your thoughts here... Take your time to express yourself clearly and thoughtfully."
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {content.length} characters
                </div>
                <div className="space-x-4">
                  <Link
                    href="/"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
