import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Download, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { useState } from 'react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function PersonalityTestPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { memoriaProfileId, returnPath } = location.state || {};
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Personality Test';
    
    // Redirect if user is not authenticated
    if (!loading && !user) {
      navigate('/memento');
    }
    
    // Load personality test data
    if (user) {
      loadPersonalityData();
    }
  }, [navigate, user, loading, memoriaProfileId]);

  const loadPersonalityData = async () => {
    try {
      setIsLoading(true);
      
      if (memoriaProfileId) {
        // Load personality test results for Memoria profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        
        if (profile?.profile_data?.personality_test) {
          setPdfUrl(profile.profile_data.personality_test.pdfUrl || null);
          setPdfName(profile.profile_data.personality_test.pdfName || null);
        }
      } else {
        // Load personality test results for user profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        
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

  const handleGoBack = () => {
    navigate(returnPath || '/memento');
  };

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
            {/* PDF Display Section */}
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">Test Results</h3>
              </div>
              
              {pdfUrl ? (
                <div className="bg-black/60 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium">{pdfName || '16 Personalities Test Results.pdf'}</div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                      <a 
                        href={pdfUrl} 
                        download
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/60">No personality test results available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}