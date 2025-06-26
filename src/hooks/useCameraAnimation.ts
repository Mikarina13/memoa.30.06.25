import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { 
  ANIMATION_DURATION_SHORT, 
  ANIMATION_DURATION_LONG, 
  CAMERA_POSITION_INITIAL, 
  CAMERA_POSITION_DEFAULT,
  easeOutCubic 
} from '../utils/constants';

export function useCameraAnimation(introComplete: boolean, cameraPosition?: [number, number, number]) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (!introComplete && !cameraPosition) return;

    const startPosition = new Vector3(...CAMERA_POSITION_INITIAL);
    const endPosition = new Vector3(...(cameraPosition || CAMERA_POSITION_DEFAULT));
    const duration = cameraPosition ? ANIMATION_DURATION_SHORT : ANIMATION_DURATION_LONG;
    const startTime = Date.now();

    camera.position.copy(startPosition);

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = easeOutCubic(progress);
      
      camera.position.lerpVectors(startPosition, endPosition, easeOut);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }, [camera, introComplete, cameraPosition]);
}