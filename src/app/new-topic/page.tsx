'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Header from '@/components/Header';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function NewTopic() {
  const router = useRouter();
  const { user, refreshTopics } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('from-blue-500 to-blue-600');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📝');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Predefined color options for new categories
  const colorOptions = [
    { value: 'from-blue-500 to-blue-600', label: 'Blue', preview: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { value: 'from-purple-500 to-purple-600', label: 'Purple', preview: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { value: 'from-green-500 to-green-600', label: 'Green', preview: 'bg-gradient-to-r from-green-500 to-green-600' },
    { value: 'from-orange-500 to-orange-600', label: 'Orange', preview: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { value: 'from-pink-500 to-pink-600', label: 'Pink', preview: 'bg-gradient-to-r from-pink-500 to-pink-600' },
    { value: 'from-teal-500 to-teal-600', label: 'Teal', preview: 'bg-gradient-to-r from-teal-500 to-teal-600' },
    { value: 'from-red-500 to-red-600', label: 'Red', preview: 'bg-gradient-to-r from-red-500 to-red-600' },
    { value: 'from-indigo-500 to-indigo-600', label: 'Indigo', preview: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
  ];

  // Common emoji icons for categories
  const iconOptions = [
    '📝', '📚', '💡', '🎯', '❤️', '🚀', '🎨', '🧠', '💼', '🏠', 
    '🌱', '⭐', '🔥', '💎', '🎪', '🎭', '🎵', '🎬', '🌍', '✨'
  ];

  // Fetch existing categories
  const fetchCategories = async () => {
    if (!user) return;
    
    setCategoriesLoading(true);
    try {
      const response = await fetch(`/api/categories?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrorMessage('You must be logged in to create a topic');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Title is required');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Description is required');
      return;
    }

    if (!selectedCategory && !newCategoryName.trim()) {
      setErrorMessage('Please select or create a category');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const topicData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory || newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        color: selectedCategory ? 
          categories.find(c => c.id === selectedCategory)?.color || 'from-gray-500 to-gray-600' :
          newCategoryColor,
        icon: selectedCategory ? 
          categories.find(c => c.id === selectedCategory)?.icon || '📝' :
          newCategoryIcon,
      };

      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...topicData,
          userId: user.id,
        }),
      });

      if (response.ok) {
        setSuccessMessage('✅ Topic created successfully!');
        setTitle('');
        setDescription('');
        setSelectedCategory('');
        setNewCategoryName('');
        setIsCreatingCategory(false);
        
        // Refresh topics and categories
        refreshTopics();
        fetchCategories();
        
        // Redirect to new-entry page after 2 seconds
        setTimeout(() => {
          router.push('/new-entry');
        }, 2000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to create topic');
      }
    } catch (error) {
      setErrorMessage('Failed to create topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  return (
    <>
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-green-200 rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
          <div className="flex items-center justify-between">
            <span className="text-green-800">{successMessage}</span>
            <button
              onClick={clearMessages}
              className="ml-4 text-green-600 hover:text-green-800 text-lg font-bold transition-colors"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-red-200 rounded-lg shadow-lg p-4 max-w-md w-full mx-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800">{errorMessage}</span>
            <button
              onClick={clearMessages}
              className="ml-4 text-red-600 hover:text-red-800 text-lg font-bold transition-colors"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              Create New Topic
            </h1>
            <p className="text-xl text-gray-600">
              Add a new writing topic to your collection
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="e.g., Daily Reflection, Creative Writing, Problem Solving"
                  maxLength={100}
                />
                <p className="text-sm text-gray-500 mt-1">{title.length}/100 characters</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="Describe what this topic is about and what you'll write about..."
                  maxLength={300}
                />
                <p className="text-sm text-gray-500 mt-1">{description.length}/300 characters</p>
              </div>



              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                
                {/* Existing Categories */}
                {!isCreatingCategory && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Choose existing category:</span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Create New Category
                      </button>
                    </div>
                    
                    {categoriesLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-600">Loading categories...</span>
                      </div>
                    ) : categories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategory(category.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-black ${
                              selectedCategory === category.id
                                ? `border-blue-500 bg-blue-50`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{category.icon}</span>
                              <span className="font-medium text-black">{category.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No existing categories. Create your first one!</p>
                    )}
                  </div>
                )}

                {/* Create New Category */}
                {isCreatingCategory && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Create new category:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName('');
                          setSelectedCategory('');
                        }}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        Use Existing
                      </button>
                    </div>

                    {/* Category Name */}
                    <div>
                      <label htmlFor="newCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                        placeholder="e.g., Reflection, Learning, Personal"
                        maxLength={50}
                      />
                    </div>

                    {/* Category Icon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Icon
                      </label>
                      <div className="grid grid-cols-10 gap-2">
                        {iconOptions.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setNewCategoryIcon(icon)}
                            className={`p-2 rounded-lg border-2 transition-all ${
                              newCategoryIcon === icon
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="text-lg">{icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Color
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setNewCategoryColor(color.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              newCategoryColor === color.value
                                ? 'border-blue-500'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-full h-6 rounded ${color.preview}`}></div>
                            <span className="text-xs mt-1 block text-black">{color.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.push('/new-entry')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
