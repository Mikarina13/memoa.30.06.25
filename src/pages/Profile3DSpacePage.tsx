import { useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion'; 
import { ArrowLeft, Loader, X, RefreshCw, Settings, SlidersHorizontal as SliderHorizontal, Sparkles, ChevronDown, Cog, Image } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EnhancedStars } from '../components/EnhancedStars';
import { ProfileData3DDisplay } from '../components/ProfileData3DDisplay';
import { SpaceCustomizer, SpaceCustomizationSettings } from '../components/SpaceCustomizer'; 
import { Gallery3DCarousel, CarouselCameraControls } from '../components/Gallery3DCarousel';
import { GalleryNavigationFooter } from '../components/GalleryNavigationFooter';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations, MemoriaProfile } from '../lib/memoir-integrations';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';
import { TributeImageInterface } from '../components/TributeImageInterface';
import { TributeImageDetail } from '../components/details/TributeImageDetail';
import { CAMERA_POSITION_PROFILE_SPACE, SPACE_THEMES } from '../utils/constants';

// Import detail components
import { PersonalFavoritesDetail } from '../components/details/PersonalFavoritesDetail';
import { DigitalPresenceDetail } from '../components/details/DigitalPresenceDetail';
import { GamingPreferencesDetail } from '../components/details/GamingPreferencesDetail';
import { VoiceDetail } from '../components/details/VoiceDetail';
import { TavusAvatarDetail } from '../components/details/TavusAvatarDetail';
import { AvaturnAvatarDetail } from '../components/details/AvaturnAvatarDetail';
import { NarrativesDetail } from '../components/details/NarrativesDetail';
import { GalleryDetail } from '../components/details/GalleryDetail';
import { PersonalityDetail } from '../components/details/PersonalityDetail';
import { FamilyTreeDetail } from '../components/details/FamilyTreeDetail';
import { MediaLinksDetail } from '../components/details/MediaLinksDetail';

// Default customization settings
const DEFAULT_SETTINGS: SpaceCustomizationSettings = {
  itemSizeMultiplier: 1,
  itemDistanceFromCenter: 10,
  verticalSpread: 2,
  rotationSpeed: 0.02,
  autoRotate: false,
  colorTheme: 'cosmos',
  backgroundIntensity: 0.5,
  iconScale: 1,
  itemColorOverrides: {},
  itemVisible: {},
  itemPositionOverrides: {},
  particleDensity: 1,
  particleSize: 1,
  particleSpeed: 1
};

// Component that uses R3F hooks - must be inside Canvas
function ProfileSpaceControls({ settings, isGalleryActive }: { settings: SpaceCustomizationSettings, isGalleryActive: boolean }) {
  // Always call the hook, but pass enabled state to control when it's active
  useKeyboardControls(0.15, !isGalleryActive); // Slightly slower movement for better control
  return null;
}

