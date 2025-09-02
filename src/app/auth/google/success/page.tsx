'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

export default function GoogleAuthSuccess() {
  const router = useRouter();
  const { loginWithGoogle } = useUser();
  const [error, setError] = useState('');

  useEffect(() => {
    const processGoogleAuth = async () => {
      try {
        // Check if we have Google user info
        const googleUserInfoCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('google_user_info='));
        
        if (!googleUserInfoCookie) {
          setError('Google authentication information not found');
          return;
        }

        const googleUserInfo = JSON.parse(decodeURIComponent(googleUserInfoCookie.split('=')[1]));

        // Check if user exists in our system
        const response = await fetch(`/api/users/google?email=${encodeURIComponent(googleUserInfo.email)}`);
        
        if (response.ok) {
          // User exists, get their data
          const userData = await response.json();
          
          // Log in the existing Google user
          try {
            await loginWithGoogle(userData.user);
            
            // Redirect to main app
            router.push('/new-entry');
          } catch (loginError) {
            console.error('❌ Error logging in existing Google user:', loginError);
            setError('Failed to log in existing user');
            return;
          }
        } else if (response.status === 404) {
          // User doesn't exist, redirect to complete profile
          router.push(`/auth/google/complete-profile?email=${encodeURIComponent(googleUserInfo.email)}&name=${encodeURIComponent(googleUserInfo.name)}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ API Error response:', errorData);
          throw new Error(`Failed to check user existence: ${errorData.details || errorData.error || response.statusText}`);
        }

      } catch (error) {
        console.error('❌ Error processing Google authentication:', error);
        setError('Failed to complete Google authentication');
      }
    };

    processGoogleAuth();
  }, [router, loginWithGoogle]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Link href="/" className="text-3xl font-playfair font-bold text-gray-900">
              Write-it
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-playfair font-bold text-gray-900">
            Write-it
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Completing Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your Google sign-in...
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
