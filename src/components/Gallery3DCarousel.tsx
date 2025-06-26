import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { Group, MathUtils, Vector3 } from 'three';

interface Gallery3DCarouselProps {
  galleryItems: any[];
  onClose: () => void;
  onItemSelect?: (item: any) => void;
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

export function Gallery3DCarousel({ galleryItems, onClose, onItemSelect }: Gallery3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotation = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const navigateCarousel = (direction: number) => {
    if (isTransitioning) return;
    
    // Update target rotation
    targetRotation.current += direction * angleStep;
    
    // Update current index
    const newIndex = (currentIndex - direction + galleryItems.length) % galleryItems.length;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
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
    
    // Calculate the angle to this index
    const angle = -adjustedIndex * angleStep;
    targetRotation.current = angle;
    setCurrentIndex(adjustedIndex);
  };
  
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
          );
        })}
      </group>

      {/* Fixed navigation UI */}
      <Html position={[0, -6, 0]} center>
        <div style={{
          width: '700px',
          padding: '15px 25px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          fontFamily: 'sans-serif'
        }}>
          <button
            onClick={() => navigateCarousel(1)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '5px',
              width: '50px',
              height: '40px',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          
          <div style={{ flex: 1 }}>
            <input 
              type="range"
              min="0"
              max="100"
              value={(currentIndex / (galleryItems.length - 1 || 1)) * 100}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '5px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '5px',
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '14px',
              marginTop: '8px'
            }}>
              Use Arrow Keys or A/D to Navigate • {currentIndex + 1} of {galleryItems.length}
            </div>
          </div>
          
          <button
            onClick={() => navigateCarousel(-1)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '5px',
              width: '50px',
              height: '40px',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            →
          </button>
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
  
  // Set material based on media type
  const materialProps = item.media_type === 'image' 
    ? { map: texture } 
    : { color: '#111111' };
  
  // Apply scale directly
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);
  
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
          transparent={true}
          opacity={1}
        />
        
        {/* Video indicator for video items */}
        {item.media_type === 'video' && (
          <Html center position={[0, 0, 0.1]}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '0',
                height: '0',
                borderTop: '15px solid transparent',
                borderBottom: '15px solid transparent',
                borderLeft: '25px solid white',
                marginLeft: '5px'
              }}></div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}