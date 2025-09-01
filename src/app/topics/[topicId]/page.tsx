'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { DiaryEntry, UserTopic } from '@/types/database';
import Header from '@/components/Header';

interface TopicPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

interface TopicStats {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate?: string;
  mostActiveDay?: string;
  averageEntriesPerWeek: number;
}

interface WritingSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  tags: string[];
  confidence?: number;
  reasoning?: string;
}

export default function TopicPage({ params }: TopicPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, userTopics } = useUser();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicStats, setTopicStats] = useState<TopicStats | null>(null);
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'suggestions' | 'analytics'>('overview');
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'length'>('date');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicDescription, setEditTopicDescription] = useState('');
  const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);

  const topic = userTopics.find(t => t.topicId === resolvedParams.topicId);

  // Fetch entries and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch entries
        const entriesResponse = await fetch(`/api/entries/topic/${resolvedParams.topicId}?userId=${user.id}`);
        if (entriesResponse.ok) {
          const data = await entriesResponse.json();
          setEntries(data.entries);
          
          // Calculate stats after entries are loaded
          if (data.entries.length > 0) {
            const stats = calculateTopicStats(data.entries);
            setTopicStats(stats);
          }

          // Don't generate AI suggestions automatically - let user request them
          // This prevents content from updating in front of the user
        }

      } catch (error) {
        console.error('Error fetching topic data:', error);
        setError('Failed to fetch topic data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, resolvedParams.topicId, topic]);

  // Calculate topic statistics
  const calculateTopicStats = (entries: DiaryEntry[]): TopicStats => {
    const totalEntries = entries.length;
    const totalWords = entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
    const averageWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Calculate streaks
    const sortedEntries = entries
      .map(entry => new Date(entry.createdAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentDate = new Date(sortedEntries[i]);
      currentDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(sortedEntries[i + 1]);
      nextDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        tempStreak++;
        if (i === 0 && Math.abs(currentDate.getTime() - today.getTime()) <= 24 * 60 * 60 * 1000) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate most active day
    const dayCounts = new Map<string, number>();
    entries.forEach(entry => {
      const day = new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });
    const mostActiveDay = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Calculate average entries per week
    const firstEntry = sortedEntries[sortedEntries.length - 1];
    const weeksSinceFirst = Math.max(1, Math.ceil((today.getTime() - firstEntry.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const averageEntriesPerWeek = Math.round((totalEntries / weeksSinceFirst) * 10) / 10;

    return {
      totalEntries,
      totalWords,
      averageWordsPerEntry,
      currentStreak,
      longestStreak,
      lastEntryDate: sortedEntries[0]?.toISOString(),
      mostActiveDay,
      averageEntriesPerWeek
    };
  };

  // Generate AI suggestions for this topic
  const generateTopicSuggestions = async (topic: UserTopic | undefined, entries: DiaryEntry[]): Promise<WritingSuggestion[]> => {
    if (!topic || !user) return [];

    try {
      // Call the AI suggestions API
      const response = await fetch(`/api/ai-suggestions?userId=${user.id}&topicTitle=${encodeURIComponent(topic.title)}&topicDescription=${encodeURIComponent(topic.description)}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      } else {
        console.error('Failed to fetch AI suggestions:', response.status);
        return generateFallbackSuggestions(topic);
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      return generateFallbackSuggestions(topic);
    }
  };

  // Fallback suggestions when AI is not available
  const generateFallbackSuggestions = (topic: UserTopic): WritingSuggestion[] => {
    return [
      {
        id: 'fallback-reflection',
        title: 'Deep Reflection',
        description: 'Take a deeper look at your experiences with this topic',
        prompt: `Reflect on your journey with ${topic.title.toLowerCase()}. What patterns do you notice? What has changed over time? What insights have you gained?`,
        difficulty: 'intermediate',
        estimatedTime: 20,
        tags: ['reflection', 'insights', 'patterns'],
        confidence: 0.7,
        reasoning: 'Fallback suggestion based on topic analysis'
      },
      {
        id: 'fallback-future',
        title: 'Future Vision',
        description: 'Imagine where you want to be with this topic in the future',
        prompt: `Where do you see yourself with ${topic.title.toLowerCase()} in 6 months? What would success look like? What steps can you take to get there?`,
        difficulty: 'intermediate',
        estimatedTime: 15,
        tags: ['planning', 'goals', 'future'],
        confidence: 0.7,
        reasoning: 'Fallback suggestion based on topic analysis'
      },
      {
        id: 'fallback-challenge',
        title: 'Challenge Exploration',
        description: 'Explore the challenges you face with this topic',
        prompt: `What are the biggest challenges you face with ${topic.title.toLowerCase()}? What makes them difficult? How might you approach them differently?`,
        difficulty: 'advanced',
        estimatedTime: 18,
        tags: ['challenges', 'problem-solving', 'growth'],
        confidence: 0.7,
        reasoning: 'Fallback suggestion based on topic analysis'
      }
    ];
  };

  // Handle topic update
  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic || !editTopicTitle.trim() || !editTopicDescription.trim()) return;

    setIsUpdatingTopic(true);
    try {
      const response = await fetch(`/api/topics/${topic.topicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: editTopicTitle.trim(),
          description: editTopicDescription.trim(),
        }),
      });

      if (response.ok) {
        const updatedTopic = await response.json();
        setSuccessMessage('✅ Topic updated successfully!');
        setIsEditingTopic(false);
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        setError('Failed to update topic');
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      setError('Failed to update topic');
    } finally {
      setIsUpdatingTopic(false);
    }
  };

  // Start editing topic
  const startEditingTopic = () => {
    if (topic) {
      setEditTopicTitle(topic.title);
      setEditTopicDescription(topic.description);
      setIsEditingTopic(true);
    }
  };

  // Handle new entry submission
  const handleSubmitNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEntryTitle.trim() || !newEntryContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          topicId: resolvedParams.topicId,
          title: newEntryTitle.trim(),
          content: newEntryContent.trim(),
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setEntries(prev => [newEntry.entry, ...prev]);
        setNewEntryTitle('');
        setNewEntryContent('');
        setShowNewEntryForm(false);
        setSuccessMessage('✅ Entry saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Failed to save entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort entries
  const filteredAndSortedEntries = entries
    .filter(entry => 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'length':
          return (b.wordCount || 0) - (a.wordCount || 0);
        default:
          return 0;
      }
    });

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Topic Not Found</h1>
          <Link href="/new-entry" className="text-blue-600 hover:text-blue-700">
            Back to Topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-md mx-auto transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between">
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage('')}
                className="ml-4 text-green-600 hover:text-green-800 text-lg font-bold transition-colors"
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Topic Header */}
        <div className="mb-6 sm:mb-8">
          {!isEditingTopic ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
              <div className="flex items-center">
                <span className="text-3xl sm:text-4xl mr-3 sm:mr-4">{topic.icon}</span>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900">{topic.title}</h1>
                  <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">{topic.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                  {topic.category}
                </span>
                <button
                  onClick={startEditingTopic}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                >
                  ✏️ Edit Topic
                </button>
                <Link
                  href="/new-entry"
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                >
                  ← Back to Topics
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Edit Topic</h2>
                <button
                  onClick={() => setIsEditingTopic(false)}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdateTopic} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Topic Title
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editTopicTitle}
                    onChange={(e) => setEditTopicTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                    placeholder="Enter topic title..."
                    maxLength={100}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{editTopicTitle.length}/100 characters</p>
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editTopicDescription}
                    onChange={(e) => setEditTopicDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                    placeholder="Describe what this topic is about..."
                    maxLength={300}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{editTopicDescription.length}/300 characters</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingTopic(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingTopic || !editTopicTitle.trim() || !editTopicDescription.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isUpdatingTopic ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex space-x-4 sm:space-x-6 md:space-x-8 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'entries', label: 'Entries', icon: '📝' },
              { id: 'suggestions', label: 'AI Suggestions', icon: '🤖' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            {topicStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-2xl">📝</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Entries</p>
                      <p className="text-2xl font-bold text-gray-900">{topicStats.totalEntries}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Words</p>
                      <p className="text-2xl font-bold text-gray-900">{topicStats.totalWords.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Current Streak</p>
                      <p className="text-2xl font-bold text-gray-900">{topicStats.currentStreak} days</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. Words/Entry</p>
                      <p className="text-2xl font-bold text-gray-900">{topicStats.averageWordsPerEntry}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setActiveTab('entries');
                    setShowNewEntryForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>✍️</span>
                  <span>Write New Entry</span>
                </button>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>🤖</span>
                  <span>Get AI Suggestions</span>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>📈</span>
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Entries Preview */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Entries</h2>
                <button
                  onClick={() => setActiveTab('entries')}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              {entries.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No entries yet. Start writing to see them here!</p>
              ) : (
                <div className="space-y-4">
                  {entries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{entry.title}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{entry.content}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">{entry.wordCount} words</span>
                        <Link
                          href={`/entries/${entry.id}`}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          Read Full Entry
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* New Entry Form */}
            {showNewEntryForm && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">New Entry</h2>
                </div>
                
                <form onSubmit={handleSubmitNewEntry} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newEntryTitle}
                      onChange={(e) => setNewEntryTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                      placeholder="Give your entry a title..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      id="content"
                      value={newEntryContent}
                      onChange={(e) => setNewEntryContent(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black placeholder-gray-500"
                      placeholder="Write your thoughts, reflections, or ideas..."
                      required
                    />
                    <div className="text-sm text-gray-500 mt-2">
                      {newEntryContent.length} characters • {newEntryContent.split(/\s+/).filter(word => word.length > 0).length} words
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewEntryForm(false);
                        setNewEntryTitle('');
                        setNewEntryContent('');
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !newEntryTitle.trim() || !newEntryContent.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          <span>Save Entry</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Entries Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Entries ({entries.length})</h2>
                {!showNewEntryForm && (
                  <button
                    onClick={() => setShowNewEntryForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  >
                    + New Entry
                  </button>
                )}
              </div>
              
              {/* Search and Sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="length">Sort by Length</option>
                </select>
              </div>
            </div>

            {/* Entries List */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading entries...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : filteredAndSortedEntries.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No entries match your search.' : 'No entries yet for this topic.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowNewEntryForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Write Your First Entry
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredAndSortedEntries.map((entry) => (
                  <div key={entry.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{entry.title}</h3>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base">{entry.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-500">{entry.wordCount} words</span>
                      <Link
                        href={`/entries/${entry.id}`}
                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
                      >
                        Read Full Entry →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">AI Writing Suggestions</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    if (topic) {
                      setSuggestionsLoading(true);
                      const newSuggestions = await generateTopicSuggestions(topic, entries);
                      setSuggestions(newSuggestions);
                      setSuggestionsLoading(false);
                    }
                  }}
                  disabled={suggestionsLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {suggestionsLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>New Suggestion</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {suggestionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">AI is generating personalized suggestions for you...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-6">🤖</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready for AI Suggestions?</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Get personalized writing prompts based on your writing history and this topic. 
                    Our AI analyzes your patterns to suggest relevant ideas for your next entry.
                  </p>
                  <button
                    onClick={async () => {
                      if (topic) {
                        setSuggestionsLoading(true);
                        const newSuggestions = await generateTopicSuggestions(topic, entries);
                        setSuggestions(newSuggestions);
                        setSuggestionsLoading(false);
                      }
                    }}
                    disabled={suggestionsLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-3 mx-auto"
                  >
                    {suggestionsLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating Suggestions...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate AI Suggestions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                {/* Single Suggestion Card */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900">{suggestions[0].title}</h3>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <p className="text-gray-700 text-lg italic leading-relaxed">{suggestions[0].prompt}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="text-sm text-gray-500">⏱️ {suggestions[0].estimatedTime} min</span>
                    <div className="flex space-x-2">
                      {suggestions[0].tags.map((tag) => (
                        <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Use Suggestion Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setNewEntryTitle(suggestions[0].title);
                        setNewEntryContent('');
                        setShowNewEntryForm(true);
                        setActiveTab('entries');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 text-lg"
                    >
                      <span>✍️</span>
                      <span>Use This Suggestion</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Topic Analytics</h2>
            
            {topicStats ? (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Writing Patterns */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Patterns</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average entries per week:</span>
                      <span className="font-medium text-gray-900">{topicStats.averageEntriesPerWeek}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most active day:</span>
                      <span className="font-medium text-gray-900">{topicStats.mostActiveDay || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longest streak:</span>
                      <span className="font-medium text-gray-900">{topicStats.longestStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last entry:</span>
                      <span className="font-medium text-gray-900">
                        {topicStats.lastEntryDate ? 
                          new Date(topicStats.lastEntryDate).toLocaleDateString() : 
                          'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Chart Placeholder */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Writing Progress</h3>
                  <div className="text-center py-8">
                    <p className="text-gray-600">Chart visualization coming soon...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-600">No analytics available yet. Start writing to see your progress!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
