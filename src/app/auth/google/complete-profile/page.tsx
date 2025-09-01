'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

function CompleteGoogleProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get email and name from URL params
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  
  const [formData, setFormData] = useState({
    email: email || '',
    name: name || '',
    writingGoal: 'personal-growth'
  });

  useEffect(() => {
    if (email && name) {
      setFormData(prev => ({
        ...prev,
        email,
        name
      }));
    }
  }, [email, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          writingGoal: formData.writingGoal
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Google user account created:', userData.user.email);
        console.log('📋 User data:', userData.user);
        
        // Set the user in context and redirect
        try {
          console.log('🔄 Attempting to log in Google user...');
          console.log('🔄 loginWithGoogle function available:', typeof loginWithGoogle);
          
          // Log in the Google user
          await loginWithGoogle(userData.user);
          console.log('✅ User logged in successfully');
          
          // Check if user is now in context
          console.log('🔍 Checking user context after login...');
          // We can't directly access the context here, but we can check localStorage
          const storedUser = localStorage.getItem('googleUser');
          console.log('🔍 localStorage after login:', storedUser ? 'EXISTS' : 'NOT FOUND');
          
          // Redirect to main app
          console.log('🔄 Redirecting to new-entry page...');
          console.log('🔄 Current URL before redirect:', window.location.href);
          
          // Add a small delay to ensure user state is set
          console.log('⏳ Waiting 500ms for user state to be set...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try different redirect methods
          try {
            router.push('/new-entry');
            console.log('✅ Router.push called successfully');
          } catch (routerError) {
            console.error('❌ Router.push failed:', routerError);
            // Fallback to window.location
            console.log('🔄 Trying window.location fallback...');
            window.location.href = '/new-entry';
          }
        } catch (loginError) {
          console.error('❌ Error during login redirect:', loginError);
          // Fallback: redirect anyway
          console.log('🔄 Fallback redirect...');
          window.location.href = '/new-entry';
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Error creating Google user account:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !name) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-playfair font-bold text-gray-900">
            Write-it
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome! Let&apos;s set up your writing journey
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="writingGoal" className="block text-sm font-medium text-gray-700">
                What&apos;s your main writing goal?
              </label>
              <div className="mt-1">
                <select
                  id="writingGoal"
                  name="writingGoal"
                  value={formData.writingGoal}
                  onChange={(e) => setFormData({ ...formData, writingGoal: e.target.value })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                >
                  <option value="personal-growth">Personal Growth & Reflection</option>
                  <option value="creative-writing">Creative Writing & Stories</option>
                  <option value="professional-development">Professional Development</option>
                  <option value="learning-notes">Learning & Study Notes</option>
                  <option value="daily-life">Daily Life & Memories</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CompleteGoogleProfile() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/" className="text-3xl font-playfair font-bold text-gray-900">
              Write-it
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <CompleteGoogleProfileForm />
    </Suspense>
  );
}
