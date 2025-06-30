import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, Group, MathUtils } from 'three';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Heart, Volume2, User, Brain, Image as ImageIcon, FileText, Gamepad2, Globe, Camera, Cuboid as Cube, FileVideo, File as FilePdf, Sparkles, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Youtube, Github, Twitch, AlignJustify as Spotify, Rss, Mail, Globe2, MessageSquare, ExternalLink, Film, BookOpen, MapPin, Quote, Music, Utensils, AlertCircle, RefreshCw, Loader, Mic, Newspaper } from 'lucide-react';

interface ContentItem {
  id: string;
  [key: string]: any;
}

interface Content3DCarouselProps {
  items: ContentItem[];
  onClose: () => void;
  onItemSelect?: (item: ContentItem) => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  isLoading?: boolean;
  renderItemContent?: (item: ContentItem, isActive: boolean, scale: number) => JSX.Element;
  title?: string;
}

// Error Boundary fallback component for the entire carousel
function ContentCarouselErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <Html center>
      <div className="bg-black/90 p-8 rounded-lg text-white text-center max-w-lg">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-4">Content Viewer Error</h3>
        <p className="text-white/70 mb-6">There was a problem loading the content carousel.</p>
        <p className="text-white/50 mb-6 text-sm">{error.message}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={resetErrorBoundary} 
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Retry
          </button>
        </div>
      </div>
    </Html>
  );
}

// Error Boundary for individual carousel items
class CarouselItemErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('CarouselItem error caught:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return <CarouselItemErrorFallback />;
    }

    return this.props.children;
  }
}

// Fallback component for failed carousel items
function CarouselItemErrorFallback() {
  return (
    <group>
      <mesh>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#333333" opacity={0.8} transparent />
      </mesh>
      <Html center>
        <div className="bg-black/70 text-white p-4 rounded-lg text-center max-w-xs">
          <div className="text-red-400 mb-2">⚠️</div>
          <div className="text-sm font-medium mb-1">Failed to load content</div>
          <div className="text-xs text-gray-300">This item could not be displayed</div>
        </div>
      </Html>
    </group>
  );
}

// Component that manages camera controls specifically for the carousel
export function CarouselCameraControls() {
  const { camera } = useThree();
  
  useEffect(() => {
    // Store original camera position and rotation for cleanup
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    return () => {
      // Reset camera when unmounting
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
    };
  }, [camera]);
  
  return null;
}

