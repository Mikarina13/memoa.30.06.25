import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { Group, MathUtils } from 'three';

interface Gallery3DCarouselProps {
  galleryItems: any[];
  onClose: () => void;
  onItemSelect?: (item: any) => void;
}

// Component that manages camera and controls specifically for the carousel
export function CarouselCameraControls() {
  const { camera } = useThree();
  
  // Set initial camera position in the center looking outward
  useEffect(() => {
    // Position camera at the center of the carousel (origin)
    camera.position.set(0, 0, 0);
    camera.lookAt(1, 0, 0); // Look along positive X axis to start
    
    // Store original camera position for cleanup
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    
    return () => {
      // Reset camera position when component unmounts
      camera.position.copy(originalPosition);
      camera.rotation.copy(originalRotation);
    };
  }, [camera]);
  
  // Restrict camera movement - keep it at center and only allow rotation around Y axis
  useFrame(() => {
    // Lock position to center
    camera.position.set(0, 0, 0);
    
    // Lock up/down rotation to keep on horizontal plane
    // This keeps the user from looking up/down, only left/right
    camera.rotation.x = 0;
    camera.rotation.z = 0;
  });
  
  return null;
}

export function Gallery3DCarousel({ galleryItems, onClose, onItemSelect }: Gallery3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotationY = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadingStatesRef = useRef<Record<string, boolean>>({});
  
  // Calculate the angle between each item
  const angleStep = (Math.PI * 2) / Math.max(galleryItems.length, 1);
  
  // Radius of the carousel
  const radius = 15;
  
  // Slower rotation speed
  const rotationSpeed = 0.05;
  
  // Camera rotation
  useFrame(({ camera }) => {
    // Smoothly rotate the camera around Y axis
    camera.rotation.y = MathUtils.lerp(
      camera.rotation.y,
      targetRotationY.current,
      rotationSpeed
    );
  });
  
  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        navigateCarousel(1); // Reversed direction for natural feeling
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        navigateCarousel(-1); // Reversed direction for natural feeling
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Handle manual navigation
  const navigateCarousel = (direction: number) => {
    if (isTransitioning) return;
    
    // Update target rotation - direction is reversed for natural feeling
    targetRotationY.current += direction * angleStep;
    
    // Update current index
    const newIndex = (currentIndex - direction) % galleryItems.length;
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
  
  // Track image loading state
  const handleImageLoaded = useCallback((itemId: string) => {
    loadingStatesRef.current[itemId] = true;
  }, []);

  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const normalizedValue = value / 100;
    const targetIndex = Math.floor(normalizedValue * galleryItems.length);
    const adjustedIndex = Math.min(Math.max(0, targetIndex), galleryItems.length - 1);
    
    // Calculate the target rotation to show this index
    targetRotationY.current = adjustedIndex * angleStep;
    setCurrentIndex(adjustedIndex);
  };
  
  return (
    <>
      {/* Camera controls - crucial for first-person view from center */}
      <CarouselCameraControls />
      
      {/* Fixed carousel of images - does not rotate */}
      <group ref={carouselRef}>
        {galleryItems.map((item, index) => {
          // Calculate position on the circle
          const angle = index * angleStep;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius; 
          const y = 0; // Keep all items at same height (flat circle)
          
          // Determine if this is the active item
          const isActive = index === currentIndex;
          
          // Calculate distance from current item (accounting for wrapping)
          const distance = Math.abs(index - currentIndex);
          const distanceWrapped = Math.min(distance, galleryItems.length - distance);
          
          // Adjust scale based on distance from current view
          const scale = isActive ? 1.2 : Math.max(0.8, 1 - (distanceWrapped * 0.1));
          
          return (
            <CarouselItem 
              key={`${item.id}-carousel`}
              item={item}
              position={[x, y, z]}
              rotation={[0, Math.PI + angle, 0]} // Face toward center (inward)
              isActive={isActive}
              isLoaded={!!loadingStatesRef.current[item.id]}
              onImageLoaded={() => handleImageLoaded(item.id)}
              onClick={() => handleItemSelect(item)} 
              initialScale={scale}
            />
          );
        })}
      </group>

      {/* Controls overlay */}
      <Html position={[0, -5, 10]} center>
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '800px',
            padding: '15px 20px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            zIndex: 1000,
            fontFamily: 'Orbitron, sans-serif',
          }}
        >
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
              Use ← → or A D keys to navigate • {currentIndex + 1} of {galleryItems.length}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px',
                opacity: 0.7,
              }}
            >
              Close ✕
            </button>
          </div>
          
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <button
              onClick={() => navigateCarousel(1)} // Reversed for natural feel
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px 15px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
              }}
            >
              ←
            </button>
            
            <input
              type="range"
              min="0"
              max="100"
              value={(currentIndex / Math.max(galleryItems.length - 1, 1)) * 100}
              onChange={handleSliderChange}
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
              onClick={() => navigateCarousel(-1)} // Reversed for natural feel
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '5px 15px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
              }}
            >
              →
            </button>
          </div>
        </div>
      </Html>
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
  initialScale = 1.0 
}: CarouselItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const loadedRef = useRef(false);
  
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
  
  // Simple fixed scaling based on active state
  useEffect(() => {
    if (meshRef.current) {
      const scale = isActive ? 1.2 : initialScale;
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [isActive, initialScale]);
  
  // Video overlay for video items
  const videoOverlay = item.media_type === 'video' ? (
    <Html center position={[0, 0, 0.02]}>
      <div style={{
        width: '60px', 
        height: '60px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '50%',
      }}>
        <div style={{
          width: '0', 
          height: '0',
          borderTop: '15px solid transparent',
          borderLeft: '25px solid white',
          borderBottom: '15px solid transparent',
          marginLeft: '5px',
        }}></div>
      </div>
    </Html>
  ) : null;
  
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
          opacity={!!texture || item.media_type === 'video' ? 1 : 0.8} 
        />
        
        {/* Video overlay for video items */}
        {item.media_type === 'video' && videoOverlay}
      </mesh>
    </group>
  );
}