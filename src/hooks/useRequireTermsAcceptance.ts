import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Hook to require terms acceptance before accessing protected routes
 * @returns {boolean} Whether the user has accepted terms
 */
export function useRequireTermsAcceptance() {
  const { user, hasAcceptedTerms, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only check after auth is initialized and not loading
    if (!initialized || loading) return;

    // If user is logged in but hasn't accepted terms
    if (user && hasAcceptedTerms === false) {
      // Don't redirect if already on the terms acceptance page
      if (!location.pathname.includes('/terms-acceptance')) {
        // Pass the current path as a redirect parameter
        navigate(`/terms-acceptance?redirectTo=${encodeURIComponent(location.pathname)}`);
      }
    }
  }, [user, hasAcceptedTerms, loading, initialized, navigate, location.pathname]);

  return hasAcceptedTerms;
}