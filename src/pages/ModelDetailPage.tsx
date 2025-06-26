import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { ModelViewer } from '../components/ModelViewer';
import { Stars } from '../components/Stars';
import { Footer } from '../components/Footer';
import { 
  ANIMATION_DURATION_LONG,
  ANIMATION_DURATION_VERY_LONG,
  CAMERA_FOV_WIDE 
} from '../utils/constants';

export function ModelDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const { modelPath, modelText } = location.state || {};

  useEffect(() => {
    if (!modelPath || !modelText) {
      navigate('/memento');
    }

    // Hide welcome message after 3 seconds
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, ANIMATION_DURATION_LONG);

    return () => clearTimeout(timer);
  }, [modelPath, modelText, navigate]);

  if (!modelPath || !modelText) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-black relative"
    >
      <Header />
      
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: ANIMATION_DURATION_VERY_LONG / 1000, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent font-[Orbitron]">
                Welcome to {modelText}
              </h1>
              <p className="text-white/60 font-[Rajdhani]">
                Entering submersive space...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => navigate('/memento')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors font-[Orbitron]"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>

      <Canvas camera={{ position: [0, 0, 8], fov: CAMERA_FOV_WIDE }}>
        <motion.group
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ModelViewer 
            modelPath={modelPath}
            setIsLoading={setIsLoading}
          />
        </motion.group>
        <Stars count={7000} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={1}
        />
        <Environment preset="night" />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
      </Canvas>

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-white text-xl">Loading {modelText}...</div>
        </div>
      )}
      
      <Footer />
    </motion.div>
  );
}