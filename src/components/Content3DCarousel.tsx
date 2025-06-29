import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Vector3, Group, MathUtils } from 'three';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle, Loader, RefreshCw, XCircle, FileText, FileVideo, Mic, Newspaper, Link as LinkIcon, Facebook, Instagram, Twitter, Linkedin, Youtube, Github, Twitch, AlignJustify as Spotify, Rss, Mail, Globe2, MessageSquare, ExternalLink, Play } from 'lucide-react';

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
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#333333" opacity={0.8} transparent />
      </mesh>
      <Html center>
        <div className="bg-black/70 text-white p-4 rounded-lg text-center max-w-xs">
          <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <div className="text-sm font-medium mb-1">Failed to load content</div>
          <div className="text-xs text-white/70">This item could not be displayed</div>
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
  }, [onClose, onItemSelect, items, currentIndex]);
  
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
      
      {/* Add navigation controls */}
      <Html position={[0, -6, 0]} center>
        <div className="flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full">
          <button 
            onClick={() => navigateCarousel(1)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            ◀
          </button>
          <span className="text-white">
            {currentIndex + 1} / {items.length}
          </span>
          <button 
            onClick={() => navigateCarousel(-1)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
          >
            ▶
          </button>
        </div>
      </Html>
      
      {/* Close button */}
      <Html position={[0, 6, 0]} center>
        <button 
          onClick={onClose}
          className="p-3 bg-black/60 hover:bg-black/80 rounded-full text-white"
        >
          ✕
        </button>
      </Html>
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
  const [isHovered, setIsHovered] = useState(false);
  
  // Apply scale directly to the mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);
  
  // Default content rendering (fallback if no custom renderer provided)
  const defaultRenderContent = () => {
    // Check if it's a media item with a known type
    if (item.type) {
      const itemType = item.type.toLowerCase();
      
      if (itemType === 'video') {
        return (
          <>
            <mesh visible={false}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div 
                className={`w-64 h-44 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4 transition-all duration-300 cursor-pointer ${isActive ? 'scale-105 shadow-lg' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-black/40 rounded-lg">
                    <FileVideo className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="px-2 py-1 bg-black/40 rounded-full text-red-400 text-xs font-medium">
                    Video
                  </div>
                </div>
                
                <div className="mb-3 overflow-hidden">
                  <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
                  <div className="text-white/70 text-xs truncate">{item.source}</div>
                </div>
                
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs bg-black/50 px-2 py-1 rounded-md text-white/60 truncate max-w-[140px]">
                      {item.url ? (new URL(item.url)).hostname : 'Watch video'}
                    </div>
                    <div className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
                    <div className="bg-white/20 p-4 rounded-full">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </>
        );
      } else if (itemType === 'podcast') {
        return (
          <>
            <mesh visible={false}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div 
                className={`w-64 h-44 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4 transition-all duration-300 cursor-pointer ${isActive ? 'scale-105 shadow-lg' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-black/40 rounded-lg">
                    <Mic className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="px-2 py-1 bg-black/40 rounded-full text-purple-400 text-xs font-medium">
                    Podcast
                  </div>
                </div>
                
                <div className="mb-3 overflow-hidden">
                  <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
                  <div className="text-white/70 text-xs truncate">{item.source}</div>
                </div>
                
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs bg-black/50 px-2 py-1 rounded-md text-white/60 truncate max-w-[140px]">
                      {item.url ? (new URL(item.url)).hostname : 'Listen'}
                    </div>
                    <div className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
                    <div className="bg-white/20 p-4 rounded-full">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </>
        );
      } else if (itemType === 'article') {
        return (
          <>
            <mesh visible={false}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div 
                className={`w-64 h-44 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 transition-all duration-300 cursor-pointer ${isActive ? 'scale-105 shadow-lg' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-black/40 rounded-lg">
                    <Newspaper className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="px-2 py-1 bg-black/40 rounded-full text-blue-400 text-xs font-medium">
                    Article
                  </div>
                </div>
                
                <div className="mb-3 overflow-hidden">
                  <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
                  <div className="text-white/70 text-xs truncate">{item.source}</div>
                </div>
                
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs bg-black/50 px-2 py-1 rounded-md text-white/60 truncate max-w-[140px]">
                      {item.url ? (new URL(item.url)).hostname : 'Read article'}
                    </div>
                    <div className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <span className="text-white text-sm font-medium">Click to read</span>
                    </div>
                  </div>
                )}
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
            <mesh visible={false}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
            <Html center position={[0, 0, 0.1]}>
              <div 
                className={`w-64 h-44 bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/30 rounded-lg relative overflow-hidden cursor-pointer ${isActive ? 'scale-105 shadow-lg' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
              >
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="px-2 py-1 bg-black/50 rounded text-xs text-white/90">
                      Video
                    </div>
                    <div className="bg-black/50 rounded-full p-1">
                      <FileVideo className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="bg-black/50 p-2 rounded mt-auto">
                    <div className="text-white text-sm font-medium truncate">
                      {item.title}
                    </div>
                  </div>
                </div>
                
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[15px] border-t-transparent border-b-[15px] border-b-transparent border-l-[25px] border-l-white ml-1"></div>
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </>
        );
      }
    }
    
    // Generic fallback
    return (
      <>
        <mesh visible={false}>
          <planeGeometry args={[6, 4]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <Html center position={[0, 0, 0.1]}>
          <div 
            className={`w-64 h-44 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg p-4 transition-all duration-300 cursor-pointer ${isActive ? 'scale-105 shadow-lg' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-black/40 rounded-lg">
                <LinkIcon className="w-8 h-8 text-white/70" />
              </div>
            </div>
            
            <div className="mb-3 overflow-hidden">
              <h3 className="text-white font-bold text-sm truncate mb-1">{item.title || "Link"}</h3>
              <div className="text-white/70 text-xs truncate">{item.url || ""}</div>
            </div>
            
            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
                <div className="bg-white/20 p-3 rounded-lg">
                  <span className="text-white text-sm font-medium">Click to open</span>
                </div>
              </div>
            )}
          </div>
        </Html>
      </>
    );
  };
  
  return (
    <group position={position} rotation={rotation}>
      {/* Content */}
      <group 
        ref={meshRef} 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {renderContent ? renderContent(item, isActive, scale) : defaultRenderContent()}
        
        {/* Active indicator - pulsing border for the active item */}
        {isActive && (
          <Html center>
            <div 
              className="absolute inset-0 rounded-lg animate-pulse"
              style={{
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                animation: 'pulse 2s infinite',
              }}
            />
          </Html>
        )}
      </group>
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
  const isValidHttpUrl = (string: string): boolean => {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
    return url.protocol === "http:" || url.protocol === "https:";
  };
  
  // Validate the file path before attempting to load
  const isValidPath = isValidHttpUrl(item.file_path);
  
  // Determine if this item should use texture loading
  const shouldLoadTexture = item.media_type === 'image' && isImageFile(item.file_path) && isValidPath;
  
  const [textureError, setTextureError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      {/* Wrap in a group that can be clicked */}
      <group>
        {/* Visible image plane */}
        <mesh visible={false}>
          <planeGeometry args={[6, 4]} />
          <meshBasicMaterial 
            {...materialProps} 
            transparent
            opacity={1}
          />
        </mesh>
        
        {/* Enhanced HTML content with styling and proper click handling */}
        <Html center position={[0, 0, 0.1]}>
          <div 
            className={`w-64 h-44 rounded-lg overflow-hidden cursor-pointer border transition-all duration-300 ${
              isActive ? 'border-white/50 shadow-lg scale-105' : 'border-white/20'
            }`}
            onClick={(e) => e.stopPropagation()} // Prevent event bubbling
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
          >
            {/* Image container with proper styling */}
            {shouldLoadTexture && !textureError ? (
              <div 
                className="w-full h-full bg-center bg-cover relative"
                style={{ backgroundImage: `url(${item.file_path})` }}
              >
                {/* Overlay for hover effect */}
                {isHovered && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {item.media_type === 'video' ? (
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    ) : (
                      <div className="bg-black/60 px-3 py-2 rounded-lg">
                        <span className="text-white text-sm">View full image</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Caption overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                </div>
              </div>
            ) : (
              // Fallback for errors or video items
              <div className="w-full h-full bg-black/50 flex flex-col items-center justify-center relative">
                {item.media_type === 'video' ? (
                  <>
                    <FileVideo className="w-12 h-12 text-white/60 mb-2" />
                    <p className="text-white/80 text-sm">{item.title}</p>
                    
                    {/* Play button overlay on hover */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                      </div>
                    )}
                  </>
                ) : textureError ? (
                  <>
                    <XCircle className="w-12 h-12 text-red-400 mb-2" />
                    <p className="text-white/80 text-sm">Image failed to load</p>
                    <p className="text-white/60 text-xs mt-1">{item.title}</p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 border-2 border-white/40 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white/80 text-sm">Loading...</p>
                  </>
                )}
              </div>
            )}
          </div>
        </Html>
      </group>
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
  const [isHovered, setIsHovered] = useState(false);
  
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

  // Determine if we should make plane transparent
  const meshOpacity = 0.0; // Fully transparent 3D plane

  return (
    <>
      {/* Transparent 3D mesh as base */}
      <mesh visible={false}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#000000" opacity={meshOpacity} transparent />
      </mesh>
      
      {/* HTML content with frame styling */}
      <Html center position={[0, 0, 0.1]} transform>
        <div 
          className={`w-64 h-44 bg-gradient-to-r ${bgColor} backdrop-blur-sm rounded-lg p-4 ${
            isActive ? 'scale-105 border-2' : 'border'
          } ${borderColor} transition-all duration-300 overflow-hidden cursor-pointer ${
            isHovered ? 'shadow-lg shadow-white/20' : ''
          }`}
          style={{ boxShadow: isActive ? '0 0 25px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.url, '_blank', 'noopener,noreferrer');
          }}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
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
              <div className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          {/* Interactive Overlay */}
          {isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors">
              <div className="bg-white/20 p-3 rounded-lg">
                <span className="text-white text-sm font-medium">Click to open</span>
              </div>
            </div>
          )}
        </div>
      </Html>
    </>
  );
}