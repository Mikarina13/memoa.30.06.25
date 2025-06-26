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
    // Store original camera position for cleanup
    const originalPosition = camera.position.clone();
    
    // Position camera slightly above the carousel plane for better viewing angle
    camera.position.set(0, 3, 0.1);
    camera.lookAt(0, 0, 0);
    
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
  const radius = 12; // Slightly increased radius for better spacing
  
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
    const handleMouseDown = (e: MouseEvent) => {
      // Only start dragging if left mouse button is pressed
      if (e.button === 0) {
        isDragging.current = true;
        lastMouseX.current = (e.clientX / size.width) * 2 - 1;
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        lastMouseX.current = (e.clientX / size.width) * 2 - 1;
      }
    };
    
    // Touch event handlers for mobile support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        lastMouseX.current = (e.touches[0].clientX / size.width) * 2 - 1;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches.length === 1) {
        const currentX = (e.touches[0].clientX / size.width) * 2 - 1;
        const deltaX = (currentX - lastMouseX.current) * 5;
        targetRotationY.current += deltaX;
        lastMouseX.current = currentX;
        
        // Update current index based on rotation
        const normalizedRotation = ((targetRotationY.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const newIndex = Math.round(normalizedRotation / angleStep) % galleryItems.length;
        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);
        }
        
        // Prevent default to avoid scrolling the page
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = () => {
      isDragging.current = false;
    };
    
    // Set up keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateCarousel(-1);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        navigateCarousel(1);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };
    
    // Add all event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, size.width, currentIndex, angleStep]);
  
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
  
  // Add close button for better UX
  const handleCloseCarousel = () => {
    onClose();
  };
  
  return (
    <>
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

      {/* Close button */}
      <Html position={[0, 6, 0]}>
        <button 
          onClick={handleCloseCarousel}
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            backdropFilter: 'blur(5px)',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        >
          <span style={{ fontSize: '16px' }}>×</span>
          Close Gallery
        </button>
      </Html>

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
    if (totalItems <= 1) return; // Avoid division by zero
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
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
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
          transition: 'opacity 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.8' }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
      >
        ←
      </button>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={handleSliderInput}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.2)',
            outline: 'none',
            WebkitAppearance: 'none',
            cursor: 'pointer',
          }}
        />
        <div 
          style={{ 
            position: 'absolute', 
            top: '12px', 
            width: '100%', 
            textAlign: 'center',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}
        >
          {currentIndex + 1} / {totalItems}
        </div>
      </div>
      
      <button
        onClick={onNext}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '0 10px',
          transition: 'opacity 0.2s',
        }}
        onMouseOver={e => { e.currentTarget.style.opacity = '0.8' }}
        onMouseOut={e => { e.currentTarget.style.opacity = '1' }}
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
    }
  });
  
  // Define a proper shadow color based on active state
  const shadowColor = isActive ? "#4466ff" : "#222222";
  const frameColor = isActive ? "#444444" : "#222222";
  const frameBorderColor = isActive ? "#5588ff" : "#333333";
  
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
          {/* Shadow/Glow effect */}
          <mesh position={[0, 0, -0.1]} receiveShadow>
            <planeGeometry args={[6.8, 4.8]} />
            <meshBasicMaterial color={shadowColor} transparent opacity={0.3} />
          </mesh>
          
          {/* Background frame */}
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[6.4, 4.4, 0.1]} />
            <meshBasicMaterial color={frameColor} />
          </mesh>
          
          {/* Frame border */}
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[6.5, 4.5, 0.01]} />
            <meshBasicMaterial color={frameBorderColor} />
          </mesh>
          
          {/* Image plane */}
          <mesh position={[0, 0, 0]}>
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
              <meshBasicMaterial transparent opacity={0.5} color="#000000" />
              <Html center position={[0, 0, 0.02]}>
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-black/80 border border-white/40 shadow-lg"
                  style={{ 
                    transition: 'transform 0.2s ease-out',
                    transform: isHovered || isActive ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <div 
                    className="w-0 h-0 ml-2" 
                    style={{
                      borderTop: '10px solid transparent',
                      borderLeft: '20px solid white',
                      borderBottom: '10px solid transparent'
                    }}
                  ></div>
                </div>
              </Html>
            </mesh>
          )}
          
          {/* Item title */}
          <Html center position={[0, -2.5, 0.1]}>
            <div 
              className="px-4 py-2 rounded-lg text-white text-center transition-all duration-300"
              style={{
                maxWidth: '250px',
                backgroundColor: isActive || isHovered ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
                transform: isActive || isHovered ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActive || isHovered ? '0 0 15px rgba(100,150,255,0.3)' : 'none',
                border: isActive || isHovered ? '1px solid rgba(100,150,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(3px)',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: isActive ? '16px' : '14px',
                fontWeight: isActive ? 'bold' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </div>
          </Html>
        </group>
      </mesh>
    </group>
  );
}