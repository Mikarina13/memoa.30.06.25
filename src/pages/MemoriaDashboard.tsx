import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, User, LogOut, Mic, PenTool, Image, Brain, Heart, Volume2, ExternalLink, Gamepad2, RefreshCw, Clipboard, Users, FileVideo, Newspaper, Plus, Sparkles, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';
import { VoiceRecordingInterface } from '../components/VoiceRecordingInterface';
import { AvaturnAvatarInterface } from '../components/AvaturnAvatarInterface';
import { GeminiNarrativesInterface } from '../components/GeminiNarrativesInterface';
import { GamingPreferencesInterface } from '../components/GamingPreferencesInterface';
import { PersonalPreferencesInterface } from '../components/PersonalPreferencesInterface';
import { GalleryInterface } from '../components/GalleryInterface';
import { FamilyTreeInterface } from '../components/FamilyTreeInterface';
import { MediaLinksInterface } from '../components/MediaLinksInterface';
import { MemoriaProfileSelector } from '../components/MemoriaProfileSelector';
import { TributeImageInterface } from '../components/TributeImageInterface';
import { MemoirIntegrations, MemoriaProfile } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function MemoriaDashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showAvaturnCreation, setShowAvaturnCreation] = useState(false);
  const [showGeminiNarratives, setShowGeminiNarratives] = useState(false);
  const [showGamingPreferences, setShowGamingPreferences] = useState(false);
  const [showPersonalPreferences, setShowPersonalPreferences] = useState(false);
  const [initialPersonalPreferencesTab, setInitialPersonalPreferencesTab] = useState<'favorites' | 'digital'>('favorites');
  const [showFamilyTree, setShowFamilyTree] = useState(false);
  const [showMediaLinks, setShowMediaLinks] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showTributeImage, setShowTributeImage] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MemoriaProfile | null>(null);
  const [memoriaProfiles, setMemoriaProfiles] = useState<MemoriaProfile[]>([]);
  const [isCreatingProfile, setIsCreatingProfile] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [galleryData, setGalleryData] = useState<any>(null);
  const [personalData, setPersonalData] = useState<any>(null);
  const [familyTreeData, setFamilyTreeData] = useState<any>(null);
  const [mediaLinksData, setMediaLinksData] = useState<any>(null);
  
  // Ensure user has accepted terms
  useRequireTermsAcceptance();
  
  useEffect(() => {
    document.title = 'MEMORIA Dashboard';
    
    if (!loading && !user) {
      navigate('/memoria');
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    if (user) {
      loadMemoriaProfiles();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedProfile) {
      loadProfileData(selectedProfile.id);
    }
  }, [selectedProfile]);

  const loadMemoriaProfiles = async () => {
    try {
      const profiles = await MemoirIntegrations.getMemoriaProfiles(user.id);
      setMemoriaProfiles(profiles);
      
      // If profiles exist, select the first one
      if (profiles.length > 0) {
        setSelectedProfile(profiles[0]);
        setIsCreatingProfile(false);
      } else {
        setIsCreatingProfile(true);
      }
    } catch (error) {
      console.error('Error loading Memoria profiles:', error);
    }
  };
  
  const loadProfileData = async (profileId: string) => {
    try {
      setIsRefreshing(true);
      
      // Load profile data
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, profileId);
      setIntegrationStatus(profile.integration_status);
      
      // Load personal preferences
      const personalPrefs = await MemoirIntegrations.getPersonalPreferences(user.id, profileId);
      setPersonalData(personalPrefs);
      
      // Load gallery items
      const galleryItems = await MemoirIntegrations.getGalleryItems(user.id, profileId);
      setGalleryData(galleryItems);
      
      // Load family tree data
      setFamilyTreeData(profile.profile_data?.family_tree);
      
      // Load media links
      setMediaLinksData(profile.profile_data?.media_links || []);
      
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileSelect = (profile: MemoriaProfile) => {
    setSelectedProfile(profile);
    setIsCreatingProfile(false);
  };

  const handleProfileCreate = (profile: MemoriaProfile) => {
    setMemoriaProfiles(prev => [...prev, profile]);
    setSelectedProfile(profile);
    setIsCreatingProfile(false);
  };

  const handleVoiceCloned = async (voiceId: string) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
      setShowVoiceRecording(false);
    }
  };

  const handleAvaturnAvatarCreated = async (avatarData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
      setShowAvaturnCreation(false);
    }
  };

  const handleNarrativesProcessed = async (narrativeData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
      setShowGeminiNarratives(false);
    }
  };

  const handleGamesStored = async (gamingData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
      setShowGamingPreferences(false);
    }
  };

  const handlePersonalPreferencesSaved = async (preferencesData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
    }
  };

  const handleMediaLinksSaved = async (mediaLinksData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
    }
  };

  const handleGallerySaved = async (galleryItems: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
      setShowGallery(false);
    }
  };

  const handleFamilyTreeSaved = async (treeData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
    }
  };
  
  const handleTributeImagesSaved = async (imageData: any) => {
    if (selectedProfile) {
      await loadProfileData(selectedProfile.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'error': return 'Error';
      default: return 'Not Started';
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
            {selectedProfile && (
              <button
                onClick={() => loadProfileData(selectedProfile.id)}
                disabled={isRefreshing}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            <button 
              onClick={() => navigate('/memoria/settings')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="text-white/80 hover:text-white transition-colors"
            >
              <User className="w-6 h-6" />
            </button>
            <button 
              onClick={logout}
              className="text-white/80 hover:text-white transition-colors"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          {isCreatingProfile
            ? "Create a Memoria"
            : `Memoria Dashboard${selectedProfile ? ': ' + selectedProfile.name : ''}`}
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          {isCreatingProfile 
            ? "Create a digital memorial to preserve memories of your loved one."
            : "A space to preserve and celebrate the memories, voice, and presence of your loved one."}
        </p>

        {isCreatingProfile ? (
          <MemoriaProfileSelector 
            onSelectProfile={handleProfileSelect}
            onCreateProfile={handleProfileCreate}
          />
        ) : (
          <>
            {/* Profile Selector */}
            <div className="bg-white/5 rounded-lg p-4 mb-8 flex justify-between items-center border border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreatingProfile(true)}
                  className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-medium text-white">{selectedProfile?.name}</h3>
                  <p className="text-white/60 text-sm">
                    {selectedProfile?.relationship || 'No relationship specified'}
                    {selectedProfile?.is_celebrity && ' • Celebrity Tribute'}
                  </p>
                </div>
              </div>
              <select
                onChange={(e) => {
                  const profileId = e.target.value;
                  const profile = memoriaProfiles.find(p => p.id === profileId);
                  if (profile) {
                    setSelectedProfile(profile);
                  }
                }}
                value={selectedProfile?.id || ''}
                className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                {memoriaProfiles.map(profile => (
                  <option key={profile.id} value={profile.id} className="bg-black">
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Integration Status Overview */}
            {integrationStatus && (
              <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border border-white/10 mb-8">
                <h2 className="text-xl font-bold mb-4 text-center text-pink-400">Integration Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-5 h-5 text-blue-400" />
                      <span className="font-medium">ElevenLabs Voice</span>
                    </div>
                    <div className={`text-sm ${getStatusColor(integrationStatus.elevenlabs?.status || 'not_started')}`}>
                      {getStatusText(integrationStatus.elevenlabs?.status || 'not_started')}
                    </div>
                    {selectedProfile?.elevenlabs_voice_id && (
                      <div className="text-xs text-white/60 mt-1">
                        Voice ID: {selectedProfile.elevenlabs_voice_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium">Gemini AI</span>
                    </div>
                    <div className={`text-sm ${getStatusColor(integrationStatus.gemini?.status || 'not_started')}`}>
                      {getStatusText(integrationStatus.gemini?.status || 'not_started')}
                    </div>
                    {integrationStatus.gemini?.narratives_processed && (
                      <div className="text-xs text-white/60 mt-1">
                        Narratives: Processed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Dashboard Content */}
            <div className="space-y-8 mb-12">
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-8 rounded-xl border border-purple-500/20">
                <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">Memoria Creation Tools</h2>
                
                <div className="space-y-6">
                  {/* Voice Recreation */}
                  <div 
                    className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'voice' ? 'ring-2 ring-blue-400' : 'hover:bg-white/10'}`}
                    onClick={() => setExpandedSection(expandedSection === 'voice' ? null : 'voice')}
                  >
                    <div className="flex items-start gap-4">
                      <Volume2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">Voice Recreation</h3>
                          <a
                            href="https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full hover:bg-blue-500/30 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            ElevenLabs Pro
                          </a>
                          {integrationStatus?.elevenlabs?.voice_cloned && (
                            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              ✓ Voice Created
                            </div>
                          )}
                        </div>
                        <p className="text-white/70">Upload recordings of your loved one's voice to recreate their vocal presence with AI technology.</p>
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
                          {integrationStatus?.elevenlabs?.voice_cloned ? 'Manage Voice' : 'Create Voice Clone'}
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
                            href="https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Get 3 Months Free
                          </a>
                        </div>
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
                          <h3 className="font-semibold text-lg">3D Avatars</h3>
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
                          {integrationStatus?.avaturn?.avatar_created && (
                            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              ✓ Avatar Ready
                            </div>
                          )}
                        </div>
                        <p className="text-white/70">Upload 3D models or create avatars from photos of your loved one for interactive 3D experiences.</p>
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
                          {integrationStatus?.avaturn?.avatar_created ? 'Manage 3D Avatar' : 'Create 3D Avatar'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Tribute Images */}
                  <div 
                    className={`p-6 bg-white/5 rounded-lg cursor-pointer transition-all ${expandedSection === 'tribute' ? 'ring-2 ring-amber-400' : 'hover:bg-white/10'}`}
                    onClick={() => setExpandedSection(expandedSection === 'tribute' ? null : 'tribute')}
                  >
                    <div className="flex items-start gap-4">
                      <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">AI Tributes</h3>
                          <a
                            href="https://openai.com/dall-e-3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full hover:bg-amber-500/30 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            DALL-E
                          </a>
                          {selectedProfile?.profile_data?.tribute_images?.length > 0 && (
                            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              ✓ Images Created
                            </div>
                          )}
                        </div>
                        <p className="text-white/70">Create beautiful AI-generated artistic interpretations of your loved one in different styles.</p>
                      </div>
                    </div>
                    {expandedSection === 'tribute' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setShowTributeImage(true); 
                            } else {
                              alert('Please select a memorial profile first');
                            }
                          }}
                          className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          Generate AI Tributes
                        </button>
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
                          <h3 className="font-semibold text-lg">Narratives & Stories</h3>
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
                        </div>
                        <p className="text-white/70">Preserve stories, memories, and moments about your loved one. Document their life experiences, values, and personality.</p>
                      </div>
                    </div>
                    {expandedSection === 'narratives' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setShowGeminiNarratives(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
                          }}
                          className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Brain className="w-5 h-5" />
                          Create Narratives
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
                <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-pink-400 to-amber-500 bg-clip-text text-transparent">Memoria Content</h2>
                
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
                        <p className="text-white/70">Upload and organize photos and videos of your loved one to preserve visual memories.</p>
                      </div>
                    </div>
                    {expandedSection === 'gallery' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setShowGallery(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
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
                        <p className="text-white/70">Document your loved one's family connections and preserve genealogy information.</p>
                      </div>
                    </div>
                    {expandedSection === 'family-tree' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setShowFamilyTree(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
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
                        <p className="text-white/70">Preserve links to videos, podcasts, and articles featuring your loved one.</p>
                      </div>
                    </div>
                    {expandedSection === 'media-links' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setShowMediaLinks(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
                          }}
                          className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <FileVideo className="w-5 h-5" />
                          {mediaLinksData?.length > 0 ? 'Manage Media Links' : 'Add Media Links'}
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
                          <h3 className="font-semibold text-lg">Personal Favorites</h3>
                          {personalData && (
                            <div className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                              Items Added
                            </div>
                          )}
                        </div>
                        <p className="text-white/70">Document your loved one's favorite songs, movies, books, quotes, and locations.</p>
                      </div>
                    </div>
                    {expandedSection === 'personal' && (
                      <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setInitialPersonalPreferencesTab('favorites');
                              setShowPersonalPreferences(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
                          }}
                          className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Heart className="w-5 h-5" />
                          {personalData ? 'Manage Favorites' : 'Add Favorites'}
                        </button>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedProfile) {
                              setInitialPersonalPreferencesTab('digital');
                              setShowPersonalPreferences(true);
                            } else {
                              alert('Please select a memorial profile first');
                            }
                          }}
                          className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Gamepad2 className="w-5 h-5" />
                          Manage Digital Presence
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Gaming Preferences */}
                <div 
                  className="mt-6 p-6 bg-white/5 rounded-lg cursor-pointer transition-all"
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
                        <p className="text-white/70">Document your loved one's favorite games, gaming communities, friend codes, and gaming preferences.</p>
                      </div>
                    </div>
                </div>
                {expandedSection === 'gaming' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedProfile) {
                          setShowGamingPreferences(true);
                        } else {
                          alert('Please select a memorial profile first');
                        }
                      }}
                      className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      {personalData?.gaming_preferences?.length > 0 ? 'Manage Gaming' : 'Add Gaming'}
                    </button>
                  </div>
                )}
              </div>
                {/* 3D Space Creation Button */}
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/20">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">Create 3D Memoria Space</h3>
                      <p className="text-white/70">Build an interactive 3D Memoria space to preserve your loved one's memory.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (selectedProfile) {
                          navigate('/memento/profile-space', { 
                            state: { 
                              profileType: 'memoria',
                              memoriaProfileId: selectedProfile.id
                            }
                          });
                        } else {
                          alert('Please select a memorial profile first');
                        }
                      }}
                      className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      Visit Memoria Space
                    </button>
                  </div>
                </div>
            </div>
          </>
        )}
        
        {/* Interface Modals */}
        <AnimatePresence>
          {showVoiceRecording && selectedProfile && (
            <VoiceRecordingInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowVoiceRecording(false)}
              onVoiceCloned={handleVoiceCloned}
            />
          )}
          
          {showAvaturnCreation && selectedProfile && (
            <AvaturnAvatarInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowAvaturnCreation(false)}
              onAvatarCreated={handleAvaturnAvatarCreated}
            />
          )}
          
          {showGeminiNarratives && selectedProfile && (
            <GeminiNarrativesInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowGeminiNarratives(false)}
              onNarrativesProcessed={handleNarrativesProcessed}
            />
          )}
          
          {showGamingPreferences && selectedProfile && (
            <GamingPreferencesInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowGamingPreferences(false)}
              onGamesStored={handleGamesStored} 
            />
          )}
          
          {showPersonalPreferences && selectedProfile && (
            <PersonalPreferencesInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowPersonalPreferences(false)}
              onPreferencesSaved={handlePersonalPreferencesSaved}
              initialTab={initialPersonalPreferencesTab}
            />
          )}
          
          {showMediaLinks && selectedProfile && (
            <MediaLinksInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowMediaLinks(false)}
              onMediaLinksSaved={handleMediaLinksSaved}
            />
          )}
          
          {showGallery && selectedProfile && (
            <GalleryInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowGallery(false)}
              onGallerySaved={handleGallerySaved}
              context="memoria"
            />
          )}
          
          {showFamilyTree && selectedProfile && (
            <FamilyTreeInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowFamilyTree(false)}
              onFamilyTreeSaved={handleFamilyTreeSaved}
            />
          )}
          
          {showTributeImage && selectedProfile && (
            <TributeImageInterface
              memoriaProfileId={selectedProfile.id}
              onClose={() => setShowTributeImage(false)}
              onImagesGenerated={handleTributeImagesSaved}
            />
          )}
        </AnimatePresence>
      </div>
      
      <Footer />
    </motion.div>
  );
}