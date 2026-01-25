import { createClient } from '@supabase/supabase-js';
// Initialize Supabase client with service role for backend operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    console.warn('⚠️ SUPABASE_URL not configured');
}
const supabase = supabaseServiceKey && supabaseUrl
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
/**
 * User Profile Service
 * Manages user profiles with cross-project intelligence metadata
 * Implements FR-8.1 to FR-8.8
 */
export const userProfileService = {
    /**
     * Create a new user profile (called from Clerk webhook)
     */
    async createProfile(data) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .insert({
            clerk_user_id: data.clerk_user_id,
            email: data.email,
            full_name: data.full_name,
            avatar_url: data.avatar_url,
        })
            .select()
            .single();
        if (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
        return profile;
    },
    /**
     * Get user profile by Clerk user ID
     */
    async getProfileByClerkId(clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error fetching user profile:', error);
            throw error;
        }
        return profile;
    },
    /**
     * Update user profile
     */
    async updateProfile(clerkUserId, data) {
        if (!supabase) {
            console.error('Supabase not configured');
            return null;
        }
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .update(data)
            .eq('clerk_user_id', clerkUserId)
            .select()
            .single();
        if (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
        return profile;
    },
    /**
     * Delete user profile (soft delete or hard delete based on requirements)
     */
    async deleteProfile(clerkUserId) {
        if (!supabase) {
            console.error('Supabase not configured');
            return false;
        }
        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('clerk_user_id', clerkUserId);
        if (error) {
            console.error('Error deleting user profile:', error);
            throw error;
        }
        return true;
    },
    /**
     * Update user's last active timestamp
     */
    async updateLastActive(clerkUserId) {
        if (!supabase)
            return;
        await supabase
            .from('user_profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('clerk_user_id', clerkUserId);
    },
    /**
     * Update thinking patterns (FR-8.2)
     * Called when AI learns about user's planning preferences
     */
    async updateThinkingPatterns(clerkUserId, patterns) {
        return this.updateProfile(clerkUserId, { thinking_patterns: patterns });
    },
    /**
     * Update behavior patterns (FR-8.3)
     * Called when AI learns about user's workflow habits
     */
    async updateBehaviorPatterns(clerkUserId, patterns) {
        return this.updateProfile(clerkUserId, { behavior_patterns: patterns });
    },
    /**
     * Update emotional responses (FR-8.4)
     * Called when AI learns what frustrates/delights the user
     */
    async updateEmotionalResponses(clerkUserId, responses) {
        return this.updateProfile(clerkUserId, { emotional_responses: responses });
    },
    /**
     * Update privacy settings (FR-8.8)
     */
    async updatePrivacySettings(clerkUserId, settings) {
        return this.updateProfile(clerkUserId, { privacy_settings: settings });
    },
    /**
     * Delete personalization data (FR-8.8 - user can delete their data)
     */
    async deletePersonalizationData(clerkUserId) {
        return this.updateProfile(clerkUserId, {
            thinking_patterns: {
                prefers_detailed_plans: true,
                quick_execution_tolerance: 0.5,
                explanation_depth: 'moderate'
            },
            behavior_patterns: {
                typical_workflow_complexity: 'medium',
                average_approval_time_seconds: 30,
                preferred_confirmation_level: 'balanced'
            },
            emotional_responses: {
                frustrated_by: [],
                delighted_by: [],
                communication_style: 'professional'
            }
        });
    }
};
export default userProfileService;
//# sourceMappingURL=userProfile.js.map