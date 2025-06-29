import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3, Matrix4 } from 'three';

export function useKeyboardControls(speed = 0.2, enabled = true) {
  const { camera } = useThree();
  const moveDirection = useRef(new Vector3());
  const tempVector = useRef(new Vector3());
  const tempMatrix = useRef(new Matrix4());
  const keysPressed = useRef(new Set<string>());

  useEffect(() => {
    // If not enabled, don't set up event listeners
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't add to keysPressed if the key is already down
      // This prevents the "stuck key" issue when switching context
      if (!keysPressed.current.has(e.key.toLowerCase())) {
        keysPressed.current.add(e.key.toLowerCase());
      }
      
      // Only prevent default for movement keys to allow other keyboard shortcuts to work
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    // Handle blur event to reset keys when window loses focus
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    const updateCamera = () => {
      // If not enabled, don't process movement
      if (!enabled) {
        requestAnimationFrame(updateCamera);
        return;
      }

      moveDirection.current.set(0, 0, 0);
      
      // Get movement input
      if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) moveDirection.current.x = -1;
      if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) moveDirection.current.x = 1;
      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) moveDirection.current.z = -1;
      if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) moveDirection.current.z = 1;
      
      // Add vertical movement
      if (keysPressed.current.has('q')) moveDirection.current.y = 1;  // Move up
      if (keysPressed.current.has('e')) moveDirection.current.y = -1; // Move down

      if (moveDirection.current.length() > 0) {
        moveDirection.current.normalize();
        moveDirection.current.multiplyScalar(speed);

        // Get the camera's rotation matrix (but ignore vertical rotation)
        tempMatrix.current.makeRotationY(camera.rotation.y);
        
        // Transform the movement direction by the camera's rotation
        tempVector.current.copy(moveDirection.current)
          .applyMatrix4(tempMatrix.current);

        // Apply the transformed movement
        camera.position.add(tempVector.current);
      }

      requestAnimationFrame(updateCamera);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    const animationFrame = requestAnimationFrame(updateCamera);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      cancelAnimationFrame(animationFrame);
    };
  }, [camera, speed, enabled]);
}