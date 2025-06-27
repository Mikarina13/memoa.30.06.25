import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html, PerspectiveCamera, Stage, useProgress } from '@react-three/drei';
import { User, Download, Share2, Cuboid, ExternalLink, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Suspense } from 'react';
import * as THREE from 'three';

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

// Enhanced error boundary for Model component
function ModelErrorBoundary({ children, onError }: { children: React.ReactNode, onError?: (error: string) => void }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('ModelErrorBoundary caught error:', event.error);
      setHasError(true);
      
      // Analyze the error message for better user feedback
      const message = event.error?.message || event.message || 'Unknown error';
      
      if (message.includes('Failed to load buffer') || message.includes('.bin')) {
        setErrorMessage('Missing binary data files (.bin). The GLTF model is incomplete.');
      } else if (message.includes('Couldn\'t load texture')) {
        setErrorMessage('Missing texture files. Some textures could not be loaded.');
      } else if (message.includes('404') || message.includes('not found')) {
        setErrorMessage('Model files not found in storage.');
      } else if (message.includes('CORS') || message.includes('Cross-Origin')) {
        setErrorMessage('Access denied to model files.');
      } else {
        setErrorMessage('Failed to load 3D model.');
      }
      
      onError?.(message);
    };

    // Listen for both error events and unhandled promise rejections
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', (event) => {
      handler({ error: event.reason, message: event.reason?.message || 'Promise rejection' } as ErrorEvent);
    });

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler as any);
    };
  }, [onError]);

  if (hasError) {
    return (
      <Html center>
        <div className="bg-black/90 p-6 rounded-lg text-white text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-medium text-red-400 mb-2">3D Model Loading Failed</p>
          <p className="text-sm text-white/70 mb-4">{errorMessage}</p>
          <div className="text-xs text-white/50 space-y-1">
            <p>• <strong>For GLTF:</strong> Upload all .bin and texture files</p>
            <p>• <strong>For GLB:</strong> Use self-contained GLB format</p>
            <p>• <strong>Solution:</strong> Re-export as GLB or upload complete GLTF package</p>
          </div>
        </div>
      </Html>
    );
  }

  return <>{children}</>;
}

