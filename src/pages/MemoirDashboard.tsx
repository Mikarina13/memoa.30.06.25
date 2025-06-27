import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, User, LogOut, Mic, PenTool, Image, Brain, Heart, Volume2, ExternalLink, Gamepad2, RefreshCw, Clipboard, Users, FileVideo, Newspaper, BookOpen, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';
import { VoiceRecordingInterface } from '../components/VoiceRecordingInterface';
import { TavusAvatarInterface } from '../components/TavusAvatarInterface';
import { AvaturnAvatarInterface } from '../components/AvaturnAvatarInterface';
import { GeminiNarrativesInterface } from '../components/GeminiNarrativesInterface';
import { GamingPreferencesInterface } from '../components/GamingPreferencesInterface';
import { PersonalPreferencesInterface } from '../components/PersonalPreferencesInterface';
import { GalleryInterface } from '../components/GalleryInterface';
import { FamilyTreeInterface } from '../components/FamilyTreeInterface';
import { MediaLinksInterface } from '../components/MediaLinksInterface';
import { PortraitGenerationInterface } from '../components/PortraitGenerationInterface';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function MemoirDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showTavusCreation, setShowTavusCreation] = useState(false);
  const [showAvaturnCreation, setShowAvaturnCreation] = useState(false);
  const [showGeminiNarratives, setShowGeminiNarratives] = useState(false);
  const [showGamingPreferences, setShowGamingPreferences] = useState(false);
  const [showPersonalPreferences, setShowPersonalPreferences] = useState(false);
  const [initialPersonalPreferencesTab, setInitialPersonalPreferencesTab] = useState<'favorites' | 'digital'>('favorites');
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [showMediaLinks, setShowMediaLinks] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showPortraitGeneration, setShowPortraitGeneration] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [galleryData, setGalleryData] = useState<any>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [familyTreeData, setFamilyTreeData] = useState<any>(null);
  const [mediaLinksData, setMediaLinksData] = useState<any>(null);
  const [narrativesData, setNarrativesData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure user has accepted terms
  useRequireTermsAcceptance();

  useEffect(() => {
    document.title = 'MEMOIR Dashboard';
    
    if (!loading && !user) {
      navigate('/memoir');
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Loading user profile data...');
      
      // Load profile data
      const profile = await MemoirIntegrations.getMemoirProfile(user.id);
      setUserProfile(profile);
      
      // Load personal preferences
      const personalPrefs = await MemoirIntegrations.getPersonalPreferences(user.id);
      setPersonalData(personalPrefs);
      
      // Load gallery items
      const galleryItems = await MemoirIntegrations.getGalleryItems(user.id);
      setGalleryData(galleryItems);
      
      // Load family tree data
      setFamilyTreeData(profile.memoir_data?.family_tree);
      
      // Load media links
      setMediaLinksData(profile.memoir_data?.media_links || []);

      // Load narratives
      setNarrativesData(profile.memoir_data?.narratives);
      
      console.log('User profile data loaded successfully');
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile data. Please try refreshing the page.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVoiceCloned = async (voiceId: string) => {
    await loadUserProfile();
    setShowVoiceRecording(false);
  };

  const handleTavusAvatarCreated = async (avatarId: string) => {
    await loadUserProfile();
    setShowTavusCreation(false);
  };

  const handleAvaturnAvatarCreated = async (avatarData: any) => {
    await loadUserProfile();
    setShowAvaturnCreation(false);
  };

  const handleNarrativesProcessed = async (narrativeData: any) => {
    await loadUserProfile();
    setShowGeminiNarratives(false);
  };

  const handleGamesStored = async (gamingData: any) => {
    await loadUserProfile();
    setShowGamingPreferences(false);
  };

  const handlePersonalPreferencesSaved = async (preferencesData: any) => {
    await loadUserProfile();
  };

  const handleMediaLinksSaved = async (mediaLinksData: any) => {
    await loadUserProfile();
  };

  const handleGallerySaved = async (galleryItems: any) => {
    await loadUserProfile();
    setShowGallery(false);
  };

  const handleFamilyTreeSaved = async (treeData: any) => {
    await loadUserProfile();
  };
  
  const handlePortraitsGenerated = async (portraitData: any) => {
    await loadUserProfile();
    setShowPortraitGeneration(false);
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]"
    >
      <Header />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={loadUserProfile}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              title="Refresh dashboard"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={() => navigate('/memoir/settings')}
              className="text-white/80 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="text-white/80 hover:text-white transition-colors"
              title="My profile"
            >
              <User className="w-6 h-6" />
            </button>
            <button 
              onClick={logout}
              className="text-white/80 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          MEMOIR Dashboard
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          Craft your digital legacy with tools to preserve your voice, stories, and personal preferences.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-red-400 text-center">
            {error}
            <button 
              onClick={loadUserProfile}
              className="ml-4 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="space-y-8 mb-12">
          <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 p-8 rounded-xl border border-blue-500/20">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">AI Integration Tools</h2>
            
            <div className="space-y-6">
              {/* Voice Cloning */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'voice' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
              >
                <div className="flex items-start gap-4">
                  <Volume2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Voice Cloning</h3>
                      <a
                        href="https://try.elevenlabs.io/e7shgcs7r0ae"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full hover:bg-blue-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        ElevenLabs Pro
                      </a>
                      {userProfile?.elevenlabs_voice_id && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Voice Cloned
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Create a lifelike clone of your voice for text-to-speech conversion. Preserve your vocal presence for future generations.</p>
                  </div>
                </div>
                {expandedSection === 'voice' && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowVoiceRecording(true);
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Mic className="w-5 h-5" />
                      {userProfile?.elevenlabs_voice_id ? 'Manage Voice Clone' : 'Clone Your Voice'}
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <a
                        href="https://elevenlabs.io/voice-isolator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voice Isolator
                      </a>
                      
                      <a
                        href="https://try.elevenlabs.io/e7shgcs7r0ae"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Sign up
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Avatar */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'tavus' ? 'ring-2 ring-purple-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'tavus' ? null : 'tavus')}
              >
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Visual Avatar</h3>
                      <a
                        href="https://tavus.io/?ref=memoa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full hover:bg-purple-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Tavus Pro
                      </a>
                      {userProfile?.tavus_avatar_id && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Avatar Created
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Create a realistic visual avatar that can speak and interact with future viewers. Preserve your likeness and expressions.</p>
                  </div>
                </div>
                {expandedSection === 'tavus' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTavusCreation(true);
                      }}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-5 h-5" />
                      {userProfile?.tavus_avatar_id ? 'Manage Tavus Avatar' : 'Create Tavus Avatar'}
                    </button>
                  </div>
                )}
              </div>

              {/* 3D Avatar */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'avaturn' ? 'ring-2 ring-orange-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'avaturn' ? null : 'avaturn')}
              >
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">3D Avatar</h3>
                      <a
                        href="https://avaturn.me/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full hover:bg-orange-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Avaturn.me
                      </a>
                      {userProfile?.memoir_data?.avaturn_avatars?.avatars?.length > 0 && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Avatar Created
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Create a 3D avatar of yourself for interactive 3D experiences. Upload your own 3D model or create one with Avaturn.</p>
                  </div>
                </div>
                {expandedSection === 'avaturn' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAvaturnCreation(true);
                      }}
                      className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-5 h-5" />
                      {userProfile?.memoir_data?.avaturn_avatars?.avatars?.length > 0 ? 'Manage 3D Avatar' : 'Create 3D Avatar'}
                    </button>
                  </div>
                )}
              </div>

              {/* Portrait Generation */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'portraits' ? 'ring-2 ring-amber-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'portraits' ? null : 'portraits')}
              >
                <div className="flex items-start gap-4">
                  <Image className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">AI Portrait Generation</h3>
                      <div className="flex gap-1">
                        <a
                          href="https://www.midjourney.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full hover:bg-amber-500/30 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Midjourney
                        </a>
                      </div>
                      {userProfile?.memoir_data?.portraits?.generated?.length > 0 && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Portraits Created
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Generate artistic AI portraits in various styles to preserve your likeness in creative ways.</p>
                  </div>
                </div>
                {expandedSection === 'portraits' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPortraitGeneration(true);
                      }}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Image className="w-5 h-5" />
                      Generate AI Portraits
                    </button>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <a
                        href="https://www.midjourney.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Midjourney
                      </a>
                      <a
                        href="https://openai.com/sora"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Sora
                      </a>
                      <a
                        href="https://remini.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-colors text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Remini
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Narratives */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'narratives' ? 'ring-2 ring-emerald-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'narratives' ? null : 'narratives')}
              >
                <div className="flex items-start gap-4">
                  <PenTool className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Narratives Studio</h3>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full hover:bg-emerald-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Gemini AI
                      </a>
                      {narrativesData && Object.keys(narrativesData).some(key => Array.isArray(narrativesData[key]) && narrativesData[key].length > 0) && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          ✓ Stories Added
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Document your stories, memories, values, and wisdom. Create a narrative legacy of your experiences and perspectives.</p>
                  </div>
                </div>
                {expandedSection === 'narratives' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGeminiNarratives(true);
                      }}
                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Brain className="w-5 h-5" />
                      {narrativesData ? 'Manage Narratives' : 'Create Narratives'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-amber-500 bg-clip-text text-transparent">Memoir Content</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gallery Section */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'gallery' ? 'ring-2 ring-pink-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'gallery' ? null : 'gallery')}
              >
                <div className="flex items-start gap-4">
                  <Image className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Photo Gallery</h3>
                      {galleryData?.length > 0 && (
                        <div className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">
                          {galleryData.length} Items
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Upload and organize your photos and videos to preserve visual memories and important moments.</p>
                  </div>
                </div>
                {expandedSection === 'gallery' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGallery(true);
                      }}
                      className="w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Image className="w-5 h-5" />
                      {galleryData?.length > 0 ? 'Manage Gallery' : 'Create Gallery'}
                    </button>
                  </div>
                )}
              </div>

              {/* Family Tree */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'family-tree' ? 'ring-2 ring-green-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'family-tree' ? null : 'family-tree')}
              >
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Family Tree</h3>
                      {familyTreeData?.files?.length > 0 && (
                        <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          {familyTreeData.files.length} Files
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Document your family connections and preserve genealogy information for future generations.</p>
                  </div>
                </div>
                {expandedSection === 'family-tree' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFamilyTree(true);
                      }}
                      className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Users className="w-5 h-5" />
                      {familyTreeData?.files?.length > 0 ? 'Manage Family Tree' : 'Create Family Tree'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Media Links */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'media-links' ? 'ring-2 ring-amber-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'media-links' ? null : 'media-links')}
              >
                <div className="flex items-start gap-4">
                  <FileVideo className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Media Links</h3>
                      {mediaLinksData?.length > 0 && (
                        <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                          {mediaLinksData.length} Links
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Preserve links to videos, podcasts, and articles featuring you or your interests.</p>
                  </div>
                </div>
                {expandedSection === 'media-links' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMediaLinks(true);
                      }}
                      className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FileVideo className="w-5 h-5" />
                      {mediaLinksData?.length > 0 ? 'Manage Media Links' : 'Add Media Links'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Digital Documents */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'documents' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'documents' ? null : 'documents')}
              >
                <div className="flex items-start gap-4">
                  <BookOpen className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Digital Documents</h3>
                      {narrativesData?.documents?.length > 0 && (
                        <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                          {narrativesData.documents.length} Docs
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Upload important documents like personal writing, journals, or recipes to preserve your knowledge.</p>
                  </div>
                </div>
                {expandedSection === 'documents' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGeminiNarratives(true);
                      }}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Documents
                    </button>
                  </div>
                )}
              </div>
              
              {/* Personal Favorites */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'personal' ? 'ring-2 ring-indigo-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
              >
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Personal Preferences</h3>
                      {personalData && (
                        <div className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                          Items Added
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Document your favorite music, movies, books, quotes, foods, locations, and more.</p>
                  </div>
                </div>
                {expandedSection === 'personal' && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInitialPersonalPreferencesTab('favorites');
                        setShowPersonalPreferences(true);
                      }}
                      className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Heart className="w-5 h-5" />
                      {personalData ? 'Manage Preferences' : 'Add Preferences'}
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setInitialPersonalPreferencesTab('digital');
                        setShowPersonalPreferences(true);
                      }}
                      className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Globe className="w-5 h-5" />
                      Manage Digital Presence
                    </button>
                  </div>
                )}
              </div>
              
              {/* Gaming Preferences */}
              <div 
                className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'gaming' ? 'ring-2 ring-cyan-400' : 'hover:bg-white/10'}`}
                onClick={() => setExpandedSection(expandedSection === 'gaming' ? null : 'gaming')}
              >
                <div className="flex items-start gap-4">
                  <Gamepad2 className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">Gaming Preferences</h3>
                      {personalData?.gaming_preferences?.length > 0 && (
                        <div className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                          {personalData.gaming_preferences.length} Games
                        </div>
                      )}
                    </div>
                    <p className="text-white/70">Document your favorite games, gaming communities, friend codes, and gaming preferences.</p>
                  </div>
                </div>
                {expandedSection === 'gaming' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGamingPreferences(true);
                      }}
                      className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      {personalData?.gaming_preferences?.length > 0 ? 'Manage Gaming' : 'Add Gaming'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 3D Space Creation Button */}
            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Create 3D Memorial Space</h3>
                  <p className="text-white/70">Build a 3D interactive space to preserve your digital legacy for future visitors.</p>
                </div>
                <button 
                  onClick={() => navigate('/memento/profile-space', { state: { profileType: 'memoir' } })}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Visit 3D Space
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Interface Modals */}
        <AnimatePresence>
          {showVoiceRecording && (
            <VoiceRecordingInterface
              onClose={() => setShowVoiceRecording(false)}
              onVoiceCloned={handleVoiceCloned}
            />
          )}
          
          {showTavusCreation && (
            <TavusAvatarInterface
              onClose={() => setShowTavusCreation(false)}
              onAvatarCreated={handleTavusAvatarCreated}
            />
          )}
          
          {showAvaturnCreation && (
            <AvaturnAvatarInterface
              onClose={() => setShowAvaturnCreation(false)}
              onAvatarCreated={handleAvaturnAvatarCreated}
            />
          )}
          
          {showGeminiNarratives && (
            <GeminiNarrativesInterface
              onClose={() => setShowGeminiNarratives(false)}
              onNarrativesProcessed={handleNarrativesProcessed}
            />
          )}
          
          {showGamingPreferences && (
            <GamingPreferencesInterface
              onClose={() => setShowGamingPreferences(false)}
              onGamesStored={handleGamesStored} 
            />
          )}
          
          {showPersonalPreferences && (
            <PersonalPreferencesInterface
              onClose={() => setShowPersonalPreferences(false)}
              onPreferencesSaved={handlePersonalPreferencesSaved}
              initialTab={initialPersonalPreferencesTab}
            />
          )}
          
          {showMediaLinks && (
            <MediaLinksInterface
              onClose={() => setShowMediaLinks(false)}
              onMediaLinksSaved={handleMediaLinksSaved}
            />
          )}
          
          {showGallery && (
            <GalleryInterface
              onClose={() => setShowGallery(false)}
              onGallerySaved={handleGallerySaved}
              context="memoir"
            />
          )}
          
          {showFamilyTree && (
            <FamilyTreeInterface
              onClose={() => setShowFamilyTree(false)}
              onFamilyTreeSaved={handleFamilyTreeSaved}
            />
          )}
          
          {showPortraitGeneration && (
            <PortraitGenerationInterface
              onClose={() => setShowPortraitGeneration(false)}
              onPortraitsGenerated={handlePortraitsGenerated}
            />
          )}
        </AnimatePresence>
      </div>
      
      <Footer />
    </motion.div>
  );
}