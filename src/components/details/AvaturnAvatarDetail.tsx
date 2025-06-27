import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html, PerspectiveCamera, Stage, useProgress } from '@react-three/drei';
import { User, Download, Share2, Cuboid, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

interface AvaturnAvatarDetailProps {
  data: Array<{
    id: string;
    sourcePhoto?: string;
    modelUrl?: string;
    avaturnUrl?: string;
    isExternal?: boolean;
    externalSource?: string;
    embedCode?: string;
    modelName?: string;
    createdAt: string;
    isCustomModel?: boolean;
  }>;
}

// Loading indicator component
function LoadingIndicator() {
  const { progress, active } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/80 p-4 rounded-lg">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-white text-sm">Loading 3D model... {Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

// Component to render an iframe for external models like p3d.in
function ExternalModelEmbed({ embedCode }: { embedCode: string }) {
  return (
    <div 
      className="w-full h-full flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  );
}

// Error boundary for Model component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('Error caught by error boundary:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <Html center>
        <div className="bg-black/80 p-6 rounded-lg text-white text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-medium text-red-400 mb-2">Error Loading 3D Model</p>
          <p className="text-sm text-white/70 mb-4">
            The 3D model could not be loaded properly. Try refreshing the viewer.
          </p>
        </div>
      </Html>
    );
  }

  return <>{children}</>;
}

function Model({ url, onLoadingComplete }: { url: string, onLoadingComplete?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  
  // Always call useGLTF and let it handle loading with suspense and error callback
  const { scene } = useGLTF(url, true, undefined, (loadError) => {
    console.error('Error loading model:', loadError);
    setError('Failed to load 3D model. The model file or its textures may be missing or inaccessible.');
  });
  
  useEffect(() => {
    if (scene && !error && onLoadingComplete) {
      const timer = setTimeout(onLoadingComplete, 100);
      return () => clearTimeout(timer);
    }
  }, [scene, error, onLoadingComplete]);
  
  if (error) {
    return (
      <Html center>
        <div className="bg-black/80 p-6 rounded-lg text-white text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-medium text-red-400 mb-2">Failed to Load 3D Model</p>
          <p className="text-sm text-white/70 mb-4">
            The model file or its textures could not be loaded. This typically occurs when files are missing from storage or there are network connectivity issues.
          </p>
          <p className="text-xs text-white/50">
            Please verify that all model files and textures are properly uploaded and accessible.
          </p>
        </div>
      </Html>
    );
  }
  
  return (
    <ErrorBoundary>
      <Stage
        shadows
        environment="city"
        intensity={0.5}
        adjustCamera={false}
        preset="rembrandt"
      >
        <primitive 
          object={scene} 
          scale={1.8} 
          position={[0, -1.8, 0]} 
          rotation={[0, 0, 0]} 
        />
      </Stage>
    </ErrorBoundary>
  );
}

// Fallback 3D scene when no model is available
function FallbackScene() {
  return (
    <Html center>
      <div className="bg-black/80 p-8 rounded-lg text-white text-center max-w-md">
        <Cuboid className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No 3D Model Available</h3>
        <p className="text-white/60 mb-4">
          Upload a 3D model (.glb or .gltf) or provide a valid model URL to view it here.
        </p>
        <div className="text-left text-sm text-white/50 space-y-1">
          <p>• Supported formats: GLB, GLTF</p>
          <p>• External URLs must be publicly accessible</p>
          <p>• Models should be optimized for web viewing</p>
        </div>
      </div>
    </Html>
  );
}

export function AvaturnAvatarDetail({ data }: AvaturnAvatarDetailProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(data[0]?.id || null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get the URL for the avatar (model or avaturn) - moved before usage
  const getAvatarUrl = useCallback((avatar: any) => {
    if (avatar.modelUrl && avatar.modelUrl.startsWith('http')) {
      return avatar.modelUrl;
    } else if (avatar.avaturnUrl && avatar.avaturnUrl.startsWith('http')) {
      return avatar.avaturnUrl;
    }
    return null;
  }, []);
  
  const selectedAvatarData = data.find(avatar => avatar.id === selectedAvatar);
  const modelUrl = selectedAvatarData ? getAvatarUrl(selectedAvatarData) : null;
  const isExternalEmbed = selectedAvatarData?.isExternal && selectedAvatarData?.embedCode;
  const hasValidModel = modelUrl || isExternalEmbed;

  // Handle model loading complete
  const handleModelLoadingComplete = useCallback(() => {
    setModelLoaded(true);
  }, []);

  // Function to force reload the model
  const handleReloadModel = useCallback(() => {
    setModelLoaded(false);
    setModelError(false);
    setReloadTrigger(prev => prev + 1);
  }, []);

  // Handle view in external site
  const openExternalModel = useCallback((avatar: any) => {
    if (!avatar) return;
    
    if (avatar.isExternal && avatar.modelUrl) {
      if (avatar.modelUrl.includes('p3d.in')) {
        // Handle different p3d.in URL formats
        let modelId;
        if (avatar.modelUrl.includes('/e/')) {
          // Format: https://p3d.in/e/abc123
          modelId = avatar.modelUrl.split('/e/').pop();
        } else {
          // Format: https://p3d.in/abc123
          modelId = avatar.modelUrl.split('p3d.in/').pop();
        }
        
        if (modelId) {
          window.open(`https://p3d.in/e/${modelId}`, '_blank');
        } else {
          window.open(avatar.modelUrl, '_blank');
        }
      } else {
        // For other external URLs
        window.open(avatar.modelUrl, '_blank');
      }
    } else if (avatar.modelUrl) {
      window.open(avatar.modelUrl, '_blank');
    } else if (avatar.avaturnUrl) {
      window.open(avatar.avaturnUrl, '_blank');
    }
  }, []);

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">3D Avatars</h2>
      
      {data.length > 0 ? (
        <>
          {/* Avatar Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {data.map((avatar) => (
              <div 
                key={avatar.id} 
                className={`bg-white/5 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedAvatar === avatar.id ? 'ring-2 ring-orange-400' : 'hover:bg-white/10'
                }`}
                onClick={() => {
                  setSelectedAvatar(avatar.id);
                  setModelLoaded(false);
                }}
              >
                {avatar.sourcePhoto ? (
                  <img 
                    src={avatar.sourcePhoto} 
                    alt="Source" 
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-2">
                    {avatar.isCustomModel ? (
                      <Cuboid className="w-8 h-8 text-orange-400" />
                    ) : (
                      <User className="w-8 h-8 text-orange-400" />
                    )}
                  </div>
                )}
                
                <p className="text-white text-sm font-medium truncate">
                  {avatar.isCustomModel ? avatar.modelName || '3D Model' : '3D Avatar'}
                </p>
                <p className="text-white/50 text-xs">
                  {new Date(avatar.createdAt).toLocaleDateString()}
                </p>
                
                {/* Status indicator */}
                <div className="mt-1">
                  {getAvatarUrl(avatar) || (avatar.isExternal && avatar.embedCode) ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                      No Model
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 3D Viewer */}
          <div className="bg-white/5 rounded-lg overflow-hidden border border-white/20">
            <div className="relative h-96 bg-black/30">
              {isExternalEmbed ? (
                // Render external embed (like p3d.in iframe)
                <ExternalModelEmbed embedCode={selectedAvatarData.embedCode} />
              ) : (
                <div className="w-full h-full relative">
                  {/* Canvas container with key for remounting */}
                  <div className="w-full h-full" key={`model-canvas-${selectedAvatar}-${reloadTrigger}`}>
                    <Canvas
                      ref={canvasRef}
                      shadows
                      dpr={[1, 2]}
                      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
                      camera={{ position: [0, 0, 5], fov: 50 }}
                    >
                      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                      <color attach="background" args={['#000000']} />
                      
                      {modelUrl ? (
                        <Suspense fallback={<LoadingIndicator />}>
                          <Model url={modelUrl} onLoadingComplete={handleModelLoadingComplete} />
                        </Suspense>
                      ) : (
                        <FallbackScene />
                      )}
                      
                      <OrbitControls 
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true} 
                        autoRotate={!modelLoaded} 
                        autoRotateSpeed={1}
                        minDistance={2}
                        maxDistance={10}
                      />
                      <Environment preset="city" />
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                    </Canvas>
                    
                    {/* Reload button overlay */}
                    {modelUrl && (
                      <button
                        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-all z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReloadModel();
                        }}
                        title="Reload 3D model"
                      >
                        <RefreshCw className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">
                    {selectedAvatarData?.isCustomModel 
                      ? (selectedAvatarData.modelName || '3D Model') 
                      : '3D Avatar'}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {hasValidModel ? 'Interactive 3D Model' : 'No model available'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {modelUrl && !modelLoaded && (
                    <button
                      onClick={handleReloadModel}
                      className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                      title="Reload model"
                    >
                      <RefreshCw className="w-5 h-5 text-orange-400" />
                    </button>
                  )}
                  
                  {hasValidModel && (
                    <button 
                      onClick={() => {
                        if (navigator.share && selectedAvatarData) {
                          navigator.share({
                            title: selectedAvatarData.isCustomModel ? 'My 3D Model' : 'My 3D Avatar',
                            url: selectedAvatarData.modelUrl || selectedAvatarData.avaturnUrl || window.location.href
                          }).catch(err => console.error('Share failed:', err));
                        }
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                  
                  {hasValidModel && (
                    <button 
                      onClick={() => openExternalModel(selectedAvatarData)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Open external viewer"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
            <h4 className="text-orange-400 font-medium mb-2">3D Model Controls:</h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Click and drag to rotate the model</li>
              <li>• Scroll to zoom in and out</li>
              <li>• Right-click and drag to pan</li>
              <li>• Double-click to reset the view</li>
              <li>• Click the refresh button if the model doesn't load properly</li>
              <li>• External models open in a new tab when clicked</li>
            </ul>
          </div>
          
          {/* Error Troubleshooting */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
            <h4 className="text-red-400 font-medium mb-2">Troubleshooting Model Loading Issues:</h4>
            <ul className="text-white/70 text-sm space-y-1">
              <li>• Models may fail to load if files are missing from storage</li>
              <li>• Texture files (like .jpg, .png) must be in the same location as the model</li>
              <li>• Check that all model files were uploaded successfully</li>
              <li>• Try refreshing the page or using the reload button</li>
              <li>• Contact support if models consistently fail to load</li>
            </ul>
          </div>
          
          {/* External Resources */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <h4 className="text-blue-400 font-medium mb-2">External Resources:</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              <a 
                href="https://avaturn.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Avaturn
              </a>
              <a 
                href="https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Sketchfab Models
              </a>
            </div>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://p3d.in/upload" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                p3d.in Upload
              </a>
              <div className="text-xs text-white/60 mt-2 space-y-1">
                <p>
                  Upload your model to p3d.in and paste the URL (e.g., https://p3d.in/Jd1Vk) 
                  in the "External 3D Model URL" field to display it in MEMOA.
                </p>
                <p className="text-amber-400">
                  Note: External 3D models will open in a new tab when you click on them.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <User className="w-16 h-16 text-orange-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No 3D Avatars Found</h3>
          <p className="text-white/60 mb-6">No 3D avatars or models have been created yet.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}