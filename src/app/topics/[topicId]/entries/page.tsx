'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { DiaryEntry } from '@/types/database';
import Header from '@/components/Header';

interface TopicEntriesPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export default function TopicEntriesPage({ params }: TopicEntriesPageProps) {
  const resolvedParams = use(params);
  const { user, userTopics } = useUser();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const topic = userTopics.find(t => t.topicId === resolvedParams.topicId);

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

  useEffect(() => {
    const fetchEntries = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/entries/topic/${resolvedParams.topicId}?userId=${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setEntries(data.entries);
        } else {
          setError('Failed to fetch entries');
        }
      } catch (error) {
        console.error('Error fetching entries:', error);
        setError('Failed to fetch entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [user, resolvedParams.topicId]);

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-4">{topic.icon}</span>
            <div>
              <h1 className="text-3xl font-playfair font-bold text-gray-900">{topic.title}</h1>
              <p className="text-gray-600 mt-2">{topic.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 uppercase tracking-wide">{topic.category}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{entries.length} entries</span>
          </div>
        </div>

        {/* New Entry Section */}
        <div className="mb-8">
          {!showNewEntryForm ? (
            <button
              onClick={() => setShowNewEntryForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>✍️</span>
              <span>Write New Entry</span>
            </button>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">New Entry</h2>
                <button
                  onClick={() => {
                    setShowNewEntryForm(false);
                    setNewEntryTitle('');
                    setNewEntryContent('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                >
                  ×
                </button>
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
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading entries...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-4">No entries yet for this topic.</p>
            <Link
              href="/new-entry"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Write Your First Entry
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-3">{entry.content}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{entry.wordCount} words</span>
                  <Link
                    href={`/entries/${entry.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
  );
}
