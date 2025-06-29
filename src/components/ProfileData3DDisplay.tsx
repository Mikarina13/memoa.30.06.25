import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3, Group, Color } from 'three'; 
import { Heart, Volume2, User, Brain, Image as ImageIcon, FileText, Gamepad2, Globe, Camera, Cuboid, FileVideo, File as FilePdf, Sparkles } from 'lucide-react';
import { SpaceCustomizationSettings } from './SpaceCustomizer';
import { ChevronDown } from 'lucide-react';

interface ProfileData3DDisplayProps {
  profileData: any;
  onItemClick: (itemType: string, itemData: any) => void;
  customizationSettings?: SpaceCustomizationSettings;
}

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

// Theme colors for different visual styles
const THEME_COLORS = {
  cosmos: {
    personal_favorites: '#ec4899',
    digital_presence: '#a855f7',
    gaming_preferences: '#06b6d4',
    voice: '#3b82f6',
    avaturn_avatars: '#f97316',
    narratives: '#10b981',
    gallery: '#ec4899',
    personality: '#f43f5e',
    family_tree: '#22c55e',
    ai_tribute_images: '#f97316',
    media_links: '#f59e0b', 
    documents: '#3b82f6'
  },
  sunset: {
    personal_favorites: '#f97316',
    digital_presence: '#e11d48',
    gaming_preferences: '#f59e0b',
    voice: '#f97316',
    avaturn_avatars: '#f97316',
    narratives: '#f59e0b',
    gallery: '#f97316',
    personality: '#e11d48',
    family_tree: '#f59e0b',
    ai_tribute_images: '#f97316',
    media_links: '#f97316',
    documents: '#f59e0b'
  },
  emerald: {
    personal_favorites: '#10b981',
    digital_presence: '#0ea5e9',
    gaming_preferences: '#10b981',
    voice: '#0ea5e9',
    avaturn_avatars: '#0ea5e9',
    narratives: '#10b981',
    gallery: '#0ea5e9',
    personality: '#10b981',
    family_tree: '#0ea5e9',
    ai_tribute_images: '#10b981',
    media_links: '#10b981',
    documents: '#0ea5e9'
  },
  neon: {
    personal_favorites: '#ec4899',
    digital_presence: '#6366f1',
    gaming_preferences: '#10b981',
    voice: '#06b6d4',
    avaturn_avatars: '#f97316',
    narratives: '#10b981',
    gallery: '#ec4899',
    personality: '#f43f5e',
    family_tree: '#22c55e',
    ai_tribute_images: '#f97316',
    media_links: '#f59e0b',
    documents: '#6366f1'
  },
  minimal: {
    personal_favorites: '#94a3b8',
    digital_presence: '#94a3b8',
    gaming_preferences: '#94a3b8',
    voice: '#94a3b8',
    avaturn_avatars: '#94a3b8',
    narratives: '#94a3b8',
    gallery: '#94a3b8',
    personality: '#94a3b8',
    family_tree: '#94a3b8',
    ai_tribute_images: '#94a3b8',
    media_links: '#94a3b8',
    documents: '#94a3b8'
  },
  midnight: {
    personal_favorites: '#2563eb',
    digital_presence: '#4f46e5',
    gaming_preferences: '#1e40af',
    voice: '#2563eb',
    avaturn_avatars: '#1e40af',
    narratives: '#2563eb',
    gallery: '#4f46e5',
    personality: '#1e40af',
    family_tree: '#2563eb',
    ai_tribute_images: '#4f46e5',
    media_links: '#4f46e5',
    documents: '#1e40af'
  }
};