function Model({ url, onLoadingComplete, onError }: { 
  url: string, 
  onLoadingComplete?: () => void,
  onError?: (error: string) => void 
}) {
  const [error, setError] = useState<string | null>(null);
  const [textureErrors, setTextureErrors] = useState<string[]>([]);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Track texture loading errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const textureErrorList: string[] = [];
    
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Capture texture loading errors
      if (message.includes('Couldn\'t load texture') || message.includes('Failed to load texture')) {
        const textureMatch = message.match(/Couldn't load texture\s*(.+?)$/);
        const textureName = textureMatch?.[1]?.trim() || 'unknown texture';
        if (!textureErrorList.includes(textureName)) {
          textureErrorList.push(textureName);
          setTextureErrors(prev => [...prev, textureName]);
        }
      }
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  // Enhanced GLTF loading with comprehensive error handling
  let scene: THREE.Group | null = null;
  let loadError: Error | null = null;
  
  try {
    const gltfResult = useGLTF(url, true, undefined, (loadError) => {
      console.error('GLTF Load Error:', loadError);
      
      const errorMessage = loadError.message || 'Failed to load 3D model';
      
      // Enhanced error categorization
      if (errorMessage.includes('Failed to load buffer') || errorMessage.includes('.bin')) {
        setError('Missing binary data files (.bin). GLTF models require all referenced .bin files to be uploaded to the same storage location.');
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('404') || errorMessage.includes('not found')) {
        setError('Model file not found. The 3D model file may have been deleted or the URL is incorrect.');
      } else if (errorMessage.includes('CORS') || errorMessage.includes('Cross-Origin')) {
        setError('Access denied. The model file cannot be loaded due to CORS restrictions.');
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('malformed')) {
        setError('Invalid model file. The GLTF/GLB file appears to be corrupted or malformed.');
      } else {
        setError(`Failed to load 3D model: ${errorMessage}`);
      }
      
      onError?.(errorMessage);
    });
    
    scene = gltfResult.scene;
  } catch (loadingError: any) {
    loadError = loadingError;
    console.error('Model loading exception:', loadingError);
    
    const errorMessage = loadingError.message || 'Exception during model loading';
    setError(`Model loading failed: ${errorMessage}`);
    onError?.(errorMessage);
  }
  
  useEffect(() => {
    if (scene && !error && !loadError) {
      setModelLoaded(true);
      
      // Brief delay to allow textures to load
      const timer = setTimeout(() => {
        onLoadingComplete?.();
      }, 1000); // Increased delay to allow texture loading
      
      return () => clearTimeout(timer);
    }
  }, [scene, error, loadError, onLoadingComplete]);
  
  // Show error state
  if (error || loadError) {
    return (
      <Html center>
        <div className="bg-black/90 p-6 rounded-lg text-white text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-medium text-red-400 mb-2">Failed to Load 3D Model</p>
          <p className="text-sm text-white/70 mb-4">{error || loadError?.message}</p>
          <div className="text-xs text-white/50 space-y-1">
            <p><strong>Common solutions:</strong></p>
            <p>• Convert to GLB format (self-contained)</p>
            <p>• Upload all GLTF dependencies (.bin, textures)</p>
            <p>• Verify file permissions in Supabase</p>
            <p>• Check model file integrity</p>
          </div>
          {textureErrors.length > 0 && (
            <div className="mt-4 p-2 bg-yellow-500/10 rounded text-xs">
              <p className="text-yellow-400 font-medium">Missing textures:</p>
              <p className="text-yellow-300">{textureErrors.join(', ')}</p>
            </div>
          )}
        </div>
      </Html>
    );
  }
  
  // Show loading or model
  if (!scene) {
    return <LoadingIndicator />;
  }
  
  return (
    <ModelErrorBoundary onError={onError}>
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
      
      {/* Show texture warning if there are missing textures but model loaded */}
      {modelLoaded && textureErrors.length > 0 && (
        <Html position={[0, 2, 0]}>
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 text-yellow-300 text-xs max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4" />
              <span className="font-medium">Missing Textures ({textureErrors.length})</span>
            </div>
            <p className="mb-2">Some texture files are missing. The model will appear with default materials.</p>
            <p className="text-xs opacity-75">Missing: {textureErrors.slice(0, 3).join(', ')}{textureErrors.length > 3 ? '...' : ''}</p>
          </div>
        </Html>
      )}
    </ModelErrorBoundary>
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
          <p>• <strong>Recommended:</strong> GLB format (self-contained)</p>
          <p>• <strong>GLTF:</strong> Upload all .bin and texture files</p>
          <p>• <strong>External:</strong> Must be publicly accessible</p>
        </div>
      </div>
    </Html>
  );
}

export function AvaturnAvatarDetail({ data }: AvaturnAvatarDetailProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(data[0]?.id || null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [showModelIssues, setShowModelIssues] = useState(false);
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
    setModelError(null);
  }, []);

  // Handle model loading error
  const handleModelError = useCallback((error: string) => {
    setModelError(error);
    setModelLoaded(false);
    setShowModelIssues(true); // Auto-show issues panel when error occurs
  }, []);

  // Function to force reload the model
  const handleReloadModel = useCallback(() => {
    setModelLoaded(false);
    setModelError(null);
    setShowModelIssues(false);
    setReloadTrigger(prev => prev + 1);
  }, []);

  // Reset error state when switching avatars
  useEffect(() => {
    setModelError(null);
    setModelLoaded(false);
    setShowModelIssues(false);
  }, [selectedAvatar]);

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
                  setModelError(null);
                  setShowModelIssues(false);
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
                      gl={{ 
                        antialias: true, 
                        alpha: true, 
                        preserveDrawingBuffer: true,
                        powerPreference: 'high-performance' // Better performance for 3D rendering
                      }}
                      camera={{ position: [0, 0, 5], fov: 50 }}
                      onCreated={(state) => {
                        // Handle canvas creation errors
                        state.gl.domElement.addEventListener('webglcontextlost', (event) => {
                          event.preventDefault();
                          console.error('WebGL context lost');
                          setModelError('Graphics context lost. Please reload the page.');
                        });
                      }}
                    >
                      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
                      <color attach="background" args={['#000000']} />
                      
                      {modelUrl ? (
                        <Suspense fallback={<LoadingIndicator />}>
                          <Model 
                            url={modelUrl} 
                            onLoadingComplete={handleModelLoadingComplete}
                            onError={handleModelError}
                          />
                        </Suspense>
                      ) : (
                        <FallbackScene />
                      )}
                      
                      <OrbitControls 
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true} 
                        autoRotate={!modelLoaded && !modelError} 
                        autoRotateSpeed={1}
                        minDistance={2}
                        maxDistance={10}
                        target={[0, 0, 0]}
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
                    {modelError ? 'Model failed to load' : hasValidModel ? 'Interactive 3D Model' : 'No model available'}
                  </p>
                  {modelError && (
                    <p className="text-red-400 text-xs mt-1">
                      Click the info button below for troubleshooting
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {modelUrl && !modelLoaded && !modelError && (
                    <button
                      onClick={handleReloadModel}
                      className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                      title="Reload model"
                    >
                      <RefreshCw className="w-5 h-5 text-orange-400" />
                    </button>
                  )}
                  
                  {(modelError || !hasValidModel) && (
                    <button
                      onClick={() => setShowModelIssues(!showModelIssues)}
                      className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                      title="Show troubleshooting info"
                    >
                      <Info className="w-5 h-5 text-red-400" />
                    </button>
                  )}
                  
                  {hasValidModel && !modelError && (
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
                  
                  {hasValidModel && !modelError && (
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
          
          {/* Error Details Panel */}
          {showModelIssues && (modelError || !hasValidModel) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                3D Model Issues & Solutions
              </h4>
              <div className="text-white/70 text-sm space-y-3">
                {modelError && (
                  <div className="p-3 bg-red-500/10 rounded border border-red-500/20">
                    <p className="text-red-300 font-medium mb-1">Current Error:</p>
                    <p className="text-red-200 text-xs">{modelError}</p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium text-white/80 mb-2">Common Issues & Solutions:</p>
                  <div className="grid gap-3">
                    <div className="bg-black/30 rounded p-3">
                      <p className="font-medium text-orange-400 text-xs">Missing Binary Files (.bin)</p>
                      <p className="text-xs mt-1">GLTF models reference external .bin files. Upload the complete GLTF package or convert to GLB format.</p>
                    </div>
                    
                    <div className="bg-black/30 rounded p-3">
                      <p className="font-medium text-yellow-400 text-xs">Missing Textures (.jpg, .png)</p>
                      <p className="text-xs mt-1">Upload all texture files referenced by the model to the same storage location.</p>
                    </div>
                    
                    <div className="bg-black/30 rounded p-3">
                      <p className="font-medium text-blue-400 text-xs">File Not Found (404)</p>
                      <p className="text-xs mt-1">The model file or its dependencies were deleted or moved. Re-upload the complete model package.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <p className="font-medium text-green-400 text-xs mb-1">Recommended Solution:</p>
                  <p className="text-xs">Convert your model to GLB format using Blender or online converters. GLB files are self-contained and include all textures and geometry in a single file, preventing dependency issues.</p>
                </div>
              </div>
            </div>
          )}
          
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
          
          {/* File Format Guidance */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <h4 className="text-blue-400 font-medium mb-2">3D Model Format Guidelines:</h4>
            <div className="text-white/70 text-sm space-y-2">
              <div>
                <p className="font-medium text-green-400">✓ Recommended: GLB Format</p>
                <ul className="text-xs space-y-1 mt-1 ml-4">
                  <li>• Self-contained: includes textures and geometry in one file</li>
                  <li>• No missing file issues</li>
                  <li>• Smaller file size and faster loading</li>
                  <li>• Best compatibility with web viewers</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-yellow-400">⚠ GLTF Format Requirements:</p>
                <ul className="text-xs space-y-1 mt-1 ml-4">
                  <li>• Must upload ALL referenced files (.bin, .jpg, .png, etc.)</li>
                  <li>• Keep original file names and structure</li>
                  <li>• Files must be in the same storage directory</li>
                  <li>• More prone to loading errors</li>
                </ul>
              </div>
            </div>
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
              <a 
                href="https://products.aspose.app/3d/conversion/gltf-to-glb" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                GLTF to GLB Converter
              </a>
            </div>
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