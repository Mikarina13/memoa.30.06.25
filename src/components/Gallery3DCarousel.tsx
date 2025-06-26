import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import { Group, MathUtils } from 'three';

interface Gallery3DCarouselProps {
  galleryItems: any[];
  onClose: () => void;
  onItemSelect?: (item: any) => void;
}

export function Gallery3DCarousel({ galleryItems, onClose, onItemSelect }: Gallery3DCarouselProps) {
  const carouselRef = useRef<Group>(null);
  const targetRotationY = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const loadingStatesRef = useRef<Record<string, boolean>>({});
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { camera } = useThree();
  
  // Calculate the angle between each item
  const angleStep = (Math.PI * 2) / Math.max(galleryItems.length, 1);
  
  // Radius of the carousel - smaller radius to make images more visible
  const radius = 10;
  
  // Animate carousel rotation
  useFrame(() => {
    if (carouselRef.current) {
      // Smoothly interpolate current rotation towards target rotation
      carouselRef.current.rotation.y = MathUtils.lerp(
        carouselRef.current.rotation.y,
        targetRotationY.current,
        0.05
      );
    }
  });
  
  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateCarousel(-1);
      } else if (e.key === 'ArrowRight') {
        navigateCarousel(1);
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

  // Create a slider control at the bottom of the screen
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
        {/* Carousel items */}
        <group ref={carouselRef}>
          {galleryItems.map((item, index) => {
            // Calculate position on the circle
            const angle = index * angleStep;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius; 
            const y = 0; // Keep all items at the same height
            
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
                key={`${item.id}-original`}
                item={item}
                position={[x, y, z]}
                rotation={[0, -angle + Math.PI, 0]} // Rotate to face outward
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
      <Html>
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
    }
  });
  
  return (
    <group position={position} rotation={rotation}>
      {/* Image plane */}
      <mesh
        ref={meshRef}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={onClick}
      >
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial 
          {...materialProps} 
          transparent 
          opacity={!!texture || item.media_type === 'video' ? 1 : 0.8} 
        />
      </mesh>
    </group>
  );
}