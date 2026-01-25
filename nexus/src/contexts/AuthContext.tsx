import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  clerk_user_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  thinking_patterns: Record<string, any>
  behavior_patterns: Record<string, any>
  emotional_responses: Record<string, any>
  preferences: Record<string, any>
  privacy_settings: Record<string, any>
  created_at: string
  updated_at: string
  last_active_at: string
}

// Legacy user type for backwards compatibility
export interface LegacyUser {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    full_name?: string | null
    avatar_url?: string | null
  }
}

export interface AuthContextType {
  // New Clerk-based properties
  isSignedIn: boolean
  isLoaded: boolean
  userId: string | null
  userProfile: UserProfile | null
  profileLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  // Legacy properties for backwards compatibility
  user: LegacyUser | null
  loading: boolean
  // Dev mode flag
  isDevMode?: boolean
}

// Export the context so DevAuthContext can use it
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, userId, signOut: clerkSignOut } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Fetch user profile from Supabase when Clerk user is loaded
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchProfile(userId)
    } else if (isLoaded && !isSignedIn) {
      setUserProfile(null)
      setProfileLoading(false)
    }
  }, [isLoaded, isSignedIn, userId])

  const fetchProfile = async (clerkUserId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }

      // If no profile exists yet (webhook hasn't fired), create a basic one from Clerk data
      if (!data && clerkUser) {
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            clerk_user_id: clerkUserId,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            full_name: clerkUser.fullName,
            avatar_url: clerkUser.imageUrl,
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          setUserProfile(newProfile)
        }
      } else {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err)
    } finally {
      setProfileLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (userId) {
      await fetchProfile(userId)
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!userId) return

    try {
      const { data: updated, error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('clerk_user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw error
      }

      setUserProfile(updated)
    } catch (err) {
      console.error('Error in updateProfile:', err)
      throw err
    }
  }

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

    await clerkSignOut()
    setUserProfile(null)
  }

  // Create legacy user object for backwards compatibility
  const legacyUser: LegacyUser | null = isSignedIn && clerkUser ? {
    id: userId || '',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    created_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
    user_metadata: {
      full_name: clerkUser.fullName,
      avatar_url: clerkUser.imageUrl,
    },
  } : null

  const value: AuthContextType = {
    // New properties
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    userId: userId ?? null,
    userProfile,
    profileLoading,
    signOut,
    refreshProfile,
    updateProfile,
    // Legacy properties for backwards compatibility
    user: legacyUser,
    loading: !isLoaded || profileLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

