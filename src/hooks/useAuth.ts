import { useState, useEffect } from 'react';
import { supabase, isSessionError } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check if error is a network error
  const isNetworkError = (error: any) => {
    return error instanceof TypeError && 
           (error.message?.includes('Failed to fetch') || 
            error.message?.includes('Network request failed') ||
            error.message?.includes('fetch'));
  };

  const createUserProfile = async (userId: string, userMetadata: any = {}) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      // If profile doesn't exist (no data returned), create one
      if (fetchError && fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: userId,
              full_name: userMetadata.full_name || userMetadata.name || null,
              avatar_url: userMetadata.avatar_url || null,
              // Let the database handle defaults for other fields
            }
          ]);

        if (insertError) {
          if (isNetworkError(insertError)) {
            console.warn('Network error while creating profile. Will retry later:', insertError.message);
            return; // Don't throw, just return - profile creation can be retried later
          }
          console.error('Error creating user profile:', insertError.message);
        }
      } else if (fetchError) {
        // Handle network errors more gracefully
        if (isNetworkError(fetchError)) {
          console.warn('Network error while checking profile. Will retry later:', fetchError.message);
          return; // Don't throw, just return - profile creation can be retried later
        }
        console.error('Error checking for existing profile:', fetchError.message);
      } else if (existingProfile && userMetadata.avatar_url) {
        // Profile exists but check if we need to update Google avatar
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: userMetadata.avatar_url,
            full_name: userMetadata.full_name || userMetadata.name,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          if (isNetworkError(updateError)) {
            console.warn('Network error while updating profile. Will retry later:', updateError.message);
            return;
          }
          console.error('Error updating profile with Google data:', updateError.message);
        }
      }
    } catch (err) {
      // Handle network errors gracefully
      if (isNetworkError(err)) {
        console.warn('Network connectivity issue during profile creation. Will retry later.');
        return;
      }
      console.error('Error in createUserProfile:', err);
    }
  };

  // Check if user has accepted terms
  const checkTermsAcceptance = (userData: any) => {
    if (!userData) return false;
    
    const userMetadata = userData.user_metadata || {};
    return !!userMetadata.terms_accepted;
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (isSessionError(error)) {
            await supabase.auth.signOut();
            setUser(null);
          } else if (isNetworkError(error)) {
            // Handle network errors gracefully - don't clear user state immediately
            console.warn('Network error fetching user. Connection may be unstable:', error.message);
            // Keep current user state if we have one, otherwise set to null
            if (!user) {
              setUser(null);
            }
          } else {
            console.error('Error fetching user:', error.message);
            setUser(null);
          }
          setHasAcceptedTerms(null);
        } else if (user) {
          setUser(user);
          setHasAcceptedTerms(checkTermsAcceptance(user));
          // Create profile in background, don't wait for it and handle errors gracefully
          createUserProfile(user.id, user.user_metadata).catch(err => {
            if (!isNetworkError(err)) {
              console.error('Unexpected error creating profile:', err);
            }
          });
        }
      } catch (err) {
        if (isNetworkError(err)) {
          console.warn('Network connectivity issue during auth check:', err.message);
          // Don't clear user state on network errors
        } else {
          console.error('Error in getUser:', err);
          setUser(null);
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setHasAcceptedTerms(null);
      } else if (session?.user) {
        setUser(session.user);
        setHasAcceptedTerms(checkTermsAcceptance(session.user));
        // Create profile in background, don't wait for it and handle errors gracefully
        createUserProfile(session.user.id, session.user.user_metadata).catch(err => {
          if (!isNetworkError(err)) {
            console.error('Unexpected error creating profile:', err);
          }
        });
      }
      
      if (!initialized) {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [initialized]);

  // Redirect to terms acceptance page if user is logged in but hasn't accepted terms
  useEffect(() => {
    if (initialized && !loading && user && hasAcceptedTerms === false) {
      // Don't redirect if already on the terms acceptance page
      if (!location.pathname.includes('/terms-acceptance')) {
        // Pass the current path as a redirect parameter
        navigate(`/terms-acceptance?redirectTo=${encodeURIComponent(location.pathname)}`);
      }
    }
  }, [user, hasAcceptedTerms, loading, initialized, navigate, location.pathname]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Handle network errors gracefully
        if (isNetworkError(error)) {
          console.warn('Network error during logout. Clearing local session:', error.message);
          // Clear local state even if network request fails
          setUser(null);
          setHasAcceptedTerms(null);
          return;
        }
        throw error;
      }
      setUser(null);
      setHasAcceptedTerms(null);
      // Don't reload the page, just clear the user state and let routing handle it
    } catch (err) {
      console.error('Error logging out:', err);
      // Even if logout fails, clear the local state
      setUser(null);
      setHasAcceptedTerms(null);
    }
  };

  return { user, loading, logout, initialized, hasAcceptedTerms };
}