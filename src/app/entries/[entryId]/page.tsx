'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { DiaryEntry, UserTopic } from '@/types/database';
import Header from '@/components/Header';

interface EntryPageProps {
  params: Promise<{
    entryId: string;
  }>;
}

export default function EntryPage({ params }: EntryPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, userTopics } = useUser();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [topic, setTopic] = useState<UserTopic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch entry data
  useEffect(() => {
    const fetchEntry = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch all entries to find the specific one
        const response = await fetch(`/api/entries?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const foundEntry = data.entries.find((e: DiaryEntry) => e.id === resolvedParams.entryId);
          
          if (foundEntry) {
            setEntry(foundEntry);
            // Find the topic for this entry
            const entryTopic = userTopics.find(t => t.topicId === foundEntry.topicId);
            setTopic(entryTopic || null);
          } else {
            setError('Entry not found');
          }
        } else {
          setError('Failed to fetch entry');
        }
      } catch (error) {
        console.error('Error fetching entry:', error);
        setError('Failed to fetch entry');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [user, resolvedParams.entryId, userTopics]);

  // Handle edit submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !entry || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        const updatedEntry = await response.json();
        setEntry(updatedEntry.entry);
        setIsEditing(false);
        setSuccessMessage('✅ Entry updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      setError('Failed to update entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!user || !entry) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/entries/${entry.id}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('✅ Entry deleted successfully!');
        setTimeout(() => {
          router.push(`/topics/${entry.topicId}`);
        }, 1500);
      } else {
        setError('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setError('Failed to delete entry');
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
    }
  };

  // Start editing
  const startEditing = () => {
    if (entry) {
      setEditTitle(entry.title);
      setEditContent(entry.content);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading entry...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Entry Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The entry you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/new-entry"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Topics
            </Link>
          </div>
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

        {/* Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/topics/${entry.topicId}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>←</span>
                <span>Back to Topic</span>
              </Link>
              {topic && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{topic.title}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={startEditing}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        {/* Entry Content */}
        {!isEditing ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            {/* Entry Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-playfair font-bold text-gray-900">{entry.title}</h1>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {topic && (
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{topic.icon}</span>
                  <span className="text-sm text-gray-600">{topic.title}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{entry.wordCount} words</span>
                </div>
              )}
            </div>

            {/* Entry Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </div>
            </div>

            {/* Entry Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Last updated: {new Date(entry.updatedAt).toLocaleDateString()}</span>
                <div className="flex items-center space-x-4">
                  <span>{entry.wordCount} words</span>
                  <span>{entry.content.length} characters</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Edit Entry</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="Give your entry a title..."
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black placeholder-gray-500"
                  placeholder="Write your thoughts, reflections, or ideas..."
                  required
                />
                <div className="text-sm text-gray-500 mt-2">
                  {editContent.length} characters • {editContent.split(/\s+/).filter(word => word.length > 0).length} words
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
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
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-xl font-semibold text-gray-900">Delete Entry</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete <strong>"{entry.title}"</strong>?
              </p>
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Delete Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
