'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserTopic } from '@/types/database';
import { getCurrentUser, isAuthenticated, signOut as cognitoSignOut, ensureValidToken, ensureUserInDatabase, User as CognitoUser } from '@/lib/cognito';

interface UserContextType {
  user: User | null;
  userTopics: UserTopic[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addUserTopic: (topic: Omit<UserTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  refreshTopics: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userTopics, setUserTopics] = useState<UserTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load authenticated user data
    const loadUser = async () => {
      setIsLoading(true);
      
      const authenticated = isAuthenticated();
      
      if (authenticated) {
        try {
          // Ensure token is valid before getting user
          const tokenValid = await ensureValidToken();
          
          if (tokenValid) {
            const cognitoUser = await getCurrentUser();
            
            if (cognitoUser) {
              // Ensure user exists in DynamoDB
              const dbUser = await ensureUserInDatabase(cognitoUser as CognitoUser);
              setUser(dbUser);
              await refreshTopics(dbUser);
            }
          } else {
            // Token is invalid, sign out user
            logout();
          }
        } catch (error) {
          // Error loading authenticated user
          logout();
        }
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Add a second useEffect to handle cases where the first one doesn't trigger
  useEffect(() => {
    if (!user && !isLoading) {
      const loadUser = async () => {
        const authenticated = isAuthenticated();
        if (authenticated) {
          try {
            const cognitoUser = await getCurrentUser();
            if (cognitoUser) {
              const dbUser = await ensureUserInDatabase(cognitoUser as CognitoUser);
              setUser(dbUser);
              await refreshTopics(dbUser);
            }
          } catch (error) {
            // Error in second useEffect
          }
        }
      };
      loadUser();
    }
  }, [user, isLoading]);

  const login = async (email: string, password: string) => {
    // This function is kept for compatibility but login is now handled by Cognito
    // The user should be loaded automatically when authenticated
    if (isAuthenticated()) {
      const cognitoUser = await getCurrentUser();
      if (cognitoUser) {
        // Ensure user exists in DynamoDB
        const dbUser = await ensureUserInDatabase(cognitoUser as CognitoUser);
        setUser(dbUser);
        await refreshTopics(dbUser);
      }
    }
  };

  const logout = () => {
    cognitoSignOut();
    setUser(null);
    setUserTopics([]);
  };

  const refreshTopics = async (targetUser?: User) => {
    const userToUse = targetUser || user;
    
    if (!userToUse) {
      return;
    }

    try {
      const response = await fetch(`/api/topics?userId=${userToUse.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserTopics(data.topics);
      }
    } catch (error) {
      // Error fetching user topics
    }
  };

  const addUserTopic = async (topic: Omit<UserTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...topic,
          userId: user.id,
        }),
      });

      if (response.ok) {
        await refreshTopics();
      }
    } catch (error) {
      // Error adding user topic
    }
  };

  const deleteUser = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Clear local storage and redirect to home
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setUserTopics([]);
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const value: UserContextType = {
    user,
    userTopics,
    isLoading,
    login,
    logout,
    addUserTopic,
    refreshTopics,
    deleteUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
