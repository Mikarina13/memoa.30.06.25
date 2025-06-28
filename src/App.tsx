import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Loader, LogIn, UserPlus, LogOut, Info, Compass, Heart, Sparkles, Menu, User, PlayCircle } from 'lucide-react';
import { ModelViewer } from './components/ModelViewer';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { IntroAnimation } from './components/IntroAnimation';
import { Stars } from './components/Stars';
import { useCameraAnimation } from './hooks/useCameraAnimation';
import { MemoirPage } from './pages/MemoirPage';
import { MemoriaPage } from './pages/MemoriaPage';
import { MementoPage } from './pages/MementoPage';
import { MemoirDashboard } from './pages/MemoirDashboard';
import { MemoriaDashboard } from './pages/MemoriaDashboard';
import { MemoirSettings } from './pages/MemoirSettings';
import { MemoriaSettings } from './pages/MemoriaSettings';
import { ModelDetailPage } from './pages/ModelDetailPage';
import { TermsAcceptancePage } from './pages/TermsAcceptancePage';
import { InfoPage } from './pages/InfoPage';
import { CommunityGuidelinesPage } from './pages/CommunityGuidelinesPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { Profile3DSpacePage } from './pages/Profile3DSpacePage';
import { PersonalityTestPage } from './pages/PersonalityTestPage';
import { ConnectionTest } from './components/ConnectionTest';
import { Vector3 } from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';
import {
  ANIMATION_DURATION_SHORT, 
  ANIMATION_DURATION_VERY_SHORT, 
  MODEL_SCALE_DEFAULT, 
  MODEL_SCALE_HOVER,
  CAMERA_POSITION_INITIAL,
  CAMERA_POSITION_DEFAULT,
  easeOutCubic
} from './utils/constants';

function CameraController({ introComplete }: { introComplete: boolean }) {
  useKeyboardControls();
  useCameraAnimation(introComplete);

  const { camera } = useThree();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return null;
}

