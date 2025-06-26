import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, FileText, Book, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function TermsAcceptancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [communityAccepted, setCommunityAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted || !communityAccepted) {
      setError('You must accept all agreements to continue');
      return;
    }

    if (!user) {
      setError('You must be logged in to continue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update user metadata to include terms acceptance
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString(),
          community_guidelines_accepted: true,
          community_guidelines_accepted_at: new Date().toISOString()
        }
      });

      if (updateError) throw updateError;

      // Determine where to redirect based on URL params
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/memoir/dashboard';
      
      // Redirect to the appropriate dashboard
      navigate(redirectTo);
    } catch (err) {
      console.error('Error updating user metadata:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving your preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]"
    >
      <Header />
      
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Welcome to MEMOĀ
        </h1>
        
        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          Before you begin your journey with us, please review and accept our terms and policies.
        </p>

        <div className="space-y-6 mb-12">
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Terms of Service</h2>
                <p className="text-white/70 mb-4 font-[Rajdhani]">
                  Our Terms of Service outline the rules and guidelines for using MEMOĀ, including your rights and responsibilities as a user.
                </p>
                <div className="flex justify-between items-center">
                  <a 
                    href="/terms-of-service" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    Read Terms of Service
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={termsAccepted} 
                      onChange={() => setTermsAccepted(!termsAccepted)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white">I accept</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Privacy Policy</h2>
                <p className="text-white/70 mb-4 font-[Rajdhani]">
                  Our Privacy Policy explains how we collect, use, and protect your personal information when you use MEMOĀ.
                </p>
                <div className="flex justify-between items-center">
                  <a 
                    href="/privacy-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    Read Privacy Policy
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={privacyAccepted} 
                      onChange={() => setPrivacyAccepted(!privacyAccepted)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white">I accept</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Book className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Community Guidelines</h2>
                <p className="text-white/70 mb-4 font-[Rajdhani]">
                  Our Community Guidelines outline the standards of behavior and content that we expect from all MEMOĀ users.
                </p>
                <div className="flex justify-between items-center">
                  <a 
                    href="/community-guidelines" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    Read Community Guidelines
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={communityAccepted} 
                      onChange={() => setCommunityAccepted(!communityAccepted)}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white">I accept</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleAccept}
            disabled={!termsAccepted || !privacyAccepted || !communityAccepted || isSubmitting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Accept & Continue
              </>
            )}
          </button>
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}