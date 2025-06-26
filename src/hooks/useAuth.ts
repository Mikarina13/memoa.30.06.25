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
          console.error('Error creating user profile:', insertError.message);
        }
      } else if (fetchError) {
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
          console.error('Error updating profile with Google data:', updateError.message);
        }
      }
    } catch (err) {
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
          } else {
            console.error('Error fetching user:', error.message);
            setUser(null);
          }
          setHasAcceptedTerms(null);
        } else if (user) {
          setUser(user);
          setHasAcceptedTerms(checkTermsAcceptance(user));
          // Create profile in background, don't wait for it
          createUserProfile(user.id, user.user_metadata).catch(console.error);
        }
      } catch (err) {
        console.error('Error in getUser:', err);
        setUser(null);
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
        // Create profile in background, don't wait for it
        createUserProfile(session.user.id, session.user.user_metadata).catch(console.error);
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
      if (error) throw error;
      setUser(null);
      setHasAcceptedTerms(null);
      // Don't reload the page, just clear the user state and let routing handle it
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return { user, loading, logout, initialized, hasAcceptedTerms };
}