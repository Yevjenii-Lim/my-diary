'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import Header from "@/components/Header";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const isLoggedIn = !!user;

  // No automatic redirect - let users choose to stay on home page

  const handleStartWriting = () => {
    if (isLoggedIn) {
      router.push('/new-entry');
    } else {
      router.push('/auth/signin');
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold text-gray-800 mb-4 sm:mb-6 drop-shadow-sm">
              {isLoggedIn ? (
                <>
                  Welcome back, <span className="text-blue-600 block drop-shadow-sm">{user?.name}!</span>
                </>
              ) : (
                <>
                  Learn to Write,
                  <span className="text-blue-600 block drop-shadow-sm">Learn to Think</span>
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              {isLoggedIn ? (
                "Ready to continue your writing journey? Pick up where you left off or start something new. Your thoughts and ideas are waiting to be explored."
              ) : (
                "Simple daily writing, powered by AI insights."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              {isLoggedIn ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/new-entry"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    Write New Entry
                  </Link>
                
                </div>
              ) : (
                <button
                  onClick={handleStartWriting}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  {isLoading ? 'Loading...' : 'Sign In to Start Writing'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-12 h-12 sm:w-20 sm:h-20 bg-blue-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-20 h-20 sm:w-32 sm:h-32 bg-yellow-200 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-green-200 rounded-full opacity-20"></div>
      </section>

    
    

      {/* Security & Privacy Section */}
      <section id="security" className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-3 sm:mb-4">
              Your Privacy & Security First
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              We believe your thoughts and personal writings should remain completely private and secure
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">End-to-End Encryption</h3>
                  <p className="text-gray-600">
                    All your diary entries are encrypted using military-grade AES-256 encryption. Your data is encrypted before it leaves your device and remains encrypted in our secure database.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Privacy</h3>
                  <p className="text-gray-600">
                    Your data is completely private. We cannot read your entries, and they are never shared with third parties. Your thoughts belong to you alone.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 8.944l-1.193-1.193a2 2 0 00-2.828 0L11 14.172V17h2.828l5.79-5.79a2 2 0 000-2.828z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">User-Controlled Keys</h3>
                  <p className="text-gray-600">
                    Each user has their own unique encryption keys. Even our team cannot access your encrypted data - only you hold the keys to your thoughts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Bank-Level Security</h3>
              <p className="text-gray-600 text-lg">
                We use the same encryption standards as major financial institutions to protect your most personal thoughts and writings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-gray-900 mb-3 sm:mb-4">
              AI-Powered Writing Assistance
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Get intelligent suggestions and overcome writer's block with our advanced AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Topic Suggestions</h3>
              <p className="text-gray-600 text-lg">
                Our AI analyzes your writing patterns and suggests personalized topics that will help you grow and explore new areas of thought.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Overcome Writer's Block</h3>
                  <p className="text-gray-600">
                    Stuck on what to write? Our AI provides creative prompts and ideas to get your thoughts flowing again.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Insights</h3>
                  <p className="text-gray-600">
                    Get tailored suggestions based on your writing history, interests, and goals. Every suggestion is designed specifically for you.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Writing Prompts</h3>
                  <p className="text-gray-600">
                    Access a library of thought-provoking prompts that challenge your thinking and expand your writing horizons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-white mb-3 sm:mb-4">
            Coming Soon: Smart Reminders
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100 mb-6 sm:mb-8 px-4">
            We're working on email notifications to help you build a consistent writing habit. Get gentle reminders when it's time to write and never miss a day of growth.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 inline-block">
            <p className="text-white text-sm">
              🚀 <span className="font-semibold">In Development:</span> Personalized email reminders, writing streak tracking, and motivational notifications
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair font-bold text-white mb-3 sm:mb-4">
            Ready to Transform Your Writing and Thinking?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 px-4">
            Join thousands of people who have improved their writing skills and critical thinking through daily practice
          </p>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium transition-all transform hover:scale-105 shadow-lg inline-block"
          >
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="text-xl font-playfair font-bold mb-4">Write-it</h3>
              <p className="text-gray-400">
                Your personal space to develop writing skills and enhance critical thinking through daily practice.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#ai-features" className="hover:text-white transition-colors">AI Assistance</a></li>
                <li><a href="#security" className="hover:text-white transition-colors">Security & Privacy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">About</a></li>
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="mailto:yevhenii.lim27@gmail.com" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Write-it. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