export function Content3DCarousel({ 
  items, 
  onClose, 
  onItemSelect,
  currentIndex: externalCurrentIndex,
  onIndexChange,
  isLoading = false,
  renderItemContent,
  title = "Content Viewer"
}: Content3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotation = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(externalCurrentIndex || 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { camera } = useThree();
  
  // Calculate the angle between each item
  const angleStep = (Math.PI * 2) / Math.max(items.length, 1);
  
  // Radius of the carousel
  const radius = 15;
  
  // Position camera in the center
  useEffect(() => {
    camera.position.set(0, 0, 0);
    // Look at the first item to start
    const firstItemAngle = 0;
    const lookAtTarget = new Vector3(
      Math.sin(firstItemAngle) * radius,
      0,
      Math.cos(firstItemAngle) * radius
    );
    camera.lookAt(lookAtTarget);
  }, [camera, radius]);
  
  // Rotate the view when targetRotation changes
  useFrame(() => {
    if (camera) {
      // Smoothly interpolate camera rotation
      camera.rotation.y = MathUtils.lerp(camera.rotation.y, targetRotation.current, 0.05);
    }
  });
  
  // Handle manual navigation
  const navigateCarousel = useCallback((direction: number) => {
    if (isTransitioning || items.length === 0) return;
    
    // Update target rotation
    targetRotation.current += direction * angleStep;
    
    // Update current index
    const newIndex = (currentIndex - direction + items.length) % items.length;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    // Notify parent if callback provided
    if (onIndexChange) {
      onIndexChange(newIndex);
    }
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [angleStep, currentIndex, items.length, isTransitioning, onIndexChange]);
  
  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser behavior for navigation keys
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s", "A", "D", "W", "S", "Space", " "].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        navigateCarousel(1); // Rotate counterclockwise
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        navigateCarousel(-1); // Rotate clockwise
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
        // Select current item on Enter or Space
        if (items.length > 0 && onItemSelect) {
          onItemSelect(items[currentIndex]);
        }
      }
    };
    
    // Use { passive: false } to allow preventDefault() to work properly
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    
    // Focus the window/document to ensure keyboard events are captured
    window.focus();
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateCarousel, onClose, onItemSelect, items, currentIndex]);
  
  // Update index if controlled externally
  useEffect(() => {
    if (externalCurrentIndex !== undefined && externalCurrentIndex !== currentIndex) {
      setCurrentIndex(externalCurrentIndex);
      
      // Calculate the angle difference to rotate
      const angleDiff = (currentIndex - externalCurrentIndex) * angleStep;
      targetRotation.current += angleDiff;
    }
  }, [externalCurrentIndex, currentIndex, angleStep]);
  
  // Handle item selection
  const handleItemSelect = (item: ContentItem) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Html center>
        <div className="bg-black/80 p-8 rounded-lg shadow-xl text-white text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-white/70">Loading content...</p>
        </div>
      </Html>
    );
  }
  
  // Check if the carousel is empty
  if (items.length === 0) {
    return (
      <Html center>
        <div className="bg-black/80 p-8 rounded-lg shadow-xl text-white text-center">
          <h3 className="text-xl font-semibold mb-4">No Items Found</h3>
          <p className="mb-4">There are no items to display.</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </Html>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={(props) => <ContentCarouselErrorFallback {...props} />}
      onReset={() => {
        console.log("Resetting content carousel after error");
      }}
    >
      {/* Fixed carousel of items around the camera */}
      <group ref={carouselRef}>
        {items.map((item, index) => {
          // Calculate position on the circle
          const angle = index * angleStep;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius; 
          const y = 0; // Keep all items at same height (flat plane)
          
          // Determine if this is the active item
          const isActive = index === currentIndex;
          
          // Simple fixed scale based on whether it's the active item
          const scale = isActive ? 1.2 : 0.9;
          
          return (
            <CarouselItemErrorBoundary 
              key={`carousel-item-boundary-${item.id}`}
              onError={() => console.warn(`Failed to load carousel item: ${item.id}`)}
            >
              <CarouselItem 
                key={`carousel-item-${item.id}`}
                item={item}
                position={[x, y, z]}
                rotation={[0, Math.PI + angle, 0]} // Face toward center
                isActive={isActive}
                onClick={() => handleItemSelect(item)} 
                scale={scale}
                renderContent={renderItemContent}
              />
            </CarouselItemErrorBoundary>
          );
        })}
      </group>
      
      <CarouselCameraControls />
    </ErrorBoundary>
  );
}

interface CarouselItemProps {
  item: ContentItem;
  position: [number, number, number];
  rotation: [number, number, number]; 
  isActive: boolean;
  onClick: () => void;
  scale: number;
  renderContent?: (item: ContentItem, isActive: boolean, scale: number) => JSX.Element;
}

