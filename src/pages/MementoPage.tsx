import { useEffect, useState, FormEvent, Suspense } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader, LogIn, UserPlus, LogOut, Info, Compass, Heart, Sparkles, Menu, User, Globe, AlertCircle, RefreshCw, Star, Space } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthForm } from '../components/AuthForm';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { MemoirIntegrations, MemoriaProfile } from '../lib/memoir-integrations';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';
import { Stars } from '../components/Stars';
import { Model } from '../App';
import { Vector3 } from 'three';
import { 
  ANIMATION_DURATION_VERY_LONG, 
  CAMERA_POSITION_MEMENTO,
  CAMERA_FOV_DEFAULT,
  easeOutQuart 
} from '../utils/constants';

function MementoCameraController() {
  useKeyboardControls();
  const { camera } = useThree();
  
  useEffect(() => {
    const startPosition = new Vector3(0, 0, 25);
    const endPosition = new Vector3(...CAMERA_POSITION_MEMENTO);
    const startTime = Date.now();
    const duration = ANIMATION_DURATION_VERY_LONG;

    camera.position.copy(startPosition);

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quart for smoother animation
      const easeProgress = easeOutQuart(progress);
      
      camera.position.lerpVectors(startPosition, endPosition, easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
      
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
          e.preventDefault();
          window.location.reload();
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
  }, [camera]);

  return null;
}

export function MementoPage() {
  const navigate = useNavigate();
  const { user, loading, initialized, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [memoriaProfiles, setMemoriaProfiles] = useState<MemoriaProfile[]>([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState<{memoir: any[], memoria: MemoriaProfile[]}>({
    memoir: [],
    memoria: []
  });
  const [publicProfiles, setPublicProfiles] = useState<{memoir: any[], memoria: MemoriaProfile[]}>({
    memoir: [],
    memoria: []
  });
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  
  // Check if user has accepted terms
  const checkTermsAcceptance = (userData: any) => {
    if (!userData) return false;
    const userMetadata = userData.user_metadata || {};
    return !!userMetadata.terms_accepted;
  };
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSpaceOptions, setShowSpaceOptions] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  
  useEffect(() => {
    document.title = 'MEMENTO';
    
    if (user) {
      loadMemoriaProfiles();
      loadFavoriteProfiles();
    }
  }, [user]);

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      // No need to redirect, we're already on the memento page
    } else if (!loading && user && !checkTermsAcceptance(user)) {
      // Redirect to terms acceptance page if user hasn't accepted terms
      navigate('/terms-acceptance?redirectTo=/memento');
    }
  }, [user, loading, location.pathname]);

  const loadMemoriaProfiles = async () => {
    try {
      const profiles = await MemoirIntegrations.getMemoriaProfiles(user.id);
      setMemoriaProfiles(profiles);
      console.log(`Loaded ${profiles.length} Memoria profiles`);
    } catch (error) {
      console.error('Error loading Memoria profiles:', error);
    }
  };
  
  const loadFavoriteProfiles = async () => {
    try {
      const favorites = await MemoirIntegrations.getFavoriteProfiles(user.id);
      setFavoriteProfiles(favorites);
      console.log(`Loaded ${favorites.memoir.length} favorite Memoir profiles and ${favorites.memoria.length} favorite Memoria profiles`);
    } catch (error) {
      console.error('Error loading favorite profiles:', error);
    }
  };

  const loadPublicProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      setLoadError(null);
      
      // Load public Memoir profiles
      const memoirProfiles = await MemoirIntegrations.getPublicMemoirProfiles();
      
      // Load public Memoria profiles
      const memoriaProfiles = await MemoirIntegrations.getPublicMemoriaProfiles();
      
      setPublicProfiles({
        memoir: memoirProfiles,
        memoria: memoriaProfiles
      });
      
      console.log(`Loaded ${memoirProfiles.length} public Memoir profiles and ${memoriaProfiles.length} public Memoria profiles`);
    } catch (error) {
      console.error('Error loading public profiles:', error);
      setLoadError('Failed to load public profiles. Please try again.');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setFormLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const handleBuildingSpaceClick = () => {
    setShowSpaceOptions(true);
  };
  
  const handleExplorerClick = () => {
    loadPublicProfiles();
    setShowExplorer(true);
  };

  const handleFavoritesClick = () => {
    // Make sure we have the latest favorites data
    loadFavoriteProfiles().then(() => {
      setShowFavorites(true);
    });
  };

  const handleSelectSpaceType = (type: 'memoir' | 'memoria') => {
    if (type === 'memoir') {
      // Navigate to MEMOIR personal space
      navigate('/memento/profile-space', { state: { profileType: 'memoir' } });
      console.log('Navigating to MEMOIR 3D space');
    } else {
      // For Memoria, we need to show a profile selector if there are multiple profiles
      if (memoriaProfiles.length === 0) {
        alert('You have not created any Memoria profiles yet. Please create a profile in the Memoria dashboard first.');
      } else if (memoriaProfiles.length === 1) {
        // If there's only one profile, use it automatically
        navigate('/memento/profile-space', { 
          state: { 
            profileType: 'memoria',
            memoriaProfileId: memoriaProfiles[0].id
          } 
        });
        console.log(`Navigating to MEMORIA 3D space for profile: ${memoriaProfiles[0].name}`);
      } else {
        // Show profile selector modal
        navigate('/memento/profile-space', { 
          state: { 
            profileType: 'memoria',
            memoriaProfileId: memoriaProfiles[0].id,
            showProfileSelector: true
          } 
        });
      }
    }
    setShowSpaceOptions(false);
  };
  
  const handleViewProfile = (profileId: string, profileType: 'memoir' | 'memoria') => {
    navigate('/memento/profile-space', {
      state: {
        profileType: profileType,
        memoriaProfileId: profileType === 'memoria' ? profileId : undefined,
        // If it's a memoir profile, we need the user_id instead
        userId: profileType === 'memoir' ? profileId : undefined
      }
    });
    setShowExplorer(false);
    setShowFavorites(false);
  };
  
  const handleAddFavorite = async (profileId: string, profileType: 'memoir' | 'memoria') => {
    try {
      if (!user) {
        alert('Please sign in to add favorites');
        return;
      }
      
      // Check if already favorited to prevent duplicate insertion
      if (isProfileFavorited(profileId, profileType)) {
        console.log('Profile is already in favorites');
        return;
      }
      
      await MemoirIntegrations.addProfileToFavorites(user.id, profileId, profileType);
      
      // Refresh favorites
      await loadFavoriteProfiles();
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('Failed to add favorite. Please try again.');
    }
  };
  
  const handleRemoveFavorite = async (profileId: string, profileType: 'memoir' | 'memoria') => {
    try {
      if (!user) return;
      
      await MemoirIntegrations.removeProfileFromFavorites(user.id, profileId, profileType);
      
      // Refresh favorites
      await loadFavoriteProfiles();
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite. Please try again.');
    }
  };

  // Check if a profile is in favorites
  const isProfileFavorited = (profileId: string, profileType: 'memoir' | 'memoria'): boolean => {
    if (profileType === 'memoir') {
      return favoriteProfiles.memoir.some(profile => profile.id === profileId);
    } else {
      return favoriteProfiles.memoria.some(profile => profile.id === profileId);
    }
  };

  // Show loading while checking authentication
  if (loading || !initialized) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
        <span className="ml-2 text-white">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-screen bg-black relative"
      >
        <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors font-[Orbitron]"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors font-[Orbitron]"
          >
            <LogOut className="w-6 h-6" />
            Logout
          </button>
        </div>

        <Canvas camera={{ position: CAMERA_POSITION_MEMENTO, fov: CAMERA_FOV_DEFAULT }}>
          <MementoCameraController />
          <motion.group
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <Model 
              position={[-4, -1, 0]}
              modelPath="/models/Celestial Starburst 0604191449 texture.glb"
              text="Explore"
              description="Discover other Profiles"
              setIsLoading={setIsLoading}
              onAccess={handleExplorerClick}
              initialRotation={[0, Math.PI / 2, 0]}
            />
            <Model 
              position={[0, -1, 0]}
              modelPath="/models/Stellar Heart Glow 0604140148 texture (1).glb"
              text="Favorite"
              description="Saved for easy access"
              setIsLoading={setIsLoading}
              onAccess={handleFavoritesClick}
              initialRotation={[0, 0, 0]}
            />
            <Model 
              position={[4, -1, 0]}
              modelPath="/models/Woven Reflections 0609195756 texture.glb"
              text="Building Space"
              description="Create your own 3D space"
              setIsLoading={setIsLoading}
              onAccess={handleBuildingSpaceClick}
              initialRotation={[0, 0, 0]}
            />
          </motion.group>
          <Stars />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={25}
          />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </Canvas>
        
        {/* Building Space Options Modal */}
        <AnimatePresence>
          {showSpaceOptions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-md w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-white mb-6 text-center font-[Orbitron]">
                  Choose Space Type
                </h3>
                
                <div className="space-y-6">
                  <button
                    onClick={() => handleSelectSpaceType('memoir')}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 rounded-lg transition-colors flex flex-col items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    <Compass className="w-10 h-10" />
                    <div className="space-y-1 text-center">
                      <span className="text-xl font-medium">MEMOIR 3D Space</span>
                      <p className="text-white/70 text-sm px-4">Your personal digital legacy space</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleSelectSpaceType('memoria')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 rounded-lg transition-colors flex flex-col items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  >
                    <Heart className="w-10 h-10" />
                    <div className="space-y-1 text-center">
                      <span className="text-xl font-medium">MEMORIA 3D Space</span>
                      <p className="text-white/70 text-sm px-4">
                        {memoriaProfiles.length > 0 
                          ? `Memorial space for ${memoriaProfiles[0]?.name || 'your loved one'}`
                          : 'Create a Memoria profile first'
                        }
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowSpaceOptions(false)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-colors mt-4 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-20"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Favorites Modal */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Heart className="w-8 h-8 text-pink-400" />
                    <h3 className="text-2xl font-bold text-white font-[Orbitron]">Favorites</h3>
                  </div>
                  <button
                    onClick={() => setShowFavorites(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-white/70">Access your favorite profiles for quick navigation.</p>
                </div>

                <div className="space-y-8">
                  {/* MEMORIA Favorites */}
                  {favoriteProfiles.memoria.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-medium text-white">MEMORIA Favorites</h4>
                        <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                          {favoriteProfiles.memoria.length} profiles
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteProfiles.memoria.map(profile => (
                          <div key={profile.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <div className="h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-white/60" />
                                </div>
                              </div>
                              
                              {profile.is_celebrity && (
                                <div className="absolute top-2 right-2">
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                                    Celebrity
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <h5 className="text-white font-medium truncate">{profile.name}</h5>
                              {profile.relationship && (
                                <p className="text-white/60 text-sm">{profile.relationship}</p>
                              )}
                              {profile.description && (
                                <p className="text-white/50 text-xs mt-2 line-clamp-2">{profile.description}</p>
                              )}
                              
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => handleViewProfile(profile.id, 'memoria')}
                                  className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                                >
                                  View Space
                                </button>
                                
                                <button
                                  onClick={() => handleRemoveFavorite(profile.id, 'memoria')}
                                  className="p-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
                                  title="Remove from favorites"
                                >
                                  <Star className="w-5 h-5 fill-current" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MEMOIR Favorites */}
                  {favoriteProfiles.memoir.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Compass className="w-5 h-5 text-blue-400" />
                        <h4 className="text-lg font-medium text-white">MEMOIR Favorites</h4>
                        <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {favoriteProfiles.memoir.length} profiles
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteProfiles.memoir.map(profile => (
                          <div key={profile.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                            <div className="h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-white/60" />
                                </div>
                              </div>
                            </div>

                            <div className="p-4">
                              <h5 className="text-white font-medium truncate">{profile.full_name || 'User'}</h5>
                              <p className="text-white/60 text-sm">{profile.bio || 'MEMOIR profile'}</p>
                              
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => handleViewProfile(profile.user_id, 'memoir')}
                                  className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                                >
                                  View Space
                                </button>
                                
                                <button
                                  onClick={() => handleRemoveFavorite(profile.id, 'memoir')}
                                  className="p-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
                                  title="Remove from favorites"
                                >
                                  <Star className="w-5 h-5 fill-current" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {favoriteProfiles.memoir.length === 0 && favoriteProfiles.memoria.length === 0 && (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <h4 className="text-xl font-semibold text-white mb-2">No Favorites Yet</h4>
                      <p className="text-white/60 mb-6">You haven't added any profiles to your favorites yet.</p>
                      <button
                        onClick={() => {
                          setShowFavorites(false);
                          setShowExplorer(true);
                          loadPublicProfiles();
                        }}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                      >
                        Explore Profiles
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Explorer Modal */}
        <AnimatePresence>
          {showExplorer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-70"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-5xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Globe className="w-8 h-8 text-blue-400" />
                    <h3 className="text-2xl font-bold text-white font-[Orbitron]">Explorer</h3>
                  </div>
                  <button
                    onClick={() => setShowExplorer(false)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-white/70">Discover and explore public profiles created by other users.</p>
                </div>

                {isLoadingProfiles ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-4"></div>
                    <p className="text-white/70">Loading public profiles...</p>
                  </div>
                ) : loadError ? (
                  <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">Error Loading Profiles</h4>
                    <p className="text-white/70 mb-4">{loadError}</p>
                    <button
                      onClick={loadPublicProfiles}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Public MEMORIA Profiles */}
                    {publicProfiles.memoria.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Heart className="w-5 h-5 text-purple-400" />
                          <h4 className="text-lg font-medium text-white">MEMORIA Profiles</h4>
                          <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            {publicProfiles.memoria.length} profiles
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {publicProfiles.memoria.map(profile => (
                            <div key={profile.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                              <div className="h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white/60" />
                                  </div>
                                </div>
                                
                                {profile.is_celebrity && (
                                  <div className="absolute top-2 right-2">
                                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                                      Celebrity
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="p-4">
                                <h5 className="text-white font-medium truncate">{profile.name}</h5>
                                {profile.relationship && (
                                  <p className="text-white/60 text-sm">{profile.relationship}</p>
                                )}
                                {profile.description && (
                                  <p className="text-white/50 text-xs mt-2 line-clamp-2">{profile.description}</p>
                                )}
                                
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => handleViewProfile(profile.id, 'memoria')}
                                    className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                                  >
                                    View Space
                                  </button>
                                  
                                  {isProfileFavorited(profile.id, 'memoria') ? (
                                    <button
                                      onClick={() => handleRemoveFavorite(profile.id, 'memoria')}
                                      className="p-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
                                      title="Remove from favorites"
                                    >
                                      <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAddFavorite(profile.id, 'memoria')}
                                      className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                                      title="Add to favorites"
                                    >
                                      <Heart className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Public MEMOIR Profiles */}
                    {publicProfiles.memoir.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Compass className="w-5 h-5 text-blue-400" />
                          <h4 className="text-lg font-medium text-white">MEMOIR Profiles</h4>
                          <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            {publicProfiles.memoir.length} profiles
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {publicProfiles.memoir.map(profile => (
                            <div key={profile.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                              <div className="h-20 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white/60" />
                                  </div>
                                </div>
                              </div>

                              <div className="p-4">
                                <h5 className="text-white font-medium truncate">{profile.full_name || 'User'}</h5>
                                <p className="text-white/60 text-sm">{profile.bio || 'MEMOIR profile'}</p>
                                
                                <div className="mt-4 flex gap-2">
                                  <button
                                    onClick={() => handleViewProfile(profile.user_id, 'memoir')}
                                    className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                                  >
                                    View Space
                                  </button>
                                  
                                  {isProfileFavorited(profile.id, 'memoir') ? (
                                    <button
                                      onClick={() => handleRemoveFavorite(profile.id, 'memoir')}
                                      className="p-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
                                      title="Remove from favorites"
                                    >
                                      <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAddFavorite(profile.id, 'memoir')}
                                      className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                                      title="Add to favorites"
                                    >
                                      <Heart className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {publicProfiles.memoir.length === 0 && publicProfiles.memoria.length === 0 && (
                      <div className="text-center py-12">
                        <Globe className="w-16 h-16 text-white/30 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-white mb-2">No Public Profiles Found</h4>
                        <p className="text-white/60 mb-6">There are no public profiles available to explore at this time.</p>
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                          <button
                            onClick={() => navigate('/memoir/settings')}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          >
                            Make Your Profile Public
                          </button>
                          <button
                            onClick={loadPublicProfiles}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation Footer - Matching landing page style */}
        <div className="fixed bottom-2 left-0 right-0 mx-auto w-fit px-4 py-2.5 rounded-xl z-50">
          <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm font-[Rajdhani]">
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
        
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen bg-black relative"
    >
      <Header />

      <div className="fixed top-8 left-8 z-50">
        <button
        onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 text-white/80 hover:text-white transition-colors font-[Orbitron]"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        <AuthForm
          isLogin={isLogin}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
          onGoogleSignIn={handleGoogleSignIn}
          loading={formLoading}
          error={error}
          onToggleLogin={setIsLogin}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </div>

      <Canvas camera={{ position: CAMERA_POSITION_MEMENTO, fov: CAMERA_FOV_DEFAULT }}>
        <Suspense fallback={null}>
          <MementoCameraController />
          <motion.group
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            <Model 
              position={[-4, -1, 0]}
              modelPath="/models/Celestial Starburst 0604191449 texture.glb"
              text="Explore"
              description="Discover other Profiles"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Celestial Starburst 0604191449 texture.glb",
                  modelText: "Explore"
                }
              })}
              initialRotation={[0, Math.PI / 2, 0]}
            />
            <Model 
              position={[0, -1, 0]}
              modelPath="/models/Stellar Heart Glow 0604140148 texture (1).glb"
              text="Favorite"
              description="Saved for easy access"
              setIsLoading={setIsLoading}
              onAccess={() => navigate('/memento/detail', { 
                state: { 
                  modelPath: "/models/Stellar Heart Glow 0604140148 texture (1).glb",
                  modelText: "Favorite"
                }
              })}
              initialRotation={[0, 0, 0]}
            />
            <Model 
              position={[4, -1, 0]}
              modelPath="/models/Woven Reflections 0609195756 texture.glb"
              text="Building Space"
              description="Create your own 3D space"
              setIsLoading={setIsLoading}
              onAccess={handleBuildingSpaceClick}
              initialRotation={[0, 0, 0]}
            />
          </motion.group>
          <Stars />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={false}
            target={[0, 0, 0]}
            minDistance={8}
            maxDistance={25}
          />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
        </Suspense>
      </Canvas>

      {/* Building Space Options Modal */}
      <AnimatePresence>
        {showSpaceOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-white/20 rounded-xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-6 text-center font-[Orbitron]">
                Choose Space Type
              </h3>
              
              <div className="space-y-6">
                <button
                  onClick={() => handleSelectSpaceType('memoir')}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 rounded-lg transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <Compass className="w-10 h-10" />
                  <div className="space-y-1 text-center">
                    <span className="text-xl font-medium">MEMOIR 3D Space</span>
                    <p className="text-white/70 text-sm px-4">Your personal digital legacy space</p>
                  </div>
                </button>
                
                <button
                  onClick={() => handleSelectSpaceType('memoria')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 rounded-lg transition-colors flex flex-col items-center justify-center gap-3"
                >
                  <Heart className="w-10 h-10" />
                  <div className="space-y-1 text-center">
                    <span className="text-xl font-medium">MEMORIA 3D Space</span>
                    <p className="text-white/70 text-sm px-4">Memorial space for loved ones</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowSpaceOptions(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-colors mt-4"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation Footer - Matching landing page style */}
      <div className="fixed bottom-2 left-0 right-0 mx-auto w-fit px-4 py-2.5 rounded-xl z-50">
        <div className="flex flex-wrap items-center justify-center gap-4 text-white/80 text-sm font-[Rajdhani]">
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
      
      <Footer />
    </motion.div>
  );
}