export function ProfileData3DDisplay({ profileData, onItemClick, customizationSettings }: ProfileData3DDisplayProps) {
  const groupRef = useRef<Group>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null); 
  const [clickedItem, setClickedItem] = useState<string | null>(null);
  const lastClickTime = useRef<{[key: string]: number}>({});
  const { camera } = useThree();
  const [doubleTapInProgress, setDoubleTapInProgress] = useState(false);
  
  // Lower double click threshold for more responsive interactions
  const DOUBLE_CLICK_THRESHOLD = 300; // ms
  
  // Logging for debugging
  useEffect(() => {
    if (profileData) {
      console.log('ProfileData3DDisplay received data:', {
        hasProfile: !!profileData,
        hasMemoriaData: !!profileData?.profile_data,
        hasMemorData: !!profileData?.memoir_data,
        hasPersonalData: !!profileData?.profile_data?.preferences?.personal || 
                        !!profileData?.memoir_data?.preferences?.personal,
        voiceId: profileData.elevenlabs_voice_id,
        avatarId: profileData.tavus_avatar_id,
        galleryCount: profileData.gallery_items?.length,
        memoriaID: profileData.id,
        isMemoria: !!profileData.profile_data,
        mediaLinks: (profileData.profile_data?.media_links?.length || 0) + 
                   (profileData.memoir_data?.media_links?.length || 0),
        familyTree: !!profileData.profile_data?.family_tree || 
                   !!profileData.memoir_data?.family_tree,
      });
    }
  }, [profileData]);
  
  // Apply default settings if none provided
  const settings = useMemo(() => ({
    ...DEFAULT_SETTINGS,
    ...customizationSettings
  }), [customizationSettings]);
  
  // Get the color map based on selected theme
  const themeColors = THEME_COLORS[settings.colorTheme as keyof typeof THEME_COLORS] || THEME_COLORS.cosmos;
  
  // Apply auto-rotation if enabled
  useFrame(({ clock }) => {
    if (settings.autoRotate && groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });
  
  // Generate 3D items based on profile data
  const generateItems = () => {
    const items = [];
    
    // Determine if this is a memoria profile and get the profile ID
    const isMemoriaProfile = !!profileData?.profile_data;
    const currentProfileId = profileData?.id || 'unknown';
    
    console.log('Generating 3D items from profile data:', {
      hasProfile: !!profileData,
      profileType: isMemoriaProfile ? 'memoria' : 'memoir',
      profileId: currentProfileId,
      elevenlabsVoiceId: profileData?.elevenlabs_voice_id,
      hasGalleryItems: profileData?.gallery_items?.length > 0,
      galleryItemCount: profileData?.gallery_items?.length || 0
    });
    
    const radius = settings.itemDistanceFromCenter; // Distance from center
    const itemCount = Math.max(getItemCount(), 1); // Ensure at least 1 to avoid division by zero
    
    let index = 0;
    
    // Check both memoir_data and profile_data for personal preferences
    const personalData = profileData?.profile_data?.preferences?.personal || 
                         profileData?.memoir_data?.preferences?.personal;
    
    // Log personal data for debugging
    if (personalData) {
      console.log('Personal data found:', {
        hasPersonalData: true,
        favoritesSongs: personalData.favorite_songs?.length || 0,
        favoritesMovies: personalData.favorite_movies?.length || 0,
        favoritesBooks: personalData.favorite_books?.length || 0,
        favoritesQuotes: personalData.favorite_quotes?.length || 0,
        favoritesLocations: personalData.favorite_locations?.length || 0,
        favoritesFoods: personalData.favorite_foods?.length || 0,
        digitalPresence: personalData.digital_presence?.length || 0,
        gamingPreferences: personalData.gaming_preferences?.length || 0
      });
    } else {
      console.log('No personal data found in profile');
    }
    
    // Personal Favorites
    if (personalData) {
      let totalItems = 
        (personalData.favorite_songs?.length || 0) +
        (personalData.favorite_movies?.length || 0) +
        (personalData.favorite_books?.length || 0) +
        (personalData.favorite_quotes?.length || 0) +
        (personalData.favorite_locations?.length || 0);
        
      // Add favorite foods if they exist
      if (personalData.favorite_foods && personalData.favorite_foods.length > 0) {
        totalItems += personalData.favorite_foods.length;
      }
      
      // Add favorite signature dishes if they exist
      if (personalData.favorite_signature_dishes && personalData.favorite_signature_dishes.length > 0) {
        totalItems += personalData.favorite_signature_dishes.length;
      }
      
      console.log('Total personal favorites items:', {
        totalItems,
        songs: personalData.favorite_songs?.length || 0,
        movies: personalData.favorite_movies?.length || 0,
        books: personalData.favorite_books?.length || 0,
        quotes: personalData.favorite_quotes?.length || 0,
        locations: personalData.favorite_locations?.length || 0,
        foods: personalData.favorite_foods?.length || 0,
        signature_dishes: personalData.favorite_signature_dishes?.length || 0
      });
      
      if (totalItems > 0 && isItemVisible('personal_favorites')) {
        console.log('Displaying personal favorites with', totalItems, 'items');
        const angle = (index / itemCount) * Math.PI * 2;
        const position = getItemPosition('personal_favorites', angle, radius, settings.verticalSpread);
        
        items.push(
          <Item
            key="personal-favorites"
            id="personal_favorites"
            position={position}
            icon={<Heart className={`w-14 h-14`} style={{color: getItemColor('personal_favorites', themeColors.personal_favorites)}} />}
            label="Personal Favorites" 
            color={getItemColor('personal_favorites', themeColors.personal_favorites)}
            scale={settings.iconScale}
            onHover={() => setHoveredItem("personal-favorites")}
            onLeave={() => setHoveredItem(null)} 
            lastClickTime={lastClickTime.current}
            isHovered={hoveredItem === "personal-favorites"}
            isClicked={clickedItem === "personal-favorites"}
            onClick={() => {
              setClickedItem("personal-favorites");
              setTimeout(() => setClickedItem(null), 200);
              handleItemClick("personal_favorites", personalData);
            }}
            glowIntensity={settings.backgroundIntensity}
          />
        ); 
        index++;
      } else {
        console.log('Not displaying personal favorites:', {
          totalItems,
          isVisible: isItemVisible('personal_favorites')
        });
      }
    }
    
    // Digital Presence - check both paths
    const digitalPresence = personalData?.digital_presence;
    if (digitalPresence?.length > 0 && isItemVisible('digital_presence')) {
      console.log('Displaying digital presence with', digitalPresence.length, 'items:', digitalPresence);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('digital_presence', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="digital-presence"
          id="digital_presence"
          position={position}
          icon={<Globe className={`w-14 h-14`} style={{color: getItemColor('digital_presence', themeColors.digital_presence)}} />}
          label="Digital Presence" 
          color={getItemColor('digital_presence', themeColors.digital_presence)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("digital-presence")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "digital-presence"}
          isClicked={clickedItem === "digital-presence"}
          onClick={() => {
            setClickedItem("digital-presence");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("digital_presence", digitalPresence);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Gaming Preferences - check both paths
    const gamingPreferences = personalData?.gaming_preferences;
    if (gamingPreferences?.length > 0 && isItemVisible('gaming_preferences')) {
      console.log('Displaying gaming preferences with', gamingPreferences.length, 'items:', gamingPreferences);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('gaming_preferences', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="gaming-preferences"
          id="gaming_preferences"
          position={position}
          icon={<Gamepad2 className={`w-14 h-14`} style={{color: getItemColor('gaming_preferences', themeColors.gaming_preferences)}} />}
          label="Gaming Preferences" 
          color={getItemColor('gaming_preferences', themeColors.gaming_preferences)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("gaming-preferences")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "gaming-preferences"}
          isClicked={clickedItem === "gaming-preferences"}
          onClick={() => {
            setClickedItem("gaming-preferences");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("gaming_preferences", gamingPreferences);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Voice
    if (profileData?.elevenlabs_voice_id && isItemVisible('voice')) {
      console.log('Displaying voice clone with ID:', profileData.elevenlabs_voice_id);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('voice', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="voice"
          id="voice"
          position={position}
          icon={<Volume2 className={`w-14 h-14`} style={{color: getItemColor('voice', themeColors.voice)}} />}
          label="Voice Clone" 
          color={getItemColor('voice', themeColors.voice)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("voice")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "voice"}
          isClicked={clickedItem === "voice"}
          onClick={() => {
            setClickedItem("voice");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("voice", { 
              voiceId: profileData.elevenlabs_voice_id,
              status: profileData.integration_status?.elevenlabs?.status,
              memoriaProfileId: isMemoriaProfile ? currentProfileId : undefined
            });
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Avaturn Avatars - check both paths
    const avaturnAvatars = profileData?.profile_data?.avaturn_avatars?.avatars || 
                          profileData?.memoir_data?.avaturn_avatars?.avatars;
    console.log('Avaturn avatars found:', avaturnAvatars);
    if (avaturnAvatars?.length > 0 && isItemVisible('avaturn_avatars')) {
      console.log('Displaying Avaturn 3D avatars with', avaturnAvatars.length, 'items:', avaturnAvatars);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('avaturn_avatars', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="avaturn-avatars"
          id="avaturn_avatars"
          position={position}
          icon={<Cuboid className={`w-14 h-14`} style={{color: getItemColor('avaturn_avatars', themeColors.avaturn_avatars)}} />}
          label="3D Avatars" 
          color={getItemColor('avaturn_avatars', themeColors.avaturn_avatars)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("avaturn-avatars")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "avaturn-avatars"}
          isClicked={clickedItem === "avaturn-avatars"}
          onClick={() => {
            setClickedItem("avaturn-avatars");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("avaturn_avatars", avaturnAvatars);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Narratives - check both paths
    const narratives = profileData?.profile_data?.narratives || 
                      profileData?.memoir_data?.narratives;
    console.log('Narratives found:', narratives);
    if (narratives && isItemVisible('narratives')) {
      console.log('Displaying narratives:', narratives);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('narratives', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="narratives"
          id="narratives"
          position={position}
          icon={<FileText className={`w-14 h-14`} style={{color: getItemColor('narratives', themeColors.narratives)}} />}
          label="Narratives" 
          color={getItemColor('narratives', themeColors.narratives)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("narratives")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "narratives"}
          isClicked={clickedItem === "narratives"}
          onClick={() => {
            setClickedItem("narratives");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("narratives", narratives);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Gallery Items
    if (profileData?.gallery_items?.length > 0 && isItemVisible('gallery')) {
      console.log('Displaying gallery with', profileData.gallery_items.length, 'items:', profileData.gallery_items);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('gallery', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="gallery"
          id="gallery"
          position={position}
          icon={<ImageIcon className={`w-14 h-14`} style={{color: getItemColor('gallery', themeColors.gallery)}} />}
          label="Gallery" 
          color={getItemColor('gallery', themeColors.gallery)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("gallery")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "gallery"}
          isClicked={clickedItem === "gallery"}
          onClick={() => {
            setClickedItem("gallery");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("gallery", profileData.gallery_items);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Personality Test - check both paths
    const personalityTest = profileData?.profile_data?.personality_test || 
                           profileData?.memoir_data?.personality_test;
    console.log('Personality test found:', personalityTest);
    if (personalityTest && isItemVisible('personality')) {
      console.log('Displaying personality test:', personalityTest);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('personality', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="personality"
          id="personality"
          position={position}
          icon={<Brain className={`w-14 h-14`} style={{color: getItemColor('personality', themeColors.personality)}} />}
          label="Personality" 
          color={getItemColor('personality', themeColors.personality)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("personality")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "personality"}
          isClicked={clickedItem === "personality"}
          onClick={() => {
            setClickedItem("personality");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("personality", personalityTest);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Family Tree - check both paths
    const familyTree = profileData?.profile_data?.family_tree || 
                       profileData?.memoir_data?.family_tree;
    console.log('Family tree found:', familyTree);
    if (familyTree && isItemVisible('family_tree')) {
      console.log('Displaying family tree:', familyTree);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('family_tree', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="family-tree"
          id="family_tree"
          position={position}
          icon={<User className={`w-14 h-14`} style={{color: getItemColor('family_tree', themeColors.family_tree)}} />}
          label="Family Tree" 
          color={getItemColor('family_tree', themeColors.family_tree)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("family-tree")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "family-tree"}
          isClicked={clickedItem === "family-tree"}
          onClick={() => {
            setClickedItem("family-tree");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("family_tree", familyTree);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Media Links - check both paths
    const mediaLinks = profileData?.profile_data?.media_links || 
                       profileData?.memoir_data?.media_links;
    console.log('Media links found:', mediaLinks);
    if (mediaLinks?.length > 0 && isItemVisible('media_links')) {
      console.log('Displaying media links with', mediaLinks.length, 'items:', mediaLinks);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('media_links', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="media-links"
          id="media_links"
          position={position}
          icon={<FileVideo className={`w-14 h-14`} style={{color: getItemColor('media_links', themeColors.media_links)}} />}
          label="Media Links" 
          color={getItemColor('media_links', themeColors.media_links)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("media-links")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "media-links"}
          isClicked={clickedItem === "media-links"}
          onClick={() => {
            setClickedItem("media-links");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("media_links", mediaLinks);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // Documents (from narratives) - check both paths
    const documents = narratives?.documents;
    console.log('Documents found:', documents);
    if (documents?.length > 0 && isItemVisible('documents')) {
      console.log('Displaying documents with', documents.length, 'items:', documents);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('documents', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="documents"
          id="documents"
          position={position}
          icon={<FilePdf className={`w-14 h-14`} style={{color: getItemColor('documents', themeColors.documents)}} />}
          label="Documents" 
          color={getItemColor('documents', themeColors.documents)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("documents")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "documents"}
          isClicked={clickedItem === "documents"}
          onClick={() => {
            setClickedItem("documents");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("documents", {
              documents: documents
            });
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    // AI Tribute Images - check both paths (memoir_data and profile_data)
    const tributeImages = profileData?.profile_data?.tribute_images || 
                         profileData?.memoir_data?.tribute_images;
    console.log('AI Tribute images found:', tributeImages);
    if (tributeImages?.length > 0 && isItemVisible('ai_tribute_images')) {
      console.log('Displaying AI tribute images with', tributeImages.length, 'items:', tributeImages);
      const angle = (index / itemCount) * Math.PI * 2;
      const position = getItemPosition('ai_tribute_images', angle, radius, settings.verticalSpread);
      
      items.push(
        <Item
          key="ai-tribute-images"
          id="ai_tribute_images"
          position={position}
          icon={<Sparkles className={`w-14 h-14`} style={{color: getItemColor('ai_tribute_images', themeColors.ai_tribute_images)}} />}
          label="AI Tribute Images" 
          color={getItemColor('ai_tribute_images', themeColors.ai_tribute_images)}
          scale={settings.iconScale}
          onHover={() => setHoveredItem("ai-tribute-images")}
          onLeave={() => setHoveredItem(null)}
          lastClickTime={lastClickTime.current}
          isHovered={hoveredItem === "ai-tribute-images"}
          isClicked={clickedItem === "ai-tribute-images"}
          onClick={() => {
            setClickedItem("ai-tribute-images");
            setTimeout(() => setClickedItem(null), 200);
            handleItemClick("ai_tribute_images", tributeImages);
          }}
          glowIntensity={settings.backgroundIntensity}
        />
      );
      index++;
    }
    
    return items;
  };
  
  // Get item position - either from overrides or calculated based on angle
  const getItemPosition = (itemId: string, angle: number, radius: number, verticalSpread: number): Vector3 => {
    // If there's a position override for this item, use it
    if (settings.itemPositionOverrides && settings.itemPositionOverrides[itemId] && 
        Array.isArray(settings.itemPositionOverrides[itemId]) && 
        settings.itemPositionOverrides[itemId].length === 3) {
      return new Vector3(...settings.itemPositionOverrides[itemId]);
    }
    
    // Otherwise calculate position
    return new Vector3(
      Math.sin(angle) * radius,
      Math.sin(angle * 0.5) * verticalSpread, // Gentle vertical variation
      Math.cos(angle) * radius
    );
  };
  
  // Get item color from overrides or theme
  const getItemColor = (itemId: string, defaultColor: string): string => {
    return settings.itemColorOverrides[itemId] || defaultColor;
  };
  
  // Check if item should be visible
  const isItemVisible = (itemId: string): boolean => {
    // If item has explicit visibility setting, use it; otherwise default to true
    const isVisible = settings.itemVisible[itemId] !== false;
    console.log(`Visibility check for ${itemId}:`, isVisible);
    return isVisible;
  };
  
  // Process item clicks with improved double-click detection
  const handleItemClick = (itemType: string, itemData: any) => {
    const itemId = `item-${itemType}`;
    const now = Date.now();
    const lastClick = lastClickTime.current[itemId] || 0;
    const timeDiff = now - lastClick;
    
    // If double click is already in progress, ignore additional clicks
    if (doubleTapInProgress) return;
    
    console.log(`Click on ${itemType}, time since last click: ${timeDiff}ms`);
    
    // More responsive double-click detection with visual feedback
    if (timeDiff < DOUBLE_CLICK_THRESHOLD) {
      // Double click detected, send to the detail view
      console.log(`Double click detected on ${itemType}`);
      setDoubleTapInProgress(true);
      
      // Update the UI immediately for better feedback
      setClickedItem(itemType);
      
      // Wait for animation to complete, then process the click
      setTimeout(() => {
        onItemClick(itemType, itemData);
        setClickedItem(null);
        setDoubleTapInProgress(false);
        // Reset the timer
        lastClickTime.current[itemId] = 0;
      }, 300);
    } else {
      // Single click - give visual feedback and update last click time
      setClickedItem(itemType);
      setTimeout(() => setClickedItem(null), 200);
      lastClickTime.current[itemId] = now;
    }
  };
  
  // Count how many items we'll display - check both memoir_data and profile_data paths
  const getItemCount = () => {
    let count = 0;
    console.log('Counting items for display...');
    console.log('Profile data structure:', profileData);
    
    // Get the personal data from either memoir_data or profile_data
    const personalData = profileData?.profile_data?.preferences?.personal || 
                         profileData?.memoir_data?.preferences?.personal;
    
    console.log('Personal data for counting:', {
      exists: !!personalData,
      source: profileData?.profile_data?.preferences?.personal ? 'profile_data' : 
              profileData?.memoir_data?.preferences?.personal ? 'memoir_data' : 'none'
    });
              
    // Personal Favorites
    if (personalData) {
      let totalItems = 
        (personalData.favorite_songs?.length || 0) +
        (personalData.favorite_movies?.length || 0) +
        (personalData.favorite_books?.length || 0) +
        (personalData.favorite_quotes?.length || 0) +
        (personalData.favorite_locations?.length || 0);
        
      // Add favorite foods if they exist
      if (personalData.favorite_foods && personalData.favorite_foods.length > 0) {
        totalItems += personalData.favorite_foods.length;
      }
      
      // Add favorite signature dishes if they exist
      if (personalData.favorite_signature_dishes && personalData.favorite_signature_dishes.length > 0) {
        totalItems += personalData.favorite_signature_dishes.length;
      }
      
      if (totalItems > 0 && isItemVisible('personal_favorites')) {
        count++;
        console.log('Counting personal favorites:', {
          totalItems,
          isVisible: isItemVisible('personal_favorites'),
          count
        });
      } else {
        console.log('Not counting personal favorites:', {
          totalItems,
          isVisible: isItemVisible('personal_favorites')
        });
      }
    }
    
    // Digital Presence
    const digitalPresence = personalData?.digital_presence;
    if (digitalPresence?.length > 0 && isItemVisible('digital_presence')) {
      count++;
      console.log('Counting digital presence:', digitalPresence.length);
    }
    
    // Gaming Preferences
    const gamingPreferences = personalData?.gaming_preferences;
    if (gamingPreferences?.length > 0 && isItemVisible('gaming_preferences')) {
      count++;
      console.log('Counting gaming preferences:', gamingPreferences.length);
    }
    
    // Voice
    if (profileData?.elevenlabs_voice_id && isItemVisible('voice')) count++;
    
    // Avaturn Avatars
    const avaturnAvatars = profileData?.profile_data?.avaturn_avatars?.avatars || 
                          profileData?.memoir_data?.avaturn_avatars?.avatars;
    if (avaturnAvatars?.length > 0 && isItemVisible('avaturn_avatars')) count++;
    
    // Narratives
    const narratives = profileData?.profile_data?.narratives || 
                       profileData?.memoir_data?.narratives;
    if (narratives && isItemVisible('narratives')) count++;
    
    // Gallery Items
    if (profileData?.gallery_items?.length > 0 && isItemVisible('gallery')) count++;
    
    // Personality Test
    const personalityTest = profileData?.profile_data?.personality_test || 
                           profileData?.memoir_data?.personality_test;
    if (personalityTest && isItemVisible('personality')) count++;
    
    // Family Tree
    const familyTree = profileData?.profile_data?.family_tree || 
                       profileData?.memoir_data?.family_tree;
    if (familyTree && isItemVisible('family_tree')) count++;
    
    // Media Links
    const mediaLinks = profileData?.profile_data?.media_links || 
                       profileData?.memoir_data?.media_links;
    if (mediaLinks?.length > 0 && isItemVisible('media_links')) count++;

    // Documents
    const documents = narratives?.documents;
    if (documents?.length > 0 && isItemVisible('documents')) count++;
    
    // AI Tribute Images
    const tributeImages = profileData?.profile_data?.tribute_images || 
                         profileData?.memoir_data?.tribute_images;
    if (tributeImages?.length > 0 && isItemVisible('ai_tribute_images')) count++;

    console.log('Total item count:', count);
    
    return Math.max(count, 1); // Ensure at least 1 to avoid division by zero
  };
  
  return (
    <group ref={groupRef}>
      <group>
        {generateItems()}
      </group>
    </group>
  );
}

interface ItemProps {
  id: string;
  position: Vector3;
  icon: React.ReactNode;
  label: string;
  color: string;
  scale: number;
  onHover: () => void;
  onLeave: () => void;
  lastClickTime: Record<string, number>;
  isHovered: boolean;
  isClicked: boolean;
  onClick: (e: any) => void;
  glowIntensity?: number;
}

function Item({ 
  id, 
  position, 
  icon, 
  label, 
  color, 
  scale, 
  onHover, 
  onLeave, 
  lastClickTime, 
  isHovered, 
  isClicked,
  onClick, 
  glowIntensity = 0.5 
}: ItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const itemId = `item-${id}`;
  const DOUBLE_CLICK_THRESHOLD = 300; // ms - reduced threshold for more responsive interaction
  const { camera } = useThree();
  const [pulseAnimation, setPulseAnimation] = useState(0);
  const pulseSpeed = 4; // Speed of the pulse animation
  
  // Handle pulse animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 0.5) * 0.6;
      
      // Pulse animation when clicked
      if (pulseAnimation > 0) {
        // Apply a quick scale pulse
        const pulseFactor = 1 + 0.2 * Math.sin(pulseAnimation * Math.PI);
        meshRef.current.scale.set(scale * pulseFactor, scale * pulseFactor, scale * pulseFactor);
        
        // Decrement pulse animation counter
        setPulseAnimation(prev => Math.max(0, prev - 0.1 * pulseSpeed));
      }
    }
  });
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    
    // Start pulse animation
    setPulseAnimation(1);
    
    // Trigger the click handler immediately for responsive feel
    onClick(e);
  };

  // Create a THREE.Color from the color string
  const threeColor = new Color(color);
  
  // Calculate the glow color - a lighter version of the main color
  const glowColor = threeColor.clone().multiplyScalar(1.5).getStyle();
  
  return (
    <group position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        position={position}
        // Larger invisible mesh for better click detection
        onClick={handleClick}
      >
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial opacity={0.01} transparent />
      </mesh>
      
      {/* Label */}
      <Html center position={[position.x, position.y + 3.5, position.z]}>
        <div 
          className={`px-6 py-3 rounded-lg text-white text-center transition-all duration-200 font-[Orbitron] ${
            isHovered 
              ? 'opacity-100 transform scale-110 bg-black/40' 
              : 'opacity-0 transform scale-90 bg-transparent'
          }`} 
          style={{ 
            borderColor: color,
            borderWidth: '2px',
            minWidth: '220px',
            maxWidth: '300px',
            boxShadow: isHovered ? `0 0 25px ${color}90` : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            fontSize: '18px',
            lineHeight: '1.2'
          }}
        >
          {label}
          <div className="text-sm mt-2 opacity-80">Double-click to view</div>
        </div>
      </Html>
      
      {/* Icon */}
      <Html center position={[position.x, position.y, position.z]}>
        <div
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={handleClick}
          onTouchEnd={handleClick}
          className={`rounded-full p-12 transition-all duration-150 cursor-pointer ${
            isClicked ? 'scale-90' : isHovered ? 'scale-125' : 'scale-100'
          } active:scale-90`} 
          style={{ 
            transform: `scale(${scale * (isClicked ? 0.9 : isHovered ? 1.25 : 1)})`,
            backgroundColor: 'transparent', // Fully transparent background
            border: `3px solid ${color}90`, // Slightly transparent border
            boxShadow: isHovered 
              ? `0 0 30px ${color}, 0 0 15px ${color}` 
              : `0 0 25px ${color}60, 0 0 10px ${color}30`,
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: isHovered ? 10 : 1,
            animation: !isHovered ? 'pulse 3s infinite ease-in-out' : 'none',
          }}
        >
          {icon}
        </div>
      </Html>
    </group>
  );
}