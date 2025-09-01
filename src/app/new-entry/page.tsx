'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { writingGoals, getGoalsByCategory } from '@/data/writingGoals';
import { WritingGoal } from '@/types/goals';
import { useUser } from '@/contexts/UserContext';
import { UserTopic } from '@/types/database';
import Header from '@/components/Header';

export default function NewEntry() {
  const router = useRouter();
  const { user, userTopics, addUserTopic, isLoading, refreshTopics } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAvailableGoals, setShowAvailableGoals] = useState(false);

  const [topicStats, setTopicStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; topic: UserTopic | null }>({ show: false, topic: null });
  const [deleting, setDeleting] = useState(false);
  const [userCategories, setUserCategories] = useState<Array<{ id: string; name: string; color: string; icon: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Function definitions
  const fetchUserCategories = async () => {
    if (!user) return;
    
    setCategoriesLoading(true);
    try {
      const response = await fetch(`/api/categories?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Add "All Topics" option
        const categoriesWithAll = [
          { id: 'all', name: 'All Topics', color: 'from-gray-500 to-gray-600', icon: '📋' },
          ...data.categories
        ];
        setUserCategories(categoriesWithAll);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchTopicStats = async () => {
    if (!user) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/topics/stats?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const statsMap: Record<string, number> = {};
        data.topicStats.forEach((stat: { topicId: string; entryCount: number }) => {
          statsMap[stat.topicId] = stat.entryCount;
        });
        setTopicStats(statsMap);
      }
    } catch (error) {
      // Error fetching topic stats
    } finally {
      setStatsLoading(false);
    }
  };



  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  // Add global error handler to prevent page reloads
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Fetch categories when user changes or topics are updated
  useEffect(() => {
    if (user) {
      fetchUserCategories();
    }
  }, [user, userTopics]);

  // Fetch topic stats when user topics change
  useEffect(() => {
    if (userTopics.length > 0) {
      fetchTopicStats();
    }
  }, [userTopics, user]);

  // Show loading state while user data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your writing topics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }



  const filteredUserTopics = selectedCategory === 'all' 
    ? userTopics 
    : userTopics.filter(topic => topic.category === selectedCategory);

  const filteredAvailableGoals = selectedCategory === 'all' 
    ? writingGoals 
    : getGoalsByCategory(selectedCategory as any);

  // Filter out goals that user already has
  const availableGoals = filteredAvailableGoals.filter(goal => 
    !userTopics.some(userTopic => userTopic.topicId.startsWith(goal.id))
  );

  const handleTopicClick = (topicId: string) => {
    router.push(`/topics/${topicId}`);
  };

  const handleDeleteTopic = async () => {
    if (!deleteModal.topic || !user) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/topics/${deleteModal.topic.topicId}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Close modal immediately
        setDeleteModal({ show: false, topic: null });
        setDeleting(false);
        
        // Show success message

        
        // Refresh topics and stats immediately
        setStatsLoading(true);
        refreshTopics();
        fetchTopicStats();
      } else {
        const errorData = await response.json();

        setDeleting(false);
      }
    } catch (error) {

      setDeleting(false);
    }
  };

  const handleAddTopic = async (goal: WritingGoal, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) return;

    // Prevent any default form submission
    event?.preventDefault();
    event?.stopPropagation();

    let originalText = '+ Add to My Topics';
    let button: HTMLButtonElement | null = null;

    try {
      // Show loading state
      button = event?.currentTarget as HTMLButtonElement;
      if (button) {
        originalText = button.innerHTML;
        button.innerHTML = '<div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Adding...';
        button.disabled = true;
      }

      await addUserTopic({
        topicId: goal.id,
        title: goal.title,
        description: goal.description,
        icon: goal.icon,
        color: goal.color,
        category: goal.category,
        isActive: true,
      });

      // Show success feedback and hide the button immediately
      if (button) {
        button.style.display = 'none';
      }

      // Show success message
      
      
      // Note: addUserTopic already calls refreshTopics() internally
      // We don't need to call fetchTopicStats() here as it will be called by the useEffect
      
    } catch (error) {
      // Show user-friendly error message instead of alert
      
      
      // Reset button on error
      if (button) {
        button.innerHTML = originalText;
        button.disabled = false;
      }
    }
  };

  return (
    <>
    

      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Choose Your Topic
            </h1>
            <p className="text-xl text-gray-600">
              Select a topic to start writing and see your previous entries
            </p>
          </div>

        <div className="space-y-8">
          {/* Goal Selection */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Choose Your Writing Topic
            </h2>
            
            {/* Loading State */}
            {(isLoading || statsLoading || categoriesLoading) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center space-x-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600">
                    {isLoading ? 'Loading your topics...' : statsLoading ? 'Updating topics...' : 'Loading categories...'}
                  </span>
                </div>
              </div>
            )}

            {/* No Topics State */}
            {!isLoading && userTopics.length === 0 && !statsLoading && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Topics Yet</h3>
                <p className="text-gray-600 mb-6">You don&apos;t have any writing topics yet. Let&apos;s add some!</p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/new-topic"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Custom Topic
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowAvailableGoals(true)}
                    className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Choose from Templates
                  </button>
                </div>
              </div>
            )}

            {/* User's Topics */}
            {!isLoading && userTopics.length > 0 && !statsLoading && (
              <>
                {/* Category Filter */}
                <div className="mb-8">
                  {categoriesLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Loading categories...</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedCategory === category.id
                              ? `bg-gradient-to-r ${category.color} text-white shadow-md`
                              : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {category.icon} {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Topics Grid */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Your Writing Topics ({filteredUserTopics.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAvailableGoals(!showAvailableGoals)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showAvailableGoals ? 'Hide' : 'Add More'} Topics
                    </button>
                  </div>

                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUserTopics.map((topic: UserTopic) => {
                      const entryCount = topicStats[topic.topicId] || 0;
                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleTopicClick(topic.topicId)}
                          className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-105 transition-all duration-200 text-left group cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{topic.icon}</span>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                {topic.title}
                              </h3>
                            </div>
                            <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {statsLoading ? (
                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : entryCount}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {topic.description}
                          </p>
                                                  <div className="flex items-center justify-between">
                          <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700 flex items-center">
                            <span>✍️ Write Entry</span>
                            <span className="ml-2">→</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal({ show: true, topic });
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            title="Remove topic"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Available Goals */}
            {showAvailableGoals && availableGoals.length > 0 && (
              <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add More Topics</h3>
                  <button
                    type="button"
                    onClick={() => setShowAvailableGoals(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableGoals.map((goal: WritingGoal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={(e) => handleAddTopic(goal, e)}
                      className="p-6 rounded-xl border-2 border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{goal.icon}</span>
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                      <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                        + Add to My Topics
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Available Goals */}
            {showAvailableGoals && availableGoals.length === 0 && (
              <div className="mb-8 bg-white rounded-xl p-6 border border-gray-200 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All Topics Added!</h3>
                <p className="text-gray-600 mb-4">You&apos;ve already added all available writing topics to your collection.</p>
                <button
                  type="button"
                  onClick={() => setShowAvailableGoals(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Create New Topic Button - Bottom */}
          {!isLoading && userTopics.length > 0 && !statsLoading && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Want to Create Something New?</h3>
                <p className="text-gray-600 mb-6">Create a custom writing topic that&apos;s perfect for your specific needs and interests.</p>
                <Link
                  href="/new-topic"
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <span>+</span>
                  <span>Create Custom Topic</span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.topic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚠️</span>
              <h3 className="text-xl font-semibold text-gray-900">Remove Topic</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to remove <strong>&quot;{deleteModal.topic.title}&quot;</strong> from your topics?
              </p>
              
              {topicStats[deleteModal.topic.topicId] > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ This topic has {topicStats[deleteModal.topic.topicId]} {topicStats[deleteModal.topic.topicId] === 1 ? 'entry' : 'entries'}. 
                    You&apos;ll need to delete all entries first before removing the topic.
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, topic: null })}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                disabled={deleting || topicStats[deleteModal.topic.topicId] > 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Remove Topic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
