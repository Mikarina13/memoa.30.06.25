import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EnhancedStarsProps {
  count?: number;
  size?: number;
  speed?: number;
  color?: string;
  depth?: number;
}

export function EnhancedStars({ 
  count = 5000,
  size = 1,
  speed = 1,
  color = '#ffffff',
  depth = 100
}: EnhancedStarsProps) {
  const pointsRef = useRef<THREE.Points>();
  
  // Create the star positions and velocities
  const [positions, velocities, sizes, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colorArray = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      // Position index
      const i3 = i * 3;
      
      // Create a more spherical distribution using spherical coordinates
      const radius = depth * (0.3 + Math.random() * 0.7); // Reduced radius range for more compact field
      const theta = Math.random() * Math.PI * 2; // Horizontal angle
      const phi = Math.acos(2 * Math.random() - 1); // Vertical angle

      // Convert spherical to Cartesian coordinates
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Slower velocities
      velocities[i3] = (Math.random() - 0.5) * 0.01 * speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01 * speed;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01 * speed;
      
      // Random star sizes (with a bit of variation)
      sizes[i] = (0.5 + Math.random() * 0.5) * size;
      
      // Slight color variation
      const variation = 0.15;
      const starColor = baseColor.clone().multiplyScalar(1 - variation + Math.random() * variation * 2);
      colorArray[i3] = starColor.r;
      colorArray[i3 + 1] = starColor.g;
      colorArray[i3 + 2] = starColor.b;
    }

    return [positions, velocities, sizes, colorArray];
  }, [count, size, color, depth, speed]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count * 3; i += 3) {
      // Update positions with velocities
      positionArray[i] += velocities[i];
      positionArray[i + 1] += velocities[i + 1];
      positionArray[i + 2] += velocities[i + 2];

      // Keep stars within a spherical boundary
      const distance = Math.sqrt(
        positionArray[i] ** 2 + 
        positionArray[i + 1] ** 2 + 
        positionArray[i + 2] ** 2
      );

      if (distance > depth) {
        // Reset to inner sphere when stars go too far
        const scale = (depth * 0.3) / distance;
        positionArray[i] *= scale;
        positionArray[i + 1] *= scale;
        positionArray[i + 2] *= scale;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={count}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}