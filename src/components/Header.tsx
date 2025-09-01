'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';

export default function Header() {
  const { user, isLoading, logout } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-playfair font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Write-it
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isLoading && (
              <>
                {user ? (
                  // User is signed in
                  <>
                    <Link
                      href="/new-entry"
                      className="hidden sm:block text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      New Entry
                    </Link>
                    
                    {/* User dropdown */}
                    <div className="relative group" ref={dropdownRef}>
                      <button 
                        onClick={toggleDropdown}
                        className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="hidden sm:block">{user.name}</span>
                        <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown menu */}
                      <div className={`absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 transition-all duration-200 ${
                        isDropdownOpen 
                          ? 'opacity-100 visible' 
                          : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                      }`}>
                        <div className="px-3 sm:px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-gray-500 text-xs truncate">{user.email}</div>
                        </div>
                        <Link
                          href="/new-entry"
                          onClick={closeDropdown}
                          className="block w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors sm:hidden"
                        >
                          New Entry
                        </Link>
                        <Link
                          href="/settings"
                          onClick={closeDropdown}
                          className="block w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Settings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // User is not signed in
                  <>
                    <Link
                      href="/auth/signin"
                      className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
            
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
