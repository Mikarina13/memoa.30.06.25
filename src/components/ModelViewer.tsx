import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export function ModelViewer({ modelPath, setIsLoading }) {
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    setIsLoading(false);
  }, [scene, setIsLoading]);

  return <primitive object={scene} scale={1} />;
}