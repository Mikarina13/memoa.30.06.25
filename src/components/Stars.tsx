import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Stars({ count = 5000 }) {
  const positions = useRef<Float32Array>();
  const velocities = useRef<Float32Array>();
  const pointsRef = useRef<THREE.Points>();

  if (!positions.current) {
    positions.current = new Float32Array(count * 3);
    velocities.current = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      // Create a more spherical distribution using spherical coordinates
      const radius = 30 + Math.random() * 70; // Reduced radius range for more compact field
      const theta = Math.random() * Math.PI * 2; // Horizontal angle
      const phi = Math.acos(2 * Math.random() - 1); // Vertical angle

      // Convert spherical to Cartesian coordinates
      positions.current[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions.current[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions.current[i + 2] = radius * Math.cos(phi);

      // Slower velocities
      velocities.current[i] = (Math.random() - 0.5) * 0.01;
      velocities.current[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities.current[i + 2] = (Math.random() - 0.5) * 0.01;
    }
  }

  useFrame(() => {
    if (!pointsRef.current || !positions.current || !velocities.current) return;

    const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < positionArray.length; i += 3) {
      // Update positions with slower velocities
      positionArray[i] += velocities.current[i];
      positionArray[i + 1] += velocities.current[i + 1];
      positionArray[i + 2] += velocities.current[i + 2];

      // Keep stars within a spherical boundary
      const distance = Math.sqrt(
        positionArray[i] ** 2 + 
        positionArray[i + 1] ** 2 + 
        positionArray[i + 2] ** 2
      );

      if (distance > 100) {
        // Reset to inner sphere when stars go too far
        const scale = 30 / distance;
        positionArray[i] *= scale;
        positionArray[i + 1] *= scale;
        positionArray[i + 2] *= scale;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}