import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { Group, MathUtils, Vector3 } from 'three';

interface Gallery3DCarouselProps {
  galleryItems: any[];
  onClose: () => void;
  onItemSelect?: (item: any) => void;
}

// Component that manages camera and controls specifically for the carousel
export function CarouselCameraControls() {
  const { camera } = useThree();
  
  // Set initial camera position slightly above the center
  useEffect(() => {
    // Position camera slightly above the carousel plane for better viewing angle
    camera.position.set(0, 2, 0.1);
    camera.lookAt(0, 0, 0);
    
    // Store original camera position for cleanup
    const originalPosition = camera.position.clone();
    
    return () => {
      // Reset camera position when component unmounts
      camera.position.copy(originalPosition);
    };
  }, [camera]);
  
  return null;
}

export function Gallery3DCarousel({ galleryItems, onClose, onItemSelect }: Gallery3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotationY = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadingStatesRef = useRef<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const { camera, size } = useThree();
  
  // Calculate the angle between each item
  const angleStep = (Math.PI * 2) / Math.max(galleryItems.length, 1);
  
  // Radius of the carousel - set a fixed radius for all images
  const radius = 10;
  
  // Animate carousel rotation
  useFrame(({ mouse }) => {
    if (carouselRef.current) {
      if (isDragging.current) {
        // Calculate rotation change based on mouse movement
        const deltaX = (mouse.x - lastMouseX.current) * 5; // Amplify the effect
        targetRotationY.current += deltaX;
        lastMouseX.current = mouse.x;
        
        // Update current index based on rotation
        const normalizedRotation = ((targetRotationY.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const newIndex = Math.round(normalizedRotation / angleStep) % galleryItems.length;
        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
        }
      }
      
      // Smoothly interpolate current rotation towards target rotation
      carouselRef.current.rotation.y = MathUtils.lerp(
        carouselRef.current.rotation.y,
        targetRotationY.current,
        0.05
      );
    }
  });
  
  // Set up event handlers for mouse/touch interaction
  useEffect(() => {
    const handleMouseDown = () => {
      isDragging.current = true;
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        lastMouseX.current = (e.clientX / size.width) * 2 - 1;
      }
    };
    
    // Set up keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateCarousel(-1);
      } else if (e.key === 'ArrowRight') {
        navigateCarousel(1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, size.width]);
  
  // Handle manual navigation
  const navigateCarousel = (direction: number) => {
    if (isTransitioning) return;
    
    // Update target rotation
    targetRotationY.current += direction * angleStep;
    
    // Update current index
    const newIndex = (currentIndex + direction) % galleryItems.length;
    const adjustedIndex = newIndex < 0 ? galleryItems.length + newIndex : newIndex;
    
    setIsTransitioning(true);
    setCurrentIndex(adjustedIndex);
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  // Handle item selection
  const handleItemSelect = (item: any) => {
    if (onItemSelect) {
      onItemSelect(item); 
    }
  };
  
  // Track image loading state - wrapped in useCallback to prevent re-renders
  const handleImageLoaded = useCallback((itemId: string) => {
    loadingStatesRef.current[itemId] = true;
  }, []);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * galleryItems.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), galleryItems.length - 1);
    
    // Calculate the target rotation
    targetRotationY.current = adjustedIndex * angleStep;
    setCurrentIndex(adjustedIndex);
  };
  
  return (
    <>
      <group>
        {/* Add camera controls component */}
        <CarouselCameraControls />
        
        {/* Carousel items */}
        <group ref={carouselRef}>
          {galleryItems.map((item, index) => {
            // Calculate position on the circle
            const angle = index * angleStep;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius; 
            const y = 0; // Keep all items at the same height (flat circle)
            
            // Determine if this is the current/active item
            const isActive = index === currentIndex;
            
            // Calculate distance from current item (accounting for wrapping)
            const distance = Math.abs(index - currentIndex);
            const distanceWrapped = Math.min(distance, galleryItems.length - distance);
            
            // Adjust scale based on distance from center for better visibility
            // Items further from current have smaller scale but never too small
            const scale = isActive ? 1.2 : Math.max(0.8, 1 - (distanceWrapped * 0.1));
            
            return (
              <CarouselItem 
                key={`${item.id}-carousel`}
                item={item}
                position={[x, y, z]}
                rotation={[0, -angle + Math.PI, 0]} // Rotate to face center
                isActive={isActive}
                isLoaded={!!loadingStatesRef.current[item.id]}
                onImageLoaded={() => handleImageLoaded(item.id)}
                onClick={() => handleItemSelect(item)} 
                onHover={() => setHoveredItem(item.id)}
                onUnhover={() => setHoveredItem(null)}
                isHovered={hoveredItem === item.id}
                initialScale={scale}
              />
            );
          })}
        </group>
      </group>

      {/* Slider control - rendered as HTML overlay */}
      <Html position={[0, -5, 0]}>
        <SliderControl 
          currentIndex={currentIndex}
          totalItems={galleryItems.length}
          onChange={handleSliderChange}
          onPrev={() => navigateCarousel(-1)}
          onNext={() => navigateCarousel(1)}
        />
      </Html>
    </>
  );
}