export function Model({ position, modelPath, text, description, setIsLoading, onAccess, initialRotation = [0, 0, 0] }) {
  const [isHovering, setIsHovering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rotation, setRotation] = useState(initialRotation);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinStartTime = useRef(0);
  const lastClickTime = useRef(0);
  const { camera } = useThree();
  const modelRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      const modal = document.getElementById(`modal-${text}`);
      if (showModal && modal && !modal.contains(e.target)) {
        setShowModal(false);
        setIsHovering(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal, text]);

  useEffect(() => {
    let animationFrame;
    
    const animate = (timestamp) => {
      if (isSpinning) {
        if (!spinStartTime.current) {
          spinStartTime.current = timestamp;
        }
        
        const elapsed = timestamp - spinStartTime.current;
        const duration = ANIMATION_DURATION_SHORT; // 1 second for full 360 spin
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          setRotation([0, initialRotation[1] + progress * Math.PI * 2, 0]);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setIsSpinning(false);
          spinStartTime.current = 0;
          setShowModal(true);
        }
      } else if (isHovering && !showModal) {
        setRotation(prev => [prev[0], prev[1] + 0.02, prev[2]]);
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (isSpinning || (isHovering && !showModal)) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isHovering, showModal, isSpinning, initialRotation]);

  const handleAccess = () => {
    setShowModal(false);
    
    const startPosition = camera.position.clone();
    const targetPosition = new Vector3(...position).add(new Vector3(0, 0, 1));
    const startTime = Date.now();
    const duration = ANIMATION_DURATION_SHORT;

    const zoomAnimation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeProgress = easeOutCubic(progress);
      
      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(zoomAnimation);
      } else {
        onAccess();
      }
    };

    requestAnimationFrame(zoomAnimation);
  };

  const handleClick = (e) => {
    // Stop event propagation to prevent OrbitControls from capturing it
    e.stopPropagation();
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime.current;
    
    if (timeDiff < ANIMATION_DURATION_VERY_SHORT) { // Double click detected
      if (isSpinning) {
        setIsSpinning(false);
        spinStartTime.current = 0;
      }
      handleAccess();
    } else if (!showModal && !isSpinning) {
      // Single click - start spinning
      setIsSpinning(true);
    }
    
    lastClickTime.current = currentTime;
  };

  return (
    <group
      ref={modelRef}
      position={position}
      scale={isHovering || showModal ? MODEL_SCALE_HOVER : MODEL_SCALE_DEFAULT}
      rotation={rotation}
      onPointerEnter={() => !showModal && setIsHovering(true)}
      onPointerLeave={() => !showModal && setIsHovering(false)}
      onClick={handleClick}
    >
      <ModelViewer modelPath={modelPath} setIsLoading={setIsLoading} />
      {isHovering && !showModal && (
        <Html center position={[0, -2, 0]}>
          <div className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded-lg text-center">
            {text}
          </div>
        </Html>
      )}
      {showModal && (
        <Html center position={[0, 2, 0]}>
          <div 
            id={`modal-${text}`}
            className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-6 min-w-[300px]"
          >
            <h3 className="text-white text-2xl font-bold mb-2 pb-2 border-b border-white/20 text-center">
              {text}
            </h3>
            <p className="font-[Rajdhani] text-lg tracking-wide text-center mb-4 bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
              {description}
            </p>
            <button 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors w-full"
              onClick={handleAccess}
            >
              Access
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function MainScene() {
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(CAMERA_POSITION_INITIAL);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menuTrigger = document.querySelector('[data-menu-trigger]');
      const menu = document.querySelector('[data-menu]');
      
      if (showMenu && menu && !menu.contains(e.target as Node) && !menuTrigger?.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroComplete(true);
    setCameraPosition(CAMERA_POSITION_DEFAULT);
  };

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
        <span className="ml-2 text-white">Loading...</span>
      </div>
    );
  }

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      <ConnectionTest />
      <div className="w-full h-screen bg-[#111111]">
        <div className="fixed top-0 left-0 z-10">
          <div
            className={`flex items-center gap-1 cursor-pointer transition-opacity p-0 m-0 -mt-2 ${
              showMenu ? 'opacity-100' : 'opacity-50 hover:opacity-100'
            }`}
            data-menu-trigger
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu className={`w-5 h-5 transition-colors ${
              showMenu ? 'text-white' : 'text-white/70 hover:text-white'
            }`} />
            <img 
              src="/20250601_1008_Neon Logo Design_remix_01jwn8g35desmb88t2c88mh7t0.png"
              alt="MEMOA"
              className="w-20 transition-opacity"
            />
          </div>
        </div>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              data-menu
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-16 left-4 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-4 z-20"
            >
              <div className="flex flex-col gap-3">
                <a 
                  href="https://www.youtube.com/watch?v=tT0fwMpRTcI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <PlayCircle className="w-5 h-5" />
                  <span className="text-amber-400/90 font-[Rajdhani]">Intro</span>
                </a>
                <button 
                  onClick={() => {
                    navigate('/memoir');
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Compass className="w-5 h-5" />
                  <span className="text-blue-400/90 font-[Rajdhani]">MEMOIR</span>
                </button>
                <button 
                  onClick={() => {
                    navigate('/memoria');
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="text-purple-400/90 font-[Rajdhani]">MEMORIA</span>
                </button>
                <button 
                  onClick={() => {
                    navigate('/memento');
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-cyan-400/90 font-[Rajdhani]">MEMENTO</span>
                </button>
                <div className="border-t border-white/10 my-2"></div>
                <button 
                  onClick={() => {
                    navigate('/info');
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Info className="w-5 h-5" />
                  <span className="text-emerald-400/90 font-[Rajdhani]">Info</span>
                </button>
                {!user ? (
                  <>
                    <button 
                      onClick={() => {
                        navigate('/memento');
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="text-amber-400/90 font-[Rajdhani]">Sign in</span>
                    </button>
                    <button 
                      onClick={() => {
                        navigate('/memento');
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="text-rose-400/90 font-[Rajdhani]">Sign up</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-indigo-400/90 font-[Rajdhani]">Profile</span>
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-red-400/90 font-[Rajdhani]">Logout</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative w-full h-full">
          <Canvas
            camera={{ position: cameraPosition, fov: 60 }}
            className="bg-black/90"
          >
            <Suspense fallback={null}>
              <CameraController introComplete={introComplete} />
              <Stars />
              <Model 
                position={[-6, -1, 0]}
                modelPath="/models/MEMOIR.3d.glb"
                text="MEMOIR"
                description="Craft your digital legacy"
                setIsLoading={setIsLoading}
                onAccess={() => navigate('/memoir')}
              />
              <Model 
                position={[0, -1, 0]}
                modelPath="/models/MEMENTO.3d.glb"
                text="MEMENTO"
                description="Walk among echoes"
                setIsLoading={setIsLoading}
                onAccess={() => navigate('/memento')}
              />
              <Model 
                position={[6, -1, 0]}
                modelPath="/models/Fluid Harmony 0602193530 texture.glb"
                text="MEMORIA"
                description="Explore digital memories"
                setIsLoading={setIsLoading}
                onAccess={() => navigate('/memoria')}
                initialRotation={[0, Math.PI, 0]}
              />
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                target={[0, -1.1, 0]}
                makeDefault
              />
              <Environment preset="city" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
            </Suspense>
          </Canvas>
          
          <div className="fixed bottom-2 left-0 right-0 mx-auto w-fit bg-black/50 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/10 z-50">
            <div className="flex items-center space-x-4 text-white/80 text-sm font-[Rajdhani]">
              <span className="px-2 py-1 bg-white/5 rounded">
                Left click + drag <span className="text-blue-400">to rotate</span>
              </span>
              <span className="px-2 py-1 bg-white/5 rounded">
                Right click + drag <span className="text-purple-400">to pan</span>
              </span>
              <span className="px-2 py-1 bg-white/5 rounded">
                Scroll <span className="text-amber-400">to zoom</span>
              </span>
              <span className="px-2 py-1 bg-white/5 rounded">
                WASD/Arrow Keys <span className="text-emerald-400">to move</span>
              </span>
              <span className="px-2 py-1 bg-white/5 rounded">
                Space <span className="text-rose-400">to reset</span>
              </span>
            </div>
          </div>
          
          {isLoading && !showIntro && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-50">
              <Loader className="w-8 h-8 text-white animate-spin" />
              <div className="text-white">Loading 3D Models...</div>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScene />} />
        <Route path="/memoir" element={<MemoirPage />} />
        <Route path="/memoir/dashboard" element={<MemoirDashboard />} />
        <Route path="/memoir/settings" element={<MemoirSettings />} />
        <Route path="/memoria" element={<MemoriaPage />} />
        <Route path="/memoria/dashboard" element={<MemoriaDashboard />} />
        <Route path="/memoria/settings" element={<MemoriaSettings />} />
        <Route path="/memento" element={<MementoPage />} />
        <Route path="/memento/detail" element={<ModelDetailPage />} />
        <Route path="/memento/profile-space" element={<Profile3DSpacePage />} />
        <Route path="/personality-test" element={<PersonalityTestPage />} />
        <Route path="/terms-acceptance" element={<TermsAcceptancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      </Routes>
    </Router>
  );
}

export default App;