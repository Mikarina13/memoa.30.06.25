import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion'; 
import { X, Loader, RefreshCw, Settings, Cog, Image, Home } from 'lucide-react';
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
import { Content3DCarousel, renderGalleryContent, renderMediaLinkContent, renderDigitalPresenceContent, renderPersonalFavoritesContent } from '../components/Content3DCarousel';
import { SPACE_THEMES } from '../utils/constants';

// Import detail components
import { PersonalFavoritesDetail } from '../components/details/PersonalFavoritesDetail';
import { DigitalPresenceDetail } from '../components/details/DigitalPresenceDetail';
import { GamingPreferencesDetail } from '../components/details/GamingPreferencesDetail';
import { VoiceDetail } from '../components/details/VoiceDetail';
import { AvaturnAvatarDetail } from '../components/details/AvaturnAvatarDetail';
import { NarrativesDetail } from '../components/details/NarrativesDetail';
import { GalleryDetail } from '../components/details/GalleryDetail';
import { PersonalityDetail } from '../components/details/PersonalityDetail';
import { FamilyTreeDetail } from '../components/details/FamilyTreeDetail';
import { MediaLinksDetail } from '../components/details/MediaLinksDetail';
import { TributeImageDetail } from '../components/details/TributeImageDetail';

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
  const [errorType, setErrorType] = useState<'generic' | 'profile_not_found' | 'permission_denied'>('generic');
  const [profileName, setProfileName] = useState<string | null>(null);
  const [galleryLoadError, setGalleryLoadError] = useState<boolean>(false);
  
  // State for detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: string;
    data: any;
  } | null>(null);
  const [showTributeImageInterface, setShowTributeImageInterface] = useState(false);
  const [showGalleryCarousel, setShowGalleryCarousel] = useState(false);
  const [showMediaLinksCarousel, setShowMediaLinksCarousel] = useState(false);
  const [showPersonalFavoritesCarousel, setShowPersonalFavoritesCarousel] = useState(false);
  const [showDigitalPresenceCarousel, setShowDigitalPresenceCarousel] = useState(false);
  const [selectedGalleryItems, setSelectedGalleryItems] = useState<any[]>([]);
  const [selectedMediaLinks, setSelectedMediaLinks] = useState<any[]>([]);
  const [selectedPersonalFavorites, setSelectedPersonalFavorites] = useState<any[]>([]);
  const [selectedDigitalPresence, setSelectedDigitalPresence] = useState<any[]>([]);
  const [galleryCurrentIndex, setGalleryCurrentIndex] = useState(0);
  const [mediaLinksCurrentIndex, setMediaLinksCurrentIndex] = useState(0);
  const [personalFavoritesCurrentIndex, setPersonalFavoritesCurrentIndex] = useState(0);
  const [digitalPresenceCurrentIndex, setDigitalPresenceCurrentIndex] = useState(0);
  
  // State for customization
  const [memoriaProfiles, setMemoriaProfiles] = useState<MemoriaProfile[]>([]);
  const [showProfileSelector, setShowProfileSelector] = useState(initialShowProfileSelector || false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizationSettings, setCustomizationSettings] = useState<SpaceCustomizationSettings>(DEFAULT_SETTINGS);
  
  // Determine if we're in builder mode (our own profile) or view mode (someone else's profile)
  const isBuilderMode = useMemo(() => {
    // If we have an initialUserId that's different from the current user, we're in view mode
    return !initialUserId || initialUserId === user?.id;
  }, [initialUserId, user]);
  
  // Generate the list of item types for the customizer
  const itemTypes = useMemo(() => [
    { id: 'personal_favorites', name: 'Personal Favorites', color: '#ec4899' },
    { id: 'digital_presence', name: 'Digital Presence', color: '#a855f7' },
    { id: 'gaming_preferences', name: 'Gaming Preferences', color: '#06b6d4' },
    { id: 'voice', name: 'Voice Clone', color: '#3b82f6' },
    { id: 'avaturn_avatars', name: '3D Avatars', color: '#f97316' },
    { id: 'narratives', name: 'Narratives', color: '#10b981' },
    { id: 'gallery', name: 'Gallery', color: '#ec4899' },
    { id: 'personality', name: 'Personality', color: '#f43f5e' },
    { id: 'family_tree', name: 'Family Tree', color: '#22c55e' },
    { id: 'ai_tribute_images', name: 'AI Tributes', color: '#f97316' },
    { id: 'media_links', name: 'Media Links', color: '#f59e0b' },
    { id: 'documents', name: 'Documents', color: '#3b82f6' }
  ], []);
  
  // Get the appropriate camera position based on settings
  const cameraPosition = useMemo(() => {
    return [0, 25, 0];
  }, []);
  
  // Calculate star count based on density setting
  const starCount = Math.floor(8000 * customizationSettings.particleDensity);

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
        setErrorType('generic');
        setGalleryLoadError(false);
        
        if (user) {
          console.log(`Loading profile data for ${profileType}${memoriaProfileId ? ` with ID: ${memoriaProfileId}` : ''}${initialUserId ? ` with userId: ${initialUserId}` : ''}`);
          
          // Load profile data
          try {
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
                hasAvaturnAvatars: !!dataObject.avaturn_avatars?.avatars?.length,
                avaturnAvatarsCount: dataObject.avaturn_avatars?.avatars?.length || 0,
                hasMediaLinks: !!dataObject.media_links?.length,
                mediaLinksCount: dataObject.media_links?.length || 0,
                hasFamilyTree: !!dataObject.family_tree?.files?.length,
                familyTreeFilesCount: dataObject.family_tree?.files?.length || 0,
                hasPersonalityTest: !!dataObject.personality_test,
                personalityTestType: dataObject.personality_test?.type
              });
            }
            
            // Load customization settings if available
            if (dataObject?.space_customization?.settings) {
              setCustomizationSettings(dataObject.space_customization.settings);
            }
            
            setProfileData(profile);
            
            // Load gallery items in a separate try-catch
            try {
              console.log(`Loading gallery items for ${initialUserId || user.id}${memoriaProfileId ? ` with memoria ID: ${memoriaProfileId}` : ''}`);
              const galleryItems = await MemoirIntegrations.getGalleryItems(
                initialUserId || user.id, // Use initialUserId if provided
                memoriaProfileId
              );
              console.log(`Loaded ${galleryItems?.length || 0} gallery items`);
              setGalleryItems(galleryItems || []);
              
              if (profile) {
                profile.gallery_items = galleryItems;
                console.log('Added gallery items to profile data:', galleryItems?.length || 0);
              }
            } catch (galleryError) {
              console.error('Error loading gallery items:', galleryError);
              setGalleryLoadError(true);
              // Don't set galleryItems to empty array, just leave as is
              // This allows retry without reloading the entire page
            }
            
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
              try {
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
                  console.log('Added personal preferences during refresh:', personalPrefs);
                }
              } catch (error) {
                console.warn('Error loading personal preferences:', error);
              }
            }
            
            // Final check of profile data structure
            console.log('Final profile data structure:', {
              hasMemoriaData: !!profile.profile_data,
              hasMemoriaPreferences: !!profile.profile_data?.preferences?.personal,
              hasMemoriaTributeImages: !!profile.profile_data?.tribute_images,
              hasMemoirData: !!profile.memoir_data,
              hasMemoirPreferences: !!profile.memoir_data?.preferences?.personal,
              hasMemoirTributeImages: !!profile.memoir_data?.tribute_images
            });
          } catch (profileError) {
            console.error('Error loading profile data:', profileError);
            
            // Handle specific error types
            if (profileError instanceof Error) {
              const errorMessage = profileError.message;
              
              if (errorMessage.includes('Memoria profile not found') || errorMessage.includes('Profile not found')) {
                setErrorType('profile_not_found');
                setLoadError(`The ${profileType} profile you're looking for doesn't exist or has been removed.`);
              } else if (errorMessage.includes('Permission denied') || errorMessage.includes('Unauthorized')) {
                setErrorType('permission_denied');
                setLoadError(`You don't have permission to view this ${profileType} profile.`);
              } else {
                setErrorType('generic');
                setLoadError(errorMessage);
              }
            } else {
              setErrorType('generic');
              setLoadError(`Failed to load ${profileType} profile data`);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error instanceof Error ? error.message : error);
        setErrorType('generic');
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
  
  // Helper function to extract YouTube ID from URL
  const getYouTubeId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Helper function to extract Spotify ID from URL
  const getSpotifyId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    
    if (url.includes('spotify.com/track/')) {
      const parts = url.split('/');
      const idWithParams = parts[parts.length - 1];
      return idWithParams.split('?')[0];
    }
    return null;
  };
  
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
    console.log('Item clicked:', itemType, itemData);

    // Special handling for gallery to show 3D carousel
    if (itemType === 'gallery') {
      // If there's a gallery load error, try loading the gallery again
      if (galleryLoadError) {
        handleLoadGallery();
        return;
      }
      
      // Filter out any AI tribute images from the gallery items
      const filteredItems = itemData.filter((item: any) => {
        if (!item.metadata) return true;
        
        // Check multiple possible tribute indicators
        const isTribute = 
          item.metadata.tribute === true || 
          item.metadata.isTribute === true ||
          (item.metadata.type === 'tribute') ||
          (item.tags && item.tags.includes('tribute')) ||
          (item.metadata.folder === 'Tribute Images') ||
          (item.title && item.title.toLowerCase().includes('tribute'));
        
        return !isTribute;
      });
      
      setSelectedGalleryItems(filteredItems);
      setGalleryCurrentIndex(0); // Reset index to first item
      setShowGalleryCarousel(true);
      return;
    }

    // Special handling for AI tribute images to show 3D carousel
    if (itemType === 'ai_tribute_images') {
      // Transform tribute image data to match the format expected by the carousel
      const transformedItems = itemData.map((item: any) => ({
        id: item.id,
        file_path: item.url, // Map url to file_path for the carousel
        media_type: item.isVideo ? 'video' : 'image', // Add media_type
        title: `AI Tribute ${item.style || ''}`,
        original_tribute_item: item, // Store original tribute item data
      }));
      
      setSelectedGalleryItems(transformedItems);
      setGalleryCurrentIndex(0); // Reset index to first item
      setShowGalleryCarousel(true);
      return;
    }

    // Special handling for media links to show 3D carousel
    if (itemType === 'media_links') {
      setSelectedMediaLinks(itemData);
      setMediaLinksCurrentIndex(0); // Reset index to first item
      setShowMediaLinksCarousel(true);
      return;
    }
    
    // Special handling for personal_favorites to show 3D carousel
    if (itemType === 'personal_favorites') {
      // Transform personal favorites data into a format suitable for the carousel
      const items = [];
      
      // Process songs
      if (itemData.favorite_songs && itemData.favorite_songs.length > 0) {
        for (const song of itemData.favorite_songs) {
          items.push({
            id: `song-${items.length}`,
            type: 'song',
            value: song,
            title: `${song.length > 30 ? song.substring(0, 30) + '...' : song}`
          });
        }
      }
      
      // Process movies
      if (itemData.favorite_movies && itemData.favorite_movies.length > 0) {
        for (const movie of itemData.favorite_movies) {
          items.push({
            id: `movie-${items.length}`,
            type: 'movie',
            value: movie,
            title: `${movie.length > 30 ? movie.substring(0, 30) + '...' : movie}`
          });
        }
      }
      
      // Process books
      if (itemData.favorite_books && itemData.favorite_books.length > 0) {
        for (const book of itemData.favorite_books) {
          items.push({
            id: `book-${items.length}`,
            type: 'book',
            value: book,
            title: `${book.length > 30 ? book.substring(0, 30) + '...' : book}`
          });
        }
      }
      
      // Process quotes
      if (itemData.favorite_quotes && itemData.favorite_quotes.length > 0) {
        for (const quote of itemData.favorite_quotes) {
          items.push({
            id: `quote-${items.length}`,
            type: 'quote',
            value: quote,
            title: 'Quote'
          });
        }
      }
      
      // Process locations
      if (itemData.favorite_locations && itemData.favorite_locations.length > 0) {
        for (const location of itemData.favorite_locations) {
          items.push({
            id: `location-${items.length}`,
            type: 'location',
            value: location,
            title: location
          });
        }
      }
      
      // Process foods
      if (itemData.favorite_foods && itemData.favorite_foods.length > 0) {
        for (const food of itemData.favorite_foods) {
          items.push({
            id: `food-${items.length}`,
            type: 'food',
            value: food,
            title: food
          });
        }
      }
      
      console.log('Transformed personal favorites for carousel:', items);
      
      if (items.length > 0) {
        setSelectedPersonalFavorites(items);
        setPersonalFavoritesCurrentIndex(0); // Reset to first item
        setShowPersonalFavoritesCarousel(true);
      } else {
        // If no items, just show the detail view
        setSelectedItem({ type: itemType, data: itemData });
        setShowDetailModal(true);
      }
      return;
    }
    
    // Special handling for digital_presence to show 3D carousel
    if (itemType === 'digital_presence') {
      if (itemData && itemData.length > 0) {
        setSelectedDigitalPresence(itemData);
        setDigitalPresenceCurrentIndex(0); // Reset to first item
        setShowDigitalPresenceCarousel(true);
      } else {
        // If no items, just show the detail view
        setSelectedItem({ type: itemType, data: itemData });
        setShowDetailModal(true);
      }
      return;
    }
    
    if (itemType === 'personality') {
      navigate('/personality-test', { 
        state: { 
          memoriaProfileId: memoriaProfileId,
          returnPath: '/memento/profile-space',
          profileType,
          ownerUserId: initialUserId // Pass the profile owner's ID
        }
      });
      return;
    }
    
    // Handle narratives vs documents distinction
    if (itemType === 'narratives' || itemType === 'documents') {
      setSelectedItem({ 
        type: itemType, 
        data: itemData
      });
      setShowDetailModal(true);
      return;
    }
    
    // Default behavior for other item types
    setSelectedItem({ type: itemType, data: itemData });
    setShowDetailModal(true);
  };

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    console.log('Closing detail modal, returning to profile view');
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

  // Gallery navigation handlers
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

  // Media Links navigation handlers
  const handleMediaLinksPrev = () => {
    setMediaLinksCurrentIndex(prev => 
      prev === 0 ? selectedMediaLinks.length - 1 : prev - 1
    );
  };

  const handleMediaLinksNext = () => {
    setMediaLinksCurrentIndex(prev => 
      prev === selectedMediaLinks.length - 1 ? 0 : prev + 1
    );
  };

  const handleMediaLinksSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * selectedMediaLinks.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), selectedMediaLinks.length - 1);
    setMediaLinksCurrentIndex(adjustedIndex);
  };
  
  // Personal Favorites navigation handlers
  const handlePersonalFavoritesPrev = () => {
    setPersonalFavoritesCurrentIndex(prev => 
      prev === 0 ? selectedPersonalFavorites.length - 1 : prev - 1
    );
  };

  const handlePersonalFavoritesNext = () => {
    setPersonalFavoritesCurrentIndex(prev => 
      prev === selectedPersonalFavorites.length - 1 ? 0 : prev + 1
    );
  };

  const handlePersonalFavoritesSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * selectedPersonalFavorites.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), selectedPersonalFavorites.length - 1);
    setPersonalFavoritesCurrentIndex(adjustedIndex);
  };
  
  // Digital Presence navigation handlers
  const handleDigitalPresencePrev = () => {
    setDigitalPresenceCurrentIndex(prev => 
      prev === 0 ? selectedDigitalPresence.length - 1 : prev - 1
    );
  };

  const handleDigitalPresenceNext = () => {
    setDigitalPresenceCurrentIndex(prev => 
      prev === selectedDigitalPresence.length - 1 ? 0 : prev + 1
    );
  };

  const handleDigitalPresenceSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * selectedDigitalPresence.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), selectedDigitalPresence.length - 1);
    setDigitalPresenceCurrentIndex(adjustedIndex);
  };

  // Handle closing of gallery and media carousels (NOT the entire view)
  const handleCloseCarousel = () => {
    console.log('Closing carousel, returning to profile view');
    // Just close the current active carousel and return to the profile view
    setShowGalleryCarousel(false);
    setShowMediaLinksCarousel(false);
    setShowPersonalFavoritesCarousel(false);
    setShowDigitalPresenceCarousel(false);
  };
  
  // Handle returning to profile or memento page
  const handleNavigateBack = () => {
    console.log('Navigating back from profile space...');
    
    // If a detail modal is open, close it first and stay on the profile
    if (showDetailModal) {
      console.log('Detail modal is open, closing it');
      handleCloseDetailModal();
      return;
    }
    
    // If a carousel is open, close it first and stay on the profile
    if (showGalleryCarousel || showMediaLinksCarousel || showPersonalFavoritesCarousel || showDigitalPresenceCarousel) {
      console.log('Carousel is open, closing it');
      handleCloseCarousel();
      return;
    }
    
    // Otherwise, we're at the top level of the profile space
    // For other users' profiles, go back to memento explorer
    if (initialUserId && initialUserId !== user?.id) {
      console.log('Returning to Memento explorer from another user\'s profile');
      navigate('/memento', { 
        state: { 
          showExplorer: true, 
          highlightProfileId: memoriaProfileId || initialUserId 
        }
      });
    } else {
      // For own profiles, go to the appropriate dashboard
      if (profileType === 'memoir') {
        console.log('Returning to Memoir dashboard');
        navigate('/memoir/dashboard');
      } else {
        console.log('Returning to Memoria dashboard');
        navigate('/memoria/dashboard');
      }
    }
  };

  // Handle return to appropriate dashboard based on error type
  const handleReturnToDashboard = () => {
    if (profileType === 'memoria') {
      navigate('/memoria/dashboard');
    } else {
      navigate('/memoir/dashboard');
    }
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
      
      // Reset gallery load error flag
      setGalleryLoadError(false);
      
      // Load gallery items in a separate try-catch
      let galleryItems = [];
      try {
        galleryItems = await MemoirIntegrations.getGalleryItems(
          initialUserId || user.id,
          memoriaProfileId
        );
      } catch (galleryError) {
        console.error('Error loading gallery items during refresh:', galleryError);
        setGalleryLoadError(true);
        // Don't throw - continue with other data
      }
      
      // Update state
      if (profile) {
        // Add gallery items to profile data
        profile.gallery_items = galleryItems;
        
        // Ensure we have the personal preferences data
        if (!profile.profile_data?.preferences?.personal && !profile.memoir_data?.preferences?.personal) {
          console.log('Fetching personal preferences during refresh');
          try {
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
          } catch (error) {
            console.warn('Error loading personal preferences during refresh:', error);
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
  
  // Function to load gallery items specifically
  const handleLoadGallery = async () => {
    console.log('Loading gallery items specifically');
    try {
      if (!user) return;
      
      // Try to load just the gallery items
      const galleryItems = await MemoirIntegrations.getGalleryItems(
        initialUserId || user.id,
        memoriaProfileId
      );
      
      console.log(`Loaded ${galleryItems?.length || 0} gallery items`);
      setGalleryItems(galleryItems || []);
      
      // Add to profile data too
      if (profileData) {
        profileData.gallery_items = galleryItems;
      }
      
      // Reset error flag
      setGalleryLoadError(false);
      
      // If we have gallery items, show carousel
      if (galleryItems && galleryItems.length > 0) {
        // Filter out any AI tribute images from the gallery items
        const filteredItems = galleryItems.filter((item: any) => {
          if (!item.metadata) return true;
          
          // Check multiple possible tribute indicators
          const isTribute = 
            item.metadata.tribute === true || 
            item.metadata.isTribute === true ||
            (item.metadata.type === 'tribute') ||
            (item.tags && item.tags.includes('tribute')) ||
            (item.metadata.folder === 'Tribute Images') ||
            (item.title && item.title.toLowerCase().includes('tribute'));
          
          return !isTribute;
        });
        
        setSelectedGalleryItems(filteredItems);
        setGalleryCurrentIndex(0); // Reset index to first item
        setShowGalleryCarousel(true);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      setGalleryLoadError(true);
    }
  };
  
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

  // Show authentication redirect screen
  if (!loading && !user) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
        <span className="mt-4 text-white">Redirecting...</span>
      </div>
    );
  }
  
  // Show error if load failed
  if (loadError) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-lg">
          <h2 className="text-xl font-bold text-white mb-4">
            {errorType === 'profile_not_found' ? 'Profile Not Found' : 
             errorType === 'permission_denied' ? 'Access Denied' : 
             'Error Loading Space'}
          </h2>
          <p className="text-white/70 mb-6">{loadError}</p>
          
          {errorType === 'profile_not_found' && (
            <div className="text-white/60 text-sm mb-6">
              <p>This could happen if:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The profile was deleted</li>
                <li>The profile ID is incorrect</li>
                <li>You don't have permission to view this profile</li>
              </ul>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleReturnToDashboard}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {profileType === 'memoria' ? 'Return to Memoria' : 'Return to Home'}
            </button>
            
            {errorType !== 'profile_not_found' && (
              <button 
                onClick={handleRefresh}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            )}
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
      {/* Back button */}
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={handleNavigateBack}
          className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 text-white/80 hover:text-white transition-colors"
          title="Return"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Profile or Space title */}
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
                              ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400' 
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
          
          {/* Settings Button - only show in builder mode */}
          {isBuilderMode && (
            <button 
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="p-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
              title="Customize Space"
            >
              <Cog className="w-5 h-5" />
            </button>
          )}
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
          <ProfileSpaceControls 
            settings={customizationSettings} 
            isGalleryActive={
              showGalleryCarousel || 
              showMediaLinksCarousel || 
              showPersonalFavoritesCarousel || 
              showDigitalPresenceCarousel
            } 
          />
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
              onClose={handleCloseCarousel}
              onItemSelect={(item) => {
                // Check if this is a tribute item that was transformed for the carousel
                if (item.original_tribute_item) {
                  setSelectedItem({ 
                    type: 'ai_tribute_images', 
                    data: [item.original_tribute_item]
                  });
                } else {
                  setSelectedItem({ 
                    type: 'gallery', 
                    data: [item]
                  });
                }
                setShowDetailModal(true);
                setShowGalleryCarousel(false);
              }}
              currentIndex={galleryCurrentIndex}
              onIndexChange={setGalleryCurrentIndex}
              isLoading={galleryLoadError} // Pass loading state to show loading indicator
            />
          )}

          {/* 3D Media Links Carousel */}
          {showMediaLinksCarousel && selectedMediaLinks.length > 0 && (
            <Content3DCarousel 
              items={selectedMediaLinks} 
              onClose={handleCloseCarousel}
              onItemSelect={(item) => {
                // Open the link directly in a new tab
                window.open(item.url, '_blank', 'noopener,noreferrer');
              }}
              currentIndex={mediaLinksCurrentIndex}
              onIndexChange={setMediaLinksCurrentIndex}
              title="Media Links"
              renderItemContent={(item, isActive, scale) => renderMediaLinkContent(item, isActive, scale)}
            />
          )}
          
          {/* 3D Personal Favorites Carousel */}
          {showPersonalFavoritesCarousel && selectedPersonalFavorites.length > 0 && (
            <Content3DCarousel 
              items={selectedPersonalFavorites} 
              onClose={handleCloseCarousel}
              onItemSelect={(item) => {
                // Handle item click based on type and whether it's a URL
                if (item.type === 'song' || item.type === 'movie' || item.type === 'book') {
                  try {
                    // Check if it's a URL
                    new URL(item.value);
                    window.open(item.value, '_blank', 'noopener,noreferrer');
                  } catch {
                    // Not a URL, just show in detail view
                    setSelectedItem({
                      type: 'personal_favorites',
                      data: {
                        [item.type === 'song' ? 'favorite_songs' : 
                          item.type === 'movie' ? 'favorite_movies' : 'favorite_books']: [item.value]
                      }
                    });
                    setShowDetailModal(true);
                    setShowPersonalFavoritesCarousel(false);
                  }
                } else {
                  // For other types, just show in detail view
                  const dataType = 
                    item.type === 'location' ? 'favorite_locations' :
                    item.type === 'quote' ? 'favorite_quotes' :
                    item.type === 'food' ? 'favorite_foods' : 'favorite_songs';
                    
                  setSelectedItem({
                    type: 'personal_favorites',
                    data: {
                      [dataType]: [item.value]
                    }
                  });
                  setShowDetailModal(true);
                  setShowPersonalFavoritesCarousel(false);
                }
              }}
              currentIndex={personalFavoritesCurrentIndex}
              onIndexChange={setPersonalFavoritesCurrentIndex}
              title="Personal Favorites"
              renderItemContent={(item, isActive, scale) => renderPersonalFavoritesContent(item, isActive, scale)}
            />
          )}
          
          {/* 3D Digital Presence Carousel */}
          {showDigitalPresenceCarousel && selectedDigitalPresence.length > 0 && (
            <Content3DCarousel 
              items={selectedDigitalPresence} 
              onClose={handleCloseCarousel}
              onItemSelect={(item) => {
                // Open the link directly in a new tab
                if (item.url) {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                }
              }}
              currentIndex={digitalPresenceCurrentIndex}
              onIndexChange={setDigitalPresenceCurrentIndex}
              title="Digital Presence"
              renderItemContent={(item, isActive, scale) => renderDigitalPresenceContent(item, isActive, scale)}
            />
          )}
          
          {/* Only render 3D icons when modal is NOT visible to prevent them from showing through */}
          <Suspense fallback={null}>
            {profileData && !showDetailModal && !showGalleryCarousel && 
              !showMediaLinksCarousel && !showPersonalFavoritesCarousel && 
              !showDigitalPresenceCarousel && (
              <ProfileData3DDisplay 
                profileData={profileData} 
                onItemClick={handleItemClick}
                customizationSettings={customizationSettings}
              />
            )}
          </Suspense>
          
          {/* Always render OrbitControls but disable when carousel is active */}
          <OrbitControls 
            enabled={!showGalleryCarousel && !showMediaLinksCarousel && 
                    !showPersonalFavoritesCarousel && !showDigitalPresenceCarousel}
            enablePan={!showGalleryCarousel && !showMediaLinksCarousel && 
                      !showPersonalFavoritesCarousel && !showDigitalPresenceCarousel}
            enableZoom={!showGalleryCarousel && !showMediaLinksCarousel && 
                      !showPersonalFavoritesCarousel && !showDigitalPresenceCarousel}
            enableRotate={!showGalleryCarousel && !showMediaLinksCarousel && 
                       !showPersonalFavoritesCarousel && !showDigitalPresenceCarousel}
            autoRotate={customizationSettings.autoRotate && !showGalleryCarousel && 
                      !showMediaLinksCarousel && !showPersonalFavoritesCarousel && 
                      !showDigitalPresenceCarousel} 
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
      
      {/* Home Button - Quick access to dashboard */}
      <button 
        onClick={handleNavigateBack}
        className="fixed top-36 right-8 p-3 bg-black/50 backdrop-blur-sm rounded-full border border-white/10 text-white/70 hover:text-white transition-colors z-40" 
        title="Return to Dashboard"
      >
        <Home className="w-5 h-5" />
      </button>
      
      {/* Gallery Button - Quick access to gallery carousel */}
      {(galleryItems.length > 0 || galleryLoadError) && (
        <button 
          onClick={() => {
            if (galleryLoadError) {
              // If there was an error loading gallery, try to load it again
              handleLoadGallery();
            } else {
              // Filter out tribute images
              const filteredItems = galleryItems.filter(item => {
                if (!item.metadata) return true;
                
                // Check multiple possible tribute indicators
                const isTribute = 
                  item.metadata.tribute === true || 
                  item.metadata.isTribute === true ||
                  (item.metadata.type === 'tribute') ||
                  (item.tags && item.tags.includes('tribute')) ||
                  (item.metadata.folder === 'Tribute Images') ||
                  (item.title && item.title.toLowerCase().includes('tribute'));
                
                return !isTribute;
              });
              
              setSelectedGalleryItems(filteredItems);
              setGalleryCurrentIndex(0); // Reset to first image
              setShowGalleryCarousel(true);
            }
          }}
          className={`fixed top-52 right-8 p-3 backdrop-blur-sm rounded-full border border-white/10 transition-colors z-40 ${
            galleryLoadError 
              ? 'bg-red-500/50 hover:bg-red-500/70 text-white'
              : 'bg-black/50 hover:bg-black/70 text-white/70 hover:text-white'
          }`}
          title={galleryLoadError ? "Retry Loading Gallery" : "View Gallery"}
        >
          {galleryLoadError ? (
            <RefreshCw className="w-5 h-5" />
          ) : (
            <Image className="w-5 h-5" />
          )}
        </button>
      )}
      
      {/* Space Customizer - only visible in builder mode */}
      <AnimatePresence>
        {showCustomizer && isBuilderMode && (
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

      {/* Media Links Navigation Footer - Only shown when media links carousel is active */}
      {showMediaLinksCarousel && selectedMediaLinks.length > 0 && (
        <GalleryNavigationFooter
          currentIndex={mediaLinksCurrentIndex}
          totalItems={selectedMediaLinks.length}
          onPrev={handleMediaLinksPrev}
          onNext={handleMediaLinksNext}
          onSliderChange={handleMediaLinksSliderChange}
        />
      )}
      
      {/* Personal Favorites Navigation Footer */}
      {showPersonalFavoritesCarousel && selectedPersonalFavorites.length > 0 && (
        <GalleryNavigationFooter
          currentIndex={personalFavoritesCurrentIndex}
          totalItems={selectedPersonalFavorites.length}
          onPrev={handlePersonalFavoritesPrev}
          onNext={handlePersonalFavoritesNext}
          onSliderChange={handlePersonalFavoritesSliderChange}
        />
      )}
      
      {/* Digital Presence Navigation Footer */}
      {showDigitalPresenceCarousel && selectedDigitalPresence.length > 0 && (
        <GalleryNavigationFooter
          currentIndex={digitalPresenceCurrentIndex}
          totalItems={selectedDigitalPresence.length}
          onPrev={handleDigitalPresencePrev}
          onNext={handleDigitalPresenceNext}
          onSliderChange={handleDigitalPresenceSliderChange}
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
              {selectedItem.type === 'voice' && <VoiceDetail data={selectedItem.data} memoriaProfileId={memoriaProfileId} />}
              {selectedItem.type === 'avaturn_avatars' && <AvaturnAvatarDetail data={selectedItem.data} />}
              {selectedItem.type === 'narratives' && <NarrativesDetail data={selectedItem.data} initialTab="personal_stories" />}
              {selectedItem.type === 'documents' && <NarrativesDetail data={selectedItem.data} initialTab="documents" />}
              {selectedItem.type === 'gallery' && <GalleryDetail data={selectedItem.data} />}
              {selectedItem.type === 'personality' && <PersonalityDetail data={selectedItem.data} />}
              {selectedItem.type === 'family_tree' && <FamilyTreeDetail data={selectedItem.data} />}
              {selectedItem.type === 'media_links' && <MediaLinksDetail data={selectedItem.data} />}
              {selectedItem.type === 'ai_tribute_images' && <TributeImageDetail data={selectedItem.data} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Tribute Image Interface - only visible in builder mode */}
      <AnimatePresence>
        {showTributeImageInterface && memoriaProfileId && isBuilderMode && (
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

// Import this here to avoid circular dependencies
import { ChevronDown } from 'lucide-react';