// Slider control component rendered as HTML
function SliderControl({ 
  currentIndex, 
  totalItems, 
  onChange, 
  onPrev, 
  onNext 
}: { 
  currentIndex: number; 
  totalItems: number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [sliderValue, setSliderValue] = useState(0);
  
  // Update slider value when currentIndex changes
  useEffect(() => {
    const normalizedValue = (currentIndex / (totalItems - 1)) * 100;
    setSliderValue(normalizedValue || 0);
  }, [currentIndex, totalItems]);
  
  // Handle slider input
  const handleSliderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    onChange(e);
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: '800px',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={onPrev}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '0 10px',
        }}
      >
        ←
      </button>
      
      <input
        type="range"
        min="0"
        max="100"
        value={sliderValue}
        onChange={handleSliderInput}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255, 255, 255, 0.2)',
          outline: 'none',
          WebkitAppearance: 'none',
        }}
      />
      
      <button
        onClick={onNext}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '0 10px',
        }}
      >
        →
      </button>
    </div>
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
  onHover: () => void;
  onUnhover: () => void;
  isHovered: boolean;
  initialScale?: number;
}

function CarouselItem({ 
  item, 
  position, 
  rotation, 
  isActive, 
  isLoaded, 
  onImageLoaded, 
  onClick, 
  onHover,
  onUnhover,
  isHovered,
  initialScale = 1.0 
}: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const loadedRef = useRef(false);
  const { camera } = useThree();
  
  // Load texture for image items
  const texture = item.media_type === 'image' 
    ? useTexture(item.file_path)
    : null;
  
  // Call onImageLoaded when texture is available
  useEffect(() => {
    if (texture && item.media_type === 'image' && !loadedRef.current) {
      loadedRef.current = true;
      onImageLoaded();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, item.media_type]);
  
  const materialProps = item.media_type === 'image' 
    ? { map: texture } 
    : { color: '#111111' };
  
  // Animate scale based on active state
  useFrame(() => {
    if (meshRef.current) {
      // Target scale based on active and hover states
      const targetScale = isActive ? (isHovered ? 1.3 : 1.2) : (isHovered ? initialScale * 1.1 : initialScale);
      
      // Smoothly interpolate current scale towards target scale
      meshRef.current.scale.x = MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1);
      meshRef.current.scale.y = MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1);
      meshRef.current.scale.z = MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.1);
      
      // Ensure the item always faces the camera while maintaining its y-rotation
      // This prevents the image from rotating with the camera's vertical movement
      if (isActive || isHovered) {
        // Create a vector pointing from the mesh to the camera
        const direction = new Vector3().subVectors(camera.position, meshRef.current.getWorldPosition(new Vector3()));
        // Project the direction onto the XZ plane to maintain the y-axis rotation
        direction.y = 0;
        direction.normalize();
        
        // Only adjust the item rotation if camera position changes significantly
        if (direction.length() > 0.1) {
          // Look at the camera, but only on the horizontal plane
          meshRef.current.lookAt(
            meshRef.current.position.x + direction.x,
            meshRef.current.position.y,
            meshRef.current.position.z + direction.z
          );
        }
      }
    }
  });
  
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={onClick}
      >
        {/* Image plane with frame */}
        <group>
          {/* Background frame */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[6.4, 4.4, 0.1]} />
            <meshBasicMaterial color={isActive ? "#333333" : "#222222"} />
          </mesh>
          
          {/* Image plane */}
          <mesh>
            <planeGeometry args={[6, 4]} />
            <meshBasicMaterial 
              {...materialProps} 
              transparent 
              opacity={!!texture || item.media_type === 'video' ? 1 : 0.8}
            />
          </mesh>
          
          {/* Video overlay for video items */}
          {item.media_type === 'video' && (
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[6, 4]} />
              <meshBasicMaterial transparent opacity={0.7} color="#000000" />
              <Html center position={[0, 0, 0.02]}>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/80 border border-white/30">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-16 border-l-white border-b-8 border-b-transparent ml-1"></div>
                </div>
              </Html>
            </mesh>
          )}
          
          {/* Item title */}
          <Html center position={[0, -2.5, 0.1]}>
            <div className={`px-3 py-1 rounded text-white text-center transition-all duration-200 ${
              isActive || isHovered ? 'bg-black/80 text-white scale-110' : 'bg-black/50 text-white/80'
            }`} style={{maxWidth: '200px'}}>
              {item.title}
            </div>
          </Html>
        </group>
      </mesh>
    </group>
  );
}