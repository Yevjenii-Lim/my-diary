'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, isAuthenticated } from '@/lib/cognito';

export default function DebugPage() {
  const [authStatus, setAuthStatus] = useState<string>('Loading...');
  const [user, setUser] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = isAuthenticated();
        setAuthStatus(authenticated ? 'Authenticated' : 'Not authenticated');

        if (authenticated) {
          const currentUser = await getCurrentUser();
          setUser(currentUser);

          if (currentUser) {
            // Fetch topics for this user
            const response = await fetch(`/api/topics?userId=${currentUser.id}`);
            if (response.ok) {
              const data = await response.json();
              setTopics(data.topics);
            }
          }
        }
      } catch (error) {
        setAuthStatus(`Error: ${error}`);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <p className="text-lg">{authStatus}</p>
        </div>

        {user && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {topics.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Topics ({topics.length})</h2>
            <div className="grid gap-4">
              {topics.map((topic, index) => (
                <div key={index} className="border p-4 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div>
                      <h3 className="font-semibold">{topic.title}</h3>
                      <p className="text-sm text-gray-600">{topic.description}</p>
                      <p className="text-xs text-gray-500">Category: {topic.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user && topics.length === 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Topics</h2>
            <p className="text-gray-600">No topics found for this user.</p>
          </div>
        )}
      </div>
    </div>
  );
}




