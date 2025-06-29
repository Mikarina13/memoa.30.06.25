import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { useState } from 'react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';
import { PersonalityTestInterface } from '../components/PersonalityTestInterface';

export function PersonalityTestPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { memoriaProfileId, returnPath, ownerUserId } = location.state || {};
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Personality Test';
    
    // Redirect if user is not authenticated
    if (!loading && !user) {
      navigate('/memento');
    }
  }, [navigate, user, loading, memoriaProfileId]);

  const handleTestCompleted = (testResults: any) => {
    // Load the updated data
    loadPersonalityData();
  };

  const loadPersonalityData = async () => {
    try {
      setIsLoading(true);
      
      // Determine which user ID to use
      const effectiveUserId = ownerUserId || user.id;
      
      if (memoriaProfileId) {
        // Load personality test results for Memoria profile
        const profile = await MemoirIntegrations.getMemoirProfile(effectiveUserId, memoriaProfileId);
        
        if (profile?.profile_data?.personality_test) {
          setPdfUrl(profile.profile_data.personality_test.pdfUrl || null);
          setPdfName(profile.profile_data.personality_test.pdfName || null);
        }
      } else {
        // Load personality test results for user profile
        const profile = await MemoirIntegrations.getMemoirProfile(effectiveUserId);
        
        if (profile?.memoir_data?.personality_test) {
          setPdfUrl(profile.memoir_data.personality_test.pdfUrl || null);
          setPdfName(profile.memoir_data.personality_test.pdfName || null);
        }
      }
    } catch (error) {
      console.error('Error loading personality data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(returnPath || '/memento');
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]">
      <Header />
      
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Personality Profile
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          Capture your psychological profile to enhance your digital legacy
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-white/70">Loading personality data...</p>
          </div>
        ) : (
          <div>
            <PersonalityTestInterface
              memoriaProfileId={memoriaProfileId}
              onTestCompleted={handleTestCompleted}
              onClose={handleGoBack}
              ownerUserId={ownerUserId}
            />
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}