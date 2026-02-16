import React, { useState } from 'react'
import { AuthContext, type UserProfile, type LegacyUser, type AuthContextType } from './AuthContext'

// Development-only mock auth provider for local testing without Clerk
// This allows the app to run locally without authentication configured
// Uses the SAME AuthContext so useAuth() works in both modes

// Mock user for development
const MOCK_USER_ID = 'dev-user-123'
const MOCK_USER: LegacyUser = {
  id: MOCK_USER_ID,
  email: '',
  created_at: new Date().toISOString(),
  user_metadata: {
    full_name: null,
    avatar_url: null,
  },
}

const MOCK_PROFILE: UserProfile = {
  id: 'profile-dev-123',
  clerk_user_id: MOCK_USER_ID,
  email: '',
  full_name: null,
  avatar_url: null,
  thinking_patterns: {},
  behavior_patterns: {},
  emotional_responses: {},
  preferences: {},
  privacy_settings: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_active_at: new Date().toISOString(),
}

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(MOCK_PROFILE)

  const signOut = async () => {
    // Clear chatbot localStorage to prevent conversations persisting across sessions
    const chatbotKeys = [
      'nexus_chatbot_open',
      'nexus_chatbot_messages',
      'nexus_chatbot_state',
      'nexus_chatbot_intent',
      'nexus_chatbot_info',
      'nexus_chatbot_questions',
      'nexus_chatbot_question_index',
      'nexus_chatbot_user_id',
      'nexus_active_workflow_id',
      'nexus_pending_workflow'
    ]
    chatbotKeys.forEach(key => localStorage.removeItem(key))

    setIsSignedIn(false)
    setUserProfile(null)
  }

  const refreshProfile = async () => {
    setUserProfile(MOCK_PROFILE)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...data } : null)
  }

  const value: AuthContextType = {
    isSignedIn,
    isLoaded: true,
    userId: isSignedIn ? MOCK_USER_ID : null,
    userProfile: isSignedIn ? userProfile : null,
    profileLoading: false,
    signOut,
    refreshProfile,
    updateProfile,
    user: isSignedIn ? MOCK_USER : null,
    loading: false,
    isDevMode: true,
  }

  // Use the SAME AuthContext - this makes useAuth() work in dev mode
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