function CarouselItem({ 
  item, 
  position, 
  rotation, 
  isActive,
  onClick,
  scale,
  renderContent
}: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Apply scale directly to the mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);
  
  // Increase clickable area significantly
  const hitAreaSize = [9, 6, 1]; // Much larger hit area
  
  // Default content rendering (fallback if no custom renderer provided)
  const defaultRenderContent = () => {
    // Check if it's a media item with a known type
    if (item.type) {
      const itemType = item.type.toLowerCase();
      
      if (itemType === 'video') {
        return (
          <>
            <mesh>
              <planeGeometry args={[8, 6]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                <FileVideo className="w-8 h-8 text-red-400" />
              </div>
            </Html>
          </>
        );
      } else if (itemType === 'podcast') {
        return (
          <>
            <mesh>
              <planeGeometry args={[8, 6]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-purple-400" />
              </div>
            </Html>
          </>
        );
      } else if (itemType === 'article') {
        return (
          <>
            <mesh>
              <planeGeometry args={[8, 6]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                <Newspaper className="w-8 h-8 text-blue-400" />
              </div>
            </Html>
          </>
        );
      }
    }
    
    // For gallery items
    if (item.media_type) {
      if (item.media_type === 'video') {
        return (
          <>
            <mesh>
              <planeGeometry args={[8, 6]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent border-l-[25px] border-l-white ml-1"></div>
              </div>
            </Html>
          </>
        );
      }
    }
    
    // Generic fallback
    return (
      <>
        <mesh>
          <planeGeometry args={[8, 6]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <Html center position={[0, 0, 0.1]}>
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <LinkIcon className="w-8 h-8 text-white/70" />
          </div>
        </Html>
      </>
    );
  };
  
  return (
    <group position={position} rotation={rotation}>
      {/* Invisible hit area - much larger than the visible plane */}
      <mesh
        onClick={onClick}
        position={[0, 0, 0.5]} // Position it slightly in front of the visual mesh
      >
        <boxGeometry args={hitAreaSize} />
        <meshBasicMaterial opacity={0.001} transparent />
      </mesh>
      
      {/* Content */}
      <group ref={meshRef}>
        {renderContent ? renderContent(item, isActive, scale) : defaultRenderContent()}
      </group>
      
      {/* Item title */}
      <Html center position={[0, -3, 0]}>
        <div className="px-4 py-2 bg-black/80 rounded-lg text-white text-center min-w-[200px] max-w-[300px]">
          {item.title || (item.name ? item.name : "Item")}
        </div>
      </Html>
    </group>
  );
}

// Default gallery renderer for backward compatibility
export function renderGalleryContent(item: any, isActive: boolean, scale: number) {
  // Helper function to check if a file path is an image based on extension
  const isImageFile = (filePath: string): boolean => {
    if (!filePath) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowercasePath = filePath.toLowerCase();
    return imageExtensions.some(ext => lowercasePath.endsWith(ext));
  };

  // Helper function to validate URL format
  const isValidHttpUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;  
    } catch (_) {
      return false;  
    }
  };
  
  // Validate the file path before attempting to load
  const isValidPath = isValidHttpUrl(item.file_path);
  
  // Determine if this item should use texture loading
  const shouldLoadTexture = item.media_type === 'image' && isImageFile(item.file_path) && isValidPath;
  
  const [textureError, setTextureError] = useState(false);
  const loadedRef = useRef(false);
  
  // Always call useTexture hook, but conditionally use the result
  const texture = useTexture(
    shouldLoadTexture ? item.file_path : '/placeholder.jpg', 
    undefined,
    (error) => {
      console.warn(`Texture loading error for ${item.id}:`, error);
      setTextureError(true);
    },
    () => {
      if (!loadedRef.current && shouldLoadTexture) {
        loadedRef.current = true;
      }
    }
  );
  
  // Set material based on media type and error state
  const materialProps = shouldLoadTexture && !textureError
    ? { map: texture } 
    : { color: textureError ? '#666666' : '#111111' };
  
  return (
    <>
      {/* Visible image plane */}
      <mesh>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial 
          {...materialProps} 
          transparent
          opacity={1}
        />
      </mesh>
      
      {/* Error indicator if texture failed to load */}
      {textureError && (
        <Html center>
          <div className="bg-black/70 text-white p-2 rounded text-center text-xs">
            <div className="text-red-400 mb-1">⚠️</div>
            <div>Image failed to load</div>
          </div>
        </Html>
      )}
      
      {/* Video indicator for video items */}
      {item.media_type === 'video' && (
        <Html center position={[0, 0, 0.1]}>
          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent border-l-[25px] border-l-white ml-1"></div>
          </div>
        </Html>
      )}
    </>
  );
}

// Helper function to get platform icon and color
function getPlatformIconAndColor(item: any) {
  const source = item.source || '';
  const sourceLower = source.toLowerCase();
  
  if (sourceLower.includes('facebook')) {
    return { icon: Facebook, color: 'text-blue-500', bgColor: 'from-blue-500/30 to-blue-700/30', borderColor: 'border-blue-500/50' };
  }
  if (sourceLower.includes('instagram')) {
    return { icon: Instagram, color: 'text-pink-500', bgColor: 'from-pink-500/30 to-purple-600/30', borderColor: 'border-pink-500/50' };
  }
  if (sourceLower.includes('twitter') || sourceLower.includes('x.com')) {
    return { icon: Twitter, color: 'text-blue-400', bgColor: 'from-blue-400/30 to-blue-600/30', borderColor: 'border-blue-400/50' };
  }
  if (sourceLower.includes('linkedin')) {
    return { icon: Linkedin, color: 'text-blue-600', bgColor: 'from-blue-600/30 to-blue-800/30', borderColor: 'border-blue-600/50' };
  }
  if (sourceLower.includes('youtube')) {
    return { icon: Youtube, color: 'text-red-500', bgColor: 'from-red-500/30 to-red-700/30', borderColor: 'border-red-500/50' };
  }
  if (sourceLower.includes('github')) {
    return { icon: Github, color: 'text-white', bgColor: 'from-gray-600/30 to-gray-800/30', borderColor: 'border-gray-400/50' };
  }
  if (sourceLower.includes('twitch')) {
    return { icon: Twitch, color: 'text-purple-500', bgColor: 'from-purple-500/30 to-purple-700/30', borderColor: 'border-purple-500/50' };
  }
  if (sourceLower.includes('spotify')) {
    return { icon: Spotify, color: 'text-green-500', bgColor: 'from-green-500/30 to-green-700/30', borderColor: 'border-green-500/50' };
  }
  if (sourceLower.includes('medium') || sourceLower.includes('blog')) {
    return { icon: Rss, color: 'text-orange-500', bgColor: 'from-orange-500/30 to-orange-700/30', borderColor: 'border-orange-500/50' };
  }
  if (sourceLower.includes('mail') || sourceLower.includes('email')) {
    return { icon: Mail, color: 'text-blue-400', bgColor: 'from-blue-400/30 to-blue-600/30', borderColor: 'border-blue-400/50' };
  }
  if (sourceLower.includes('discord') || sourceLower.includes('slack')) {
    return { icon: MessageSquare, color: 'text-indigo-400', bgColor: 'from-indigo-400/30 to-indigo-600/30', borderColor: 'border-indigo-400/50' };
  }
  
  // Default for type-based icons if no source match
  if (item.type === 'video') {
    return { icon: FileVideo, color: 'text-red-400', bgColor: 'from-red-500/30 to-red-700/30', borderColor: 'border-red-500/50' };
  } 
  if (item.type === 'podcast') {
    return { icon: Mic, color: 'text-purple-400', bgColor: 'from-purple-500/30 to-purple-700/30', borderColor: 'border-purple-500/50' };
  }
  if (item.type === 'article') {
    return { icon: Newspaper, color: 'text-blue-400', bgColor: 'from-blue-500/30 to-blue-700/30', borderColor: 'border-blue-500/50' };
  }
  
  return { icon: Globe2, color: 'text-purple-400', bgColor: 'from-purple-500/30 to-indigo-500/30', borderColor: 'border-purple-500/50' };
}

// Media links renderer with enhanced visual design
export function renderMediaLinkContent(item: any, isActive: boolean, scale: number) {
  // Get the platform-specific icon and styling
  const { icon: IconComponent, color, bgColor, borderColor } = getPlatformIconAndColor(item);
  
  // Determine content type icon and color
  let ContentIcon = FileVideo;
  let contentColor = "text-red-400";
  let contentLabel = "Video";
  
  if (item.type === 'podcast') {
    ContentIcon = Mic;
    contentColor = "text-purple-400";
    contentLabel = "Podcast";
  } else if (item.type === 'article') {
    ContentIcon = Newspaper;
    contentColor = "text-blue-400";
    contentLabel = "Article";
  }

  // Animation styles for active state
  const activeClass = isActive ? 
    'shadow-lg transform scale-105 border-2' : 
    'shadow border';
  
  // Determine if we should make plane transparent
  const meshOpacity = 0.0; // Fully transparent 3D plane

  return (
    <>
      {/* Transparent 3D mesh as base */}
      <mesh>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#000000" opacity={meshOpacity} transparent />
      </mesh>
      
      {/* HTML content with frame styling */}
      <Html center position={[0, 0, 0.1]} transform>
        <div 
          className={`w-80 h-60 bg-gradient-to-r ${bgColor} backdrop-blur-sm rounded-lg p-4 ${activeClass} ${borderColor} transition-all duration-300 overflow-hidden`}
          style={{ 
            boxShadow: isActive ? '0 0 25px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.5)',
            transform: `scale(${scale})`,
          }}
        >
          {/* Platform Logo & Type Badge */}
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-black/40 rounded-lg">
              <IconComponent className={`w-8 h-8 ${color}`} />
            </div>
            <div className={`px-2 py-1 bg-black/40 rounded-full ${contentColor} text-xs font-medium`}>
              {contentLabel}
            </div>
          </div>
          
          {/* Media Info */}
          <div className="mb-3 overflow-hidden">
            <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
            <div className="text-white/70 text-xs truncate">{item.source}</div>
          </div>
          
          {/* URL Link */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between">
              <div className="text-xs bg-black/50 px-2 py-1 rounded-md text-white/60 truncate max-w-[140px]">
                {new URL(item.url).hostname}
              </div>
              
              {/* Added explicit button to open the link */}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500/70 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-white text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Open Link
              </a>
            </div>
          </div>
        </div>
      </Html>
    </>
  );
}

// Get social platform icon and color
function getDigitalPresencePlatformIconAndColor(item: any) {
  const name = item.name?.toLowerCase() || '';
  
  if (name.includes('facebook')) {
    return { icon: Facebook, color: 'text-blue-500', bgColor: 'from-blue-500/30 to-blue-700/30', borderColor: 'border-blue-500/50' };
  }
  if (name.includes('instagram')) {
    return { icon: Instagram, color: 'text-pink-500', bgColor: 'from-pink-500/30 to-purple-600/30', borderColor: 'border-pink-500/50' };
  }
  if (name.includes('twitter') || name.includes('x.com') || name.includes('x ')) {
    return { icon: Twitter, color: 'text-blue-400', bgColor: 'from-blue-400/30 to-blue-600/30', borderColor: 'border-blue-400/50' };
  }
  if (name.includes('linkedin')) {
    return { icon: Linkedin, color: 'text-blue-600', bgColor: 'from-blue-600/30 to-blue-800/30', borderColor: 'border-blue-600/50' };
  }
  if (name.includes('youtube')) {
    return { icon: Youtube, color: 'text-red-500', bgColor: 'from-red-500/30 to-red-700/30', borderColor: 'border-red-500/50' };
  }
  if (name.includes('github')) {
    return { icon: Github, color: 'text-white', bgColor: 'from-gray-600/30 to-gray-800/30', borderColor: 'border-gray-400/50' };
  }
  if (name.includes('twitch')) {
    return { icon: Twitch, color: 'text-purple-500', bgColor: 'from-purple-500/30 to-purple-700/30', borderColor: 'border-purple-500/50' };
  }
  if (name.includes('spotify')) {
    return { icon: Spotify, color: 'text-green-500', bgColor: 'from-green-500/30 to-green-700/30', borderColor: 'border-green-500/50' };
  }
  if (name.includes('medium') || name.includes('blog')) {
    return { icon: Rss, color: 'text-orange-500', bgColor: 'from-orange-500/30 to-orange-700/30', borderColor: 'border-orange-500/50' };
  }
  if (name.includes('mail') || name.includes('email')) {
    return { icon: Mail, color: 'text-blue-400', bgColor: 'from-blue-400/30 to-blue-600/30', borderColor: 'border-blue-400/50' };
  }
  if (name.includes('discord') || name.includes('slack')) {
    return { icon: MessageSquare, color: 'text-indigo-400', bgColor: 'from-indigo-400/30 to-indigo-600/30', borderColor: 'border-indigo-400/50' };
  }
  
  return { icon: Globe2, color: 'text-purple-400', bgColor: 'from-purple-500/30 to-indigo-500/30', borderColor: 'border-purple-500/50' };
}

// Digital presence renderer for social media and other online profiles
export function renderDigitalPresenceContent(item: any, isActive: boolean, scale: number) {
  // Get the platform-specific icon and styling
  const { icon: IconComponent, color, bgColor, borderColor } = getDigitalPresencePlatformIconAndColor(item);

  // Format URL for display
  const displayUrl = (() => {
    try {
      if (item.url && typeof item.url === 'string') {
        const url = new URL(item.url);
        return url.hostname;
      }
      return 'Link';
    } catch {
      return 'Link';
    }
  })();

  // Animation styles for active state
  const activeClass = isActive ? 
    'shadow-lg transform scale-105 border-2' : 
    'shadow border';
  
  // Fully transparent 3D plane
  const meshOpacity = 0.0;

  return (
    <>
      {/* Transparent 3D mesh as base */}
      <mesh>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#000000" opacity={meshOpacity} transparent />
      </mesh>
      
      {/* HTML content with frame styling */}
      <Html center position={[0, 0, 0.1]} transform>
        <div 
          className={`w-80 h-60 bg-gradient-to-r ${bgColor} backdrop-blur-sm rounded-lg p-4 ${activeClass} ${borderColor} transition-all duration-300 overflow-hidden`}
          style={{ 
            boxShadow: isActive ? '0 0 25px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.5)',
            transform: `scale(${scale})`,
          }}
        >
          {/* Platform Logo */}
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-black/40 rounded-lg">
              <IconComponent className={`w-10 h-10 ${color}`} />
            </div>
            <div className="text-right">
              <div className="text-white/90 font-bold text-lg mb-1">{item.name}</div>
              <div className="text-white/60 text-xs">{new Date(item.timestamp).toLocaleDateString()}</div>
            </div>
          </div>
          
          {/* URL Display */}
          <div className="bg-black/40 px-3 py-2 rounded-lg mb-3 overflow-hidden">
            <div className="text-white/70 text-sm truncate">{displayUrl}</div>
          </div>
          
          {/* Action Button */}
          <div className="absolute bottom-3 left-3 right-3">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-500/70 hover:bg-purple-500 w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
              Visit {item.name}
            </a>
          </div>
        </div>
      </Html>
    </>
  );
}

// Helper function to get icon and theme for a personal favorite item
function getFavoriteIconAndTheme(itemType: string, value: string) {
  switch (itemType) {
    case 'song':
      return { 
        icon: Music, 
        color: 'text-pink-400', 
        bgColor: 'from-pink-500/30 to-rose-600/30', 
        borderColor: 'border-pink-500/50',
        label: 'Song'
      };
    case 'movie':
      return { 
        icon: Film, 
        color: 'text-blue-400', 
        bgColor: 'from-blue-500/30 to-indigo-600/30', 
        borderColor: 'border-blue-500/50',
        label: 'Movie'
      };
    case 'book':
      return { 
        icon: BookOpen, 
        color: 'text-emerald-400', 
        bgColor: 'from-emerald-500/30 to-green-600/30', 
        borderColor: 'border-emerald-500/50',
        label: 'Book'
      };
    case 'location':
      return { 
        icon: MapPin, 
        color: 'text-amber-400', 
        bgColor: 'from-amber-500/30 to-orange-600/30', 
        borderColor: 'border-amber-500/50',
        label: 'Place'
      };
    case 'quote':
      return { 
        icon: Quote, 
        color: 'text-purple-400', 
        bgColor: 'from-purple-500/30 to-indigo-600/30', 
        borderColor: 'border-purple-500/50',
        label: 'Quote'
      };
    case 'food':
      return { 
        icon: Utensils, 
        color: 'text-red-400', 
        bgColor: 'from-red-500/30 to-rose-600/30', 
        borderColor: 'border-red-500/50',
        label: 'Food'
      };
    default:
      return { 
        icon: Heart, 
        color: 'text-pink-400', 
        bgColor: 'from-pink-500/30 to-red-600/30', 
        borderColor: 'border-pink-500/50',
        label: 'Favorite'
      };
  }
}

// Personal favorites renderer with media previews
export function renderPersonalFavoritesContent(item: any, isActive: boolean, scale: number) {
  // Get YouTube video ID if it's a YouTube URL
  const getYouTubeId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Determine item type and value
  const itemValue = item.value || '';
  const isYouTubeUrl = typeof itemValue === 'string' && (itemValue.includes('youtube.com') || itemValue.includes('youtu.be'));
  const youtubeVideoId = isYouTubeUrl ? getYouTubeId(itemValue) : null;
  
  // Handle special case for YouTube links
  const itemType = isYouTubeUrl ? 'video' : item.type || 'favorite';
  const { icon: IconComponent, color, bgColor, borderColor, label } = 
    getFavoriteIconAndTheme(itemType, itemValue);

  // Check if Amazon book link
  const isAmazonBook = typeof itemValue === 'string' && 
    (itemValue.includes('amazon.com') && 
    (itemValue.includes('/books/') || itemValue.includes('/dp/')));
    
  // Check if movie poster URL
  const isMoviePoster = typeof itemValue === 'string' && 
    (itemValue.includes('movieposters.com') || 
     itemValue.includes('imdb.com') || 
     itemValue.includes('themoviedb.org'));

  // Check if it's any URL
  const isUrl = (() => {
    try {
      new URL(itemValue);
      return true;
    } catch {
      return false;
    }
  })();

  // For quotes, we need special handling for the longer text
  const isQuote = item.type === 'quote';
  
  // Animation styles for active state
  const activeClass = isActive ? 
    'shadow-lg transform scale-105 border-2' : 
    'shadow border';
  
  // Fully transparent 3D plane
  const meshOpacity = 0.0;

  // Set up direct image URLs
  // These are fixed Pexels URLs that will always work
  const amazonBookImage = "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=400";
  const moviePosterImage = "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400";
  
  // State for tracking image loading errors
  const [imageError, setImageError] = useState(false);
  
  // Reset error state when item changes
  useEffect(() => {
    setImageError(false);
  }, [itemValue]);
  
  // For books and movies, use specific images based on some keywords in the value
  const getBookImageUrl = (value: string) => {
    if (value.toLowerCase().includes('harry potter')) {
      return "https://images.pexels.com/photos/8391515/pexels-photo-8391515.jpeg?auto=compress&cs=tinysrgb&w=400";
    }
    if (value.toLowerCase().includes('dune')) {
      return "https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=400";
    }
    return amazonBookImage;
  };
  
  const getMovieImageUrl = (value: string) => {
    if (value.toLowerCase().includes('star wars')) {
      return "https://images.pexels.com/photos/2085832/pexels-photo-2085832.jpeg?auto=compress&cs=tinysrgb&w=400";
    }
    if (value.toLowerCase().includes('inception')) {
      return "https://images.pexels.com/photos/3131971/pexels-photo-3131971.jpeg?auto=compress&cs=tinysrgb&w=400";
    }
    return moviePosterImage;
  };

  return (
    <>
      {/* Transparent 3D mesh as base */}
      <mesh>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#000000" opacity={meshOpacity} transparent />
      </mesh>
      
      {/* HTML content with frame styling */}
      <Html center position={[0, 0, 0.1]} transform>
        <div 
          className={`w-80 h-60 bg-gradient-to-r ${bgColor} backdrop-blur-sm rounded-lg ${activeClass} ${borderColor} transition-all duration-300 overflow-hidden relative`}
          style={{ 
            boxShadow: isActive ? '0 0 25px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.5)',
            transform: `scale(${scale})`,
          }}
        >
          {/* Special YouTube Video Preview */}
          {youtubeVideoId ? (
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                  alt="YouTube Thumbnail"
                  className="w-full h-full object-cover opacity-70"
                  onError={(e) => {
                    // Fallback to standard quality if maxres not available
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeVideoId}/0.jpg`;
                    console.log('Switching to standard thumbnail for YouTube video:', youtubeVideoId);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10"></div>
              </div>
              
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                <div className="p-2 bg-black/60 rounded-lg">
                  <FileVideo className={`w-6 h-6 ${color}`} />
                </div>
                <div className="px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                  YouTube Video
                </div>
              </div>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-red-600/80 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-white ml-1"></div>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <p className="text-white font-bold truncate">{item.value}</p>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-white/70 text-xs truncate">
                    {item.title || "YouTube Video"}
                  </div>
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600/80 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-white text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Watch
                  </a>
                </div>
              </div>
            </>
          ) : isMoviePoster && isUrl ? (
            // Movie Poster Preview
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={isMoviePoster && !imageError ? item.value : getMovieImageUrl(itemValue)}
                  alt="Movie Poster"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    console.log('Movie poster failed to load:', item.value);
                    setImageError(true);
                    // Use fallback image
                    (e.target as HTMLImageElement).src = getMovieImageUrl(itemValue);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              </div>
              
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between">
                <div className="p-2 bg-black/60 rounded-lg">
                  <Film className={`w-6 h-6 ${color}`} />
                </div>
                <div className="px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                  Movie Poster
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <div className="mb-1 text-white font-bold truncate">{item.title || "Movie"}</div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-white/70 text-xs truncate max-w-[120px]">
                    {/* Display just domain name */}
                    {(() => {
                      try {
                        return new URL(item.value).hostname.replace('www.', '');
                      } catch {
                        return 'Movie Link';
                      }
                    })()}
                  </div>
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600/80 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-white text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </a>
                </div>
              </div>
            </>
          ) : isAmazonBook && isUrl ? (
            // Amazon Book Preview
            <>
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={isAmazonBook && !imageError ? item.value : getBookImageUrl(itemValue)}
                  alt="Book Cover"
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => {
                    console.log('Book cover failed to load:', item.value);
                    setImageError(true);
                    // Use fallback image
                    (e.target as HTMLImageElement).src = getBookImageUrl(itemValue);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
              </div>
              
              <div className="absolute top-0 left-0 right-0 p-3 flex justify-between">
                <div className="p-2 bg-black/60 rounded-lg">
                  <BookOpen className={`w-6 h-6 ${color}`} />
                </div>
                <div className="px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                  Amazon Book
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <div className="mb-1 text-white font-bold truncate">{item.title || "Book"}</div>
                
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-white/70 text-xs truncate max-w-[120px]">
                    {/* Display just domain name */}
                    {(() => {
                      try {
                        return new URL(item.value).hostname.replace('www.', '');
                      } catch {
                        return 'Book Link';
                      }
                    })()}
                  </div>
                  <a
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600/80 hover:bg-emerald-600 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-white text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View
                  </a>
                </div>
              </div>
            </>
          ) : isUrl ? (
            // Generic URL Preview
            <>
              <div className="p-4">
                {/* Item icon and type */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-black/40 rounded-lg">
                    <IconComponent className={`w-8 h-8 ${color}`} />
                  </div>
                  <div className={`px-2 py-1 bg-black/40 rounded-full ${color} text-xs font-medium`}>
                    {label}
                  </div>
                </div>
                
                {/* URL display */}
                <div className="bg-black/40 px-3 py-2 rounded-lg mb-4 overflow-hidden">
                  <div className="text-white text-sm font-medium mb-1 truncate">{item.title || "Link"}</div>
                  <div className="text-white/70 text-xs truncate">{item.value}</div>
                </div>
                
                {/* Description or truncated URL */}
                <div className="bg-black/30 px-3 py-2 rounded-lg mb-3">
                  <p className="text-white/80 text-xs">
                    {item.description || (() => {
                      try {
                        const url = new URL(item.value);
                        return `Link to ${url.hostname}`;
                      } catch {
                        return "External Link";
                      }
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="absolute bottom-3 left-3 right-3">
                <a
                  href={item.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500/70 hover:bg-blue-500 w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link
                </a>
              </div>
            </>
          ) : isQuote ? (
            // Quote Display
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-black/40 rounded-lg">
                  <Quote className={`w-8 h-8 ${color}`} />
                </div>
                <div className={`px-2 py-1 bg-black/40 rounded-full ${color} text-xs font-medium`}>
                  {label}
                </div>
              </div>
              
              <div className="bg-black/40 px-4 py-3 rounded-lg flex flex-col h-[160px] overflow-hidden">
                <Quote className={`w-6 h-6 ${color} mb-2`} />
                <p className="text-white/90 text-sm italic overflow-y-auto">
                  {itemValue}
                </p>
              </div>
            </div>
          ) : (
            // Default content display
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black/40 rounded-lg">
                  <IconComponent className={`w-8 h-8 ${color}`} />
                </div>
                <div className={`px-2 py-1 bg-black/40 rounded-full ${color} text-xs font-medium`}>
                  {label}
                </div>
              </div>
              
              <div className="bg-black/40 px-4 py-3 rounded-lg flex flex-col h-36 overflow-auto">
                <h3 className="text-white font-bold text-base mb-2">{item.title || label}</h3>
                <p className="text-white/90 text-sm overflow-y-auto">
                  {itemValue}
                </p>
              </div>
            </div>
          )}
        </div>
      </Html>
    </>
  );
}