export function Profile3DSpacePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Extract profile type from location state - must be at the top before any useState calls
  const { profileType = 'memoir', memoriaProfileId, showProfileSelector: initialShowProfileSelector, userId: initialUserId } = location.state || {};
  
  // State for profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  
  // State for detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: string;
    data: any;
  } | null>(null);
  const [showTributeImageInterface, setShowTributeImageInterface] = useState(false);
  const [showGalleryCarousel, setShowGalleryCarousel] = useState(false);
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<any[]>([]);
  const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
  
  // State for customization
  const [memoriaProfiles, setMemoriaProfiles] = useState<MemoriaProfile[]>([]);
  const [showProfileSelector, setShowProfileSelector] = useState(initialShowProfileSelector || false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizationSettings, setCustomizationSettings] = useState<SpaceCustomizationSettings>(DEFAULT_SETTINGS);
  
  // Generate the list of item types for the customizer
  const itemTypes = useMemo(() => [
    { id: 'personal_favorites', name: 'Personal Favorites', color: '#ec4899' },
    { id: 'digital_presence', name: 'Digital Presence', color: '#a855f7' },
    { id: 'gaming_preferences', name: 'Gaming Preferences', color: '#06b6d4' },
    { id: 'voice', name: 'Voice Clone', color: '#3b82f6' },
    { id: 'tavus_avatar', name: 'Video Avatar', color: '#8b5cf6' },
    { id: 'avaturn_avatars', name: '3D Avatars', color: '#f97316' },
    { id: 'narratives', name: 'Narratives', color: '#10b981' },
    { id: 'gallery', name: 'Gallery', color: '#ec4899' },
    { id: 'personality', name: 'Personality', color: '#f43f5e' },
    { id: 'family_tree', name: 'Family Tree', color: '#22c55e' },
    { id: 'ai_tribute_images', name: 'AI Tributes', color: '#f97316' },
    { id: 'media_links', name: 'Media Links', color: '#f59e0b' },
    { id: 'documents', name: 'Documents', color: '#3b82f6' }
  ], []);
  
  // Load memoria profiles when in memoria mode
  useEffect(() => {
    if (profileType === 'memoria' && user) {
      loadMemoriaProfiles();
    }
  }, [profileType, user]);

  const loadMemoriaProfiles = async () => {
    try {
      const profiles = await MemoirIntegrations.getMemoriaProfiles(user.id);
      setMemoriaProfiles(profiles);
      console.log(`Loaded ${profiles.length} Memoria profiles`);
    } catch (error) {
      console.error('Error loading Memoria profiles:', error);
    }
  };

  // Ensure user has accepted terms
  useRequireTermsAcceptance();

  // Debug log profile type and ID
  useEffect(() => {
    console.log(`Loading 3D space for ${profileType}${memoriaProfileId ? ` with ID: ${memoriaProfileId}` : ''}${initialUserId ? ` with userId: ${initialUserId}` : ''}`);
    document.title = profileType === 'memoir' ? 'MEMOIR 3D Space' : 'MEMORIA 3D Space';
  }, [profileType, memoriaProfileId, initialUserId]);
  
  // Load profile data and customization settings when component mounts
  useEffect(() => {
    const loadData = async () => {
      console.log('Starting to load profile data...');
      console.log('Profile type:', profileType, 'Memoria Profile ID:', memoriaProfileId, 'User ID:', initialUserId);
      try {
        setIsLoading(true);
        setLoadError(null);
        
        if (user) {
          console.log(`Loading profile data for ${profileType}${memoriaProfileId ? ` with ID: ${memoriaProfileId}` : ''}${initialUserId ? ` with userId: ${initialUserId}` : ''}`);
          
          // Load profile data
          const profile = await MemoirIntegrations.getMemoirProfile(
            initialUserId || user.id, // Use initialUserId if provided (for viewing other people's profiles)
            memoriaProfileId
          );
          console.log('Profile data loaded:', profile);
          
          // Set profile name for display
          if (memoriaProfileId && profile) {
            setProfileName(profile.name || 'Memoria Profile');
            console.log('Memoria Profile Name:', profile.name);
          } else {
            setProfileName('My MEMOIR Space');
          }
          
          // Determine which data object to use (profile_data for memoria, memoir_data for memoir)
          const dataObject = memoriaProfileId ? profile?.profile_data : profile?.memoir_data;
          
          console.log('Data object source:', memoriaProfileId ? 'profile_data' : 'memoir_data');
          
          if (!dataObject) {
            setLoadError(`Failed to load ${profileType} profile data`);
            console.warn(`No ${memoriaProfileId ? 'profile_data' : 'memoir_data'} found in profile:`, profile);
          } else {
            // Log detailed data structure for debugging
            console.log('Profile data structure:', {
              hasPersonalPreferences: !!dataObject.preferences?.personal,
              personalPreferencesData: dataObject.preferences?.personal,
              hasTributeImages: !!dataObject.tribute_images?.length,
              tributeImagesCount: dataObject.tribute_images?.length || 0,
              hasNarratives: !!dataObject.narratives,
              hasVoiceId: !!profile.elevenlabs_voice_id,
              hasAvatarId: !!profile.tavus_avatar_id,
              hasAvaturnAvatars: !!dataObject.avaturn_avatars?.avatars?.length,
              avaturnAvatarsCount: dataObject.avaturn_avatars?.avatars?.length || 0,
              hasMediaLinks: !!dataObject.media_links?.length,
              mediaLinksCount: dataObject.media_links?.length || 0,
              hasFamilyTree: !!dataObject.family_tree?.files?.length,
              familyTreeFilesCount: dataObject.family_tree?.files?.length || 0
            });
          }
          
          // Load customization settings if available
          if (dataObject?.space_customization?.settings) {
            setCustomizationSettings(dataObject.space_customization.settings);
          }
          
          setProfileData(profile);
          
          // Load gallery items
          const galleryItems = await MemoirIntegrations.getGalleryItems(
            initialUserId || user.id, // Use initialUserId if provided
            memoriaProfileId
          );
          console.log(`Loaded ${galleryItems?.length || 0} gallery items`);
          setGalleryItems(galleryItems || []);
          
          // Add gallery items to profile data for easy access
          if (profile) {
            profile.gallery_items = galleryItems;
            console.log('Added gallery items to profile data:', galleryItems.length);
            // Log profile data structure for debugging
            console.log('Profile data structure before loading personal preferences:', {
              hasMemoriaData: !!profile.profile_data,
              hasMemoriaPreferences: !!profile.profile_data?.preferences?.personal,
              hasMemoirData: !!profile.memoir_data,
              hasMemoirPreferences: !!profile.memoir_data?.preferences?.personal
            });
            
            
            // Load media links if they exist
            if (!profile.memoir_data?.media_links && !profile.profile_data?.media_links) {
              const mediaLinksData = await MemoirIntegrations.getMediaLinks(initialUserId || user.id, memoriaProfileId);
              if (mediaLinksData && mediaLinksData.length > 0) {
                if (memoriaProfileId) {
                  // For Memoria profiles
                  if (!profile.profile_data) profile.profile_data = {};
                  profile.profile_data.media_links = mediaLinksData;
                } else {
                  // For Memoir profiles
                  if (!profile.memoir_data) profile.memoir_data = {};
                  profile.memoir_data.media_links = mediaLinksData;
                }
                console.log(`Loaded and added ${mediaLinksData.length} media links to profile data`);
              }
            }
            
            // Check if we have personal preferences data loaded
            const personalData = memoriaProfileId 
              ? profile.profile_data?.preferences?.personal 
              : profile.memoir_data?.preferences?.personal;
              
            if (!personalData) {
              // Try loading personal preferences directly
              const personalPrefs = await MemoirIntegrations.getPersonalPreferences(
                initialUserId || user.id, 
                memoriaProfileId || undefined
              );
              if (personalPrefs) {
                console.log('Loaded personal preferences:', personalPrefs);
                if (memoriaProfileId) {
                    console.log('Adding personal preferences to profile_data for Memoria profile');
                    if (!profile.profile_data) profile.profile_data = {};
                    if (!profile.profile_data.preferences) profile.profile_data.preferences = {};
                    profile.profile_data.preferences.personal = personalPrefs;
                } else {
                    console.log('Adding personal preferences to memoir_data');
                    // For Memoir profiles
                    if (!profile.memoir_data) {
                      profile.memoir_data = {};
                      console.log('Created memoir_data object');
                    }
                    if (!profile.memoir_data.preferences) {
                      profile.memoir_data.preferences = {};
                      console.log('Created memoir_data.preferences object');
                    }
                    profile.memoir_data.preferences.personal = personalPrefs; 
                    console.log('Set memoir_data.preferences.personal to:', personalPrefs);
                }
                console.log('Personal preferences loaded and added:', personalPrefs);
              }
            }
            
            // Final check of profile data structure
            console.log('Final profile data structure:', {
              hasMemoriaData: !!profile.profile_data,
              hasMemoriaPreferences: !!profile.profile_data?.preferences?.personal,
              hasMemoriaAvaturn: !!profile.profile_data?.avaturn_avatars,
              hasMemoriaTributeImages: !!profile.profile_data?.tribute_images,
              
              hasMemoirData: !!profile.memoir_data,
              hasMemoirPreferences: !!profile.memoir_data?.preferences?.personal,
              hasMemoirAvaturn: !!profile.memoir_data?.avaturn_avatars,
              hasMemoirTributeImages: !!profile.memoir_data?.tribute_images
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error instanceof Error ? error.message : error);
        setLoadError(`Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, profileType, memoriaProfileId, initialUserId]);
  
  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/memento');
    }
  }, [navigate, user, loading]);
  
  // Handle profile change
  const handleProfileChange = (newProfileId: string) => {
    // Navigate to the same page but with the new profile ID
    navigate('/memento/profile-space', { 
      state: { 
        profileType: 'memoria',
        memoriaProfileId: newProfileId
      },
      replace: true // Replace current history entry to avoid back button issues
    });
  };

  // Handle item click
  const handleItemClick = (itemType: string, itemData: any) => {
    // For personality, navigate to the dedicated page instead of showing a modal
    console.log('Item clicked:', itemType, itemData);

    // Special handling for gallery to show 3D carousel
    if (itemType === 'gallery') {
      // Filter out any AI tribute images from the gallery items
      const filteredItems = itemData.filter((item: any) => {
        if (!item.metadata) return true;
        
        // Check multiple possible tribute indicators
        const isTribute = 
          item.metadata.tribute === true || 
          item.metadata.isTribute === true ||
          (item.metadata.type === 'tribute') ||
          (item.tags && item.tags.includes('tribute')) ||
          (item.title && item.title.toLowerCase().includes('tribute'));
        
        return !isTribute;
      });
      
      setSelectedGalleryItems(filteredItems);
      setGalleryCurrentIndex(0); // Reset index to first item
      setShowGalleryCarousel(true);
      return;
    }
    
    if (itemType === 'personality') {
      navigate('/personality-test', { 
        state: { 
          memoriaProfileId: memoriaProfileId,
          returnPath: '/memento/profile-space',
          profileType
        }
      });
      return;
    }
    
    setSelectedItem({ type: itemType, data: itemData });
    setShowDetailModal(true);
  };
  
  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };
  
  // Handle customization settings change
  const handleSettingsChange = (newSettings: SpaceCustomizationSettings) => {
    setCustomizationSettings(newSettings);
  };
  
  // Handle save customization settings
  const handleSaveCustomization = () => {
    console.log('Saved customization settings');
    // The actual save is handled in the SpaceCustomizer component
  };

  // Handle gallery navigation
  const handleGalleryPrev = () => {
    setGalleryCurrentIndex(prev => 
      prev === 0 ? selectedGalleryItems.length - 1 : prev - 1
    );
  };

  const handleGalleryNext = () => {
    setGalleryCurrentIndex(prev => 
      prev === selectedGalleryItems.length - 1 ? 0 : prev + 1
    );
  };

  const handleGallerySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * selectedGalleryItems.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), selectedGalleryItems.length - 1);
    setGalleryCurrentIndex(adjustedIndex);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    console.log('Manual refresh triggered');
    try {
      // Reload all data
      const profile = await MemoirIntegrations.getMemoirProfile(
        initialUserId || user.id,
        memoriaProfileId
      );
      const galleryItems = await MemoirIntegrations.getGalleryItems(
        initialUserId || user.id,
        memoriaProfileId
      );
      
      // Update state
      if (profile) {
        profile.gallery_items = galleryItems;
        
        // Ensure we have the personal preferences data
        if (!profile.profile_data?.preferences?.personal && !profile.memoir_data?.preferences?.personal) {
          console.log('Fetching personal preferences during refresh');
          const personalPrefs = await MemoirIntegrations.getPersonalPreferences(
            initialUserId || user.id, 
            memoriaProfileId || undefined
          );
          if (personalPrefs) {
            if (memoriaProfileId) {
              if (!profile.profile_data) profile.profile_data = {};
              if (!profile.profile_data.preferences) profile.profile_data.preferences = {};
              profile.profile_data.preferences.personal = personalPrefs;
            } else {
              if (!profile.memoir_data) profile.memoir_data = {};
              if (!profile.memoir_data.preferences) profile.memoir_data.preferences = {};
              profile.memoir_data.preferences.personal = personalPrefs;
            }
            console.log('Added personal preferences during refresh:', personalPrefs);
          }
        }
        
        setProfileData(profile);
        setGalleryItems(galleryItems || []);
        console.log('Profile data refreshed successfully');
        
        // Set profile name for display
        if (memoriaProfileId) {
          setProfileName(profile.name || 'Memoria Profile');
        } else {
          setProfileName('My MEMOIR Space');
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setLoadError(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the appropriate camera position based on settings
  const cameraPosition = useMemo(() => {
    return [0, 10, 40 * (1 / Math.max(customizationSettings.itemSizeMultiplier, 0.5))];
  }, [customizationSettings.itemSizeMultiplier]);
  
  // Calculate star count based on density setting
  const starCount = Math.floor(8000 * customizationSettings.particleDensity);
  
  // Show loading while checking authentication
  if (loading || isLoading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
        <span className="mt-4 text-white">Loading 3D Space...</span>
        <span className="mt-2 text-white/60 text-sm">
          {profileType === 'memoir' ? 'Preparing your personal 3D space' : 'Preparing memorial 3D space'}
        </span>
      </div>
    );
  }

  // Show error if load failed
  if (loadError) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-lg">
          <h2 className="text-xl font-bold text-white mb-4">Error Loading Space</h2>
          <p className="text-white/70 mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/memento')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Return to Home
            </button>
            <button 
              onClick={handleRefresh}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-black relative overflow-hidden"
    >
      <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
        <button
          onClick={() => navigate('/memento')}
          className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors font-[Orbitron]"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>
      
      <div className="fixed top-8 right-8 z-50">
        <div className="flex items-center gap-2">
          <div 
            className={`px-4 py-2 bg-black/40 backdrop-blur-sm rounded-lg border ${showProfileSelector ? 'border-purple-400/30' : 'border-white/10'} cursor-pointer transition-colors hover:bg-black/60 group`}
            onClick={() => profileType === 'memoria' && memoriaProfiles.length > 1 && setShowProfileSelector(!showProfileSelector)}
          >
            <span className="text-white/80 font-[Orbitron]">
              {profileName || (profileType === 'memoir' ? 'MEMOIR 3D Space' : 'MEMORIA 3D Space')}
            </span>
            {profileType === 'memoria' && memoriaProfiles.length > 1 && (
              <ChevronDown className={`inline-block ml-2 w-4 h-4 transition-transform ${showProfileSelector ? 'rotate-180' : ''} text-white/60 group-hover:text-white/80`} />
            )}
            
            {/* Profile Selector Dropdown */}
            <AnimatePresence>
              {showProfileSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-sm border border-purple-400/30 rounded-lg shadow-xl overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2">
                    <div className="max-h-60 overflow-y-auto">
                      {memoriaProfiles.map(profile => (
                        <button
                          key={profile.id}
                          onClick={() => handleProfileChange(profile.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            profile.id === memoriaProfileId 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${profile.id === memoriaProfileId ? 'bg-purple-400' : 'bg-white/40'}`}></div>
                            <span>{profile.name}</span>
                          </div>
                          {profile.relationship && (
                            <div className="text-xs text-white/50 ml-4">{profile.relationship}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Settings Button */}
          <button 
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="p-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
            title="Customize Space"
          >
            <Cog className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <Canvas camera={{ position: cameraPosition, fov: 75 }}>
        <Suspense fallback={
          <Html center>
            <div className="text-white text-xl bg-black/80 p-6 rounded-lg shadow-2xl"> 
              <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
              <span>Loading 3D elements...</span>
            </div>
          </Html>
        }>
          <ProfileSpaceControls settings={customizationSettings} isGalleryActive={showGalleryCarousel} />
          <EnhancedStars 
            count={starCount}
            size={customizationSettings.particleSize}
            speed={customizationSettings.particleSpeed}
            color={SPACE_THEMES[customizationSettings.colorTheme as keyof typeof SPACE_THEMES]?.particleColor || '#ffffff'}
          />

          {/* 3D Gallery Carousel */}
          {showGalleryCarousel && selectedGalleryItems.length > 0 && (
            <Gallery3DCarousel 
              galleryItems={selectedGalleryItems} 
              onClose={() => setShowGalleryCarousel(false)}
              onItemSelect={(item) => {
                setSelectedItem({ type: 'gallery', data: [item] });
                setShowDetailModal(true);
                setShowGalleryCarousel(false);
              }}
              currentIndex={galleryCurrentIndex}
              onIndexChange={setGalleryCurrentIndex}
            />
          )}
          
          {/* Only render 3D icons when modal is NOT visible to prevent them from showing through */}
          <Suspense fallback={null}>
            {profileData && !showDetailModal && !showGalleryCarousel && (
              <ProfileData3DDisplay 
                profileData={profileData} 
                onItemClick={handleItemClick}
                customizationSettings={customizationSettings}
              />
            )}
          </Suspense>
          
          {/* Only use OrbitControls when not viewing the gallery carousel */}
          {!showGalleryCarousel && (
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={customizationSettings.autoRotate} 
              autoRotateSpeed={customizationSettings.rotationSpeed * 50}
              rotateSpeed={0.5}
              zoomSpeed={0.8}
              panSpeed={0.8}
              target={[0, 0, 0]}
              minDistance={5}
              maxDistance={40}
              maxPolarAngle={Math.PI * 0.85}
              minPolarAngle={0.1}
            />
          )}
          
          <Environment preset={SPACE_THEMES[customizationSettings.colorTheme as keyof typeof SPACE_THEMES]?.environmentPreset as any || 'night'} />
          <ambientLight intensity={SPACE_THEMES[customizationSettings.colorTheme as keyof typeof SPACE_THEMES]?.ambientLightIntensity || 0.3} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={SPACE_THEMES[customizationSettings.colorTheme as keyof typeof SPACE_THEMES]?.directionalLightIntensity || 0.8}
            color={SPACE_THEMES[customizationSettings.colorTheme as keyof typeof SPACE_THEMES]?.directionalLightColor || '#ffffff'}
          />
        </Suspense>
      </Canvas>
      
      {/* Manual Refresh Button */}
      <button 
        onClick={handleRefresh}
        className="fixed top-20 right-8 p-3 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-colors z-40" 
        title="Refresh Data"
      >
        <RefreshCw className="w-5 h-5" />
      </button>
      
      {/* Gallery Button - Quick access to gallery carousel */}
      {galleryItems.length > 0 && (
        <button 
          onClick={() => {
            // Filter out tribute images
            const filteredItems = galleryItems.filter(item => {
              if (!item.metadata) return true;
              
              // Check multiple possible tribute indicators
              const isTribute = 
                item.metadata.tribute === true || 
                item.metadata.isTribute === true ||
                (item.metadata.type === 'tribute') ||
                (item.tags && item.tags.includes('tribute')) ||
                (item.title && item.title.toLowerCase().includes('tribute'));
              
              return !isTribute;
            });
            
            setSelectedGalleryItems(filteredItems);
            setGalleryCurrentIndex(0); // Reset to first image
            setShowGalleryCarousel(true);
          }}
          className="fixed top-36 right-8 p-3 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-colors z-40" 
          title="View Gallery"
        >
          <Image className="w-5 h-5" />
        </button>
      )}
      
      {/* Space Customizer */}
      <AnimatePresence>
        {showCustomizer && (
          <SpaceCustomizer
            settings={customizationSettings}
            onSettingsChange={handleSettingsChange}
            onSave={handleSaveCustomization}
            memoriaProfileId={memoriaProfileId}
            profileType={profileType}
          />
        )}
      </AnimatePresence>
      
      {/* Reset view button */}
      <button 
        onClick={() => window.location.reload()}
        className="fixed bottom-16 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-colors z-40" 
        title="Reset View"
      >
        <RefreshCw className="w-5 h-5" />
      </button>

      {/* AI Tribute Button (only for Memoria profiles) */}
      {profileType === 'memoria' && memoriaProfileId && (
        <button 
          onClick={() => setShowTributeImageInterface(true)}
          className="fixed bottom-16 left-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-colors z-40 flex items-center gap-2 shadow-lg shadow-amber-500/10" 
          title="Generate AI Tribute Images"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">AI Tributes</span>
        </button>
      )}
      
      {/* Gallery Navigation Footer - Only shown when gallery carousel is active */}
      {showGalleryCarousel && selectedGalleryItems.length > 0 && (
        <GalleryNavigationFooter
          currentIndex={galleryCurrentIndex}
          totalItems={selectedGalleryItems.length}
          onPrev={handleGalleryPrev}
          onNext={handleGalleryNext}
          onSliderChange={handleGallerySliderChange}
        />
      )}
      
      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-70 p-4"
            onClick={(e) => {
              // Only close if clicking the backdrop, not when clicking inside the modal content
              if (e.target === e.currentTarget) {
                handleCloseDetailModal();
              }
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/95 border border-white/20 rounded-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseDetailModal}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white/80 hover:text-white z-10 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Render the appropriate detail component based on item type */}
              {selectedItem.type === 'personal_favorites' && <PersonalFavoritesDetail data={selectedItem.data} />}
              {selectedItem.type === 'digital_presence' && <DigitalPresenceDetail data={selectedItem.data} />}
              {selectedItem.type === 'gaming_preferences' && <GamingPreferencesDetail data={selectedItem.data} />}
              {selectedItem.type === 'voice' && <VoiceDetail data={selectedItem.data} />}
              {selectedItem.type === 'tavus_avatar' && <TavusAvatarDetail data={selectedItem.data} />}
              {selectedItem.type === 'avaturn_avatars' && <AvaturnAvatarDetail data={selectedItem.data} />}
              {selectedItem.type === 'narratives' && <NarrativesDetail data={selectedItem.data} />}
              {selectedItem.type === 'gallery' && <GalleryDetail data={selectedItem.data} />}
              {selectedItem.type === 'family_tree' && <FamilyTreeDetail data={selectedItem.data} />}
              {selectedItem.type === 'media_links' && <MediaLinksDetail data={selectedItem.data} />}
              {selectedItem.type === 'ai_tribute_images' && <TributeImageDetail data={selectedItem.data} />}
              {selectedItem.type === 'documents' && <NarrativesDetail data={{ documents: selectedItem.data.documents }} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Tribute Image Interface */}
      <AnimatePresence>
        {showTributeImageInterface && memoriaProfileId && (
          <TributeImageInterface
            memoriaProfileId={memoriaProfileId}
            onClose={() => setShowTributeImageInterface(false)}
            onImagesGenerated={handleRefresh}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}