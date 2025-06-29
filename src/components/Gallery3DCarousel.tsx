import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import React from 'react';

interface Gallery3DCarouselProps {
  galleryItems: any[];
  onClose: () => void;
  onItemSelect?: (item: any) => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  isLoading?: boolean;
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
          <div className="text-red-400 mb-2">⚠️</div>
          <div className="text-sm font-medium mb-1">Failed to load media</div>
          <div className="text-xs text-gray-300">Image unavailable</div>
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

export function Gallery3DCarousel({ 
  galleryItems, 
  onClose, 
  onItemSelect,
  currentIndex: externalCurrentIndex,
  onIndexChange,
  isLoading = false
}: Gallery3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotation = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(externalCurrentIndex || 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadingStatesRef = useRef<Record<string, boolean>>({});
  const { camera } = useThree();
  
  // Calculate the angle between each item
  const angleStep = (Math.PI * 2) / Math.max(galleryItems.length, 1);
  
  // Radius of the carousel
  const radius = 15;
  
  // Position camera in the center
  useEffect(() => {
    camera.position.set(0, 0, 0);
    // Look at the first image to start
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
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        navigateCarousel(1); // Rotate counterclockwise
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        navigateCarousel(-1); // Rotate clockwise
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Handle manual navigation
  const navigateCarousel = useCallback((direction: number) => {
    if (isTransitioning || galleryItems.length === 0) return;
    
    // Update target rotation
    targetRotation.current += direction * angleStep;
    
    // Update current index
    const newIndex = (currentIndex - direction + galleryItems.length) % galleryItems.length;
    
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
  }, [angleStep, currentIndex, galleryItems.length, isTransitioning, onIndexChange]);
  
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
  const handleItemSelect = (item: any) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };
  
  // Track image loading state
  const handleImageLoaded = useCallback((itemId: string) => {
    loadingStatesRef.current[itemId] = true;
  }, []);
  
  // Loading state
  if (isLoading) {
    return (
      <Html center>
        <div className="bg-black/80 p-8 rounded-lg shadow-xl text-white text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">Loading Gallery</h3>
          <p className="text-white/70">Please wait while we load your gallery items...</p>
        </div>
      </Html>
    );
  }
  
  // Check if the carousel is empty
  if (galleryItems.length === 0) {
    return (
      <Html center>
        <div className="bg-black/80 p-8 rounded-lg shadow-xl text-white text-center">
          <h3 className="text-xl font-semibold mb-4">No Gallery Items</h3>
          <p className="mb-4">There are no images or videos to display.</p>
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
    <>
      {/* Fixed carousel of images around the camera */}
      <group ref={carouselRef}>
        {galleryItems.map((item, index) => {
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
                isLoaded={!!loadingStatesRef.current[item.id]}
                onImageLoaded={() => handleImageLoaded(item.id)}
                onClick={() => handleItemSelect(item)} 
                scale={scale}
              />
            </CarouselItemErrorBoundary>
          );
        })}
      </group>
      
      <CarouselCameraControls />
    </>
  );
}

interface CarouselItemProps {
  item: any;
  position: [number, number, number];
  rotation: [number, number, number]; 
  isActive: boolean;
  isLoaded: boolean;
  onImageLoaded: () => void;
  onClick: () => void;
  scale: number;
}

function CarouselItem({ 
  item, 
  position, 
  rotation, 
  isActive,
  isLoaded, 
  onImageLoaded, 
  onClick,
  scale
}: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const loadedRef = useRef(false);
  const [textureError, setTextureError] = useState(false);
  
  // Always call useTexture hook, but conditionally use the result
  // This ensures the hook is called the same number of times on each render
  const texture = useTexture(
    item.media_type === 'image' ? item.file_path || '' : '/placeholder.jpg', 
    undefined,
    (error) => {
      console.warn('Texture loading error:', error);
      setTextureError(true);
    },
    () => {
      if (!loadedRef.current && item.media_type === 'image') {
        loadedRef.current = true;
        onImageLoaded();
      }
    }
  );

  // Apply scale directly to the mesh
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);
  
  // Set material based on media type and error state
  const materialProps = item.media_type === 'image' && !textureError
    ? { map: texture } 
    : { color: textureError ? '#666666' : '#111111' };
  
  // Render content based on state - no early returns
  return (
    <group position={position} rotation={rotation}>
      {/* Image plane */}
      <mesh
        ref={meshRef}
        onClick={onClick}
      >
        <planeGeometry args={[6, 4]} />
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
    </group>
  );
}