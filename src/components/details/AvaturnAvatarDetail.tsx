import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Html, PerspectiveCamera, Stage } from '@react-three/drei';
import { User, Download, Share2, Cuboid, ExternalLink, RefreshCw, AlertCircle, Info, AlertTriangle, Link } from 'lucide-react';
import { Suspense } from 'react';
import * as THREE from 'three';
import { ErrorBoundary } from 'react-error-boundary';

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
    fileFormat?: string;
  }>;
}

// Loading indicator component
function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/80 p-4 rounded-lg">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-white text-sm">Loading 3D model...</p>
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

// Error boundary fallback component with enhanced GLTF guidance - moved outside Canvas to avoid R3F hook issues
function ModelErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  // Analyze the error to provide specific guidance
  let displayError = error.message || 'Unknown error occurred';
  let solution = '';
  let isGltfError = false;
  
  if (displayError.includes('Failed to load buffer') || displayError.includes('.bin')) {
    displayError = 'Missing binary data files (.bin)';
    solution = 'GLTF models require all referenced .bin files to be uploaded to the same storage location.';
    isGltfError = true;
  } else if (displayError.includes('Couldn\'t load texture')) {
    displayError = 'Missing texture files';
    solution = 'Upload all texture files (.jpg, .png) referenced by the model to the same storage location.';
    isGltfError = true;
  } else if (displayError.includes('404') || displayError.includes('not found')) {
    displayError = 'Model file not found';
    solution = 'The 3D model file may have been deleted or the URL is incorrect.';
  } else if (displayError.includes('CORS') || displayError.includes('Cross-Origin')) {
    displayError = 'Access denied';
    solution = 'The model file cannot be loaded due to CORS restrictions. Make sure the storage bucket allows public access.';
  }
  
  return (
    <div className="w-full h-full bg-black/90 p-6 rounded-lg text-white text-center max-w-md mx-auto flex flex-col items-center justify-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="font-medium text-red-400 mb-2">Failed to Load 3D Model</p>
      <p className="text-sm text-white/70 mb-4">{displayError}</p>
      {solution && (
        <p className="text-xs text-white/50 mb-4">{solution}</p>
      )}
      
      {isGltfError && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 mb-4 w-full">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-400 font-medium text-sm">GLTF Dependency Issue</p>
          </div>
          <p className="text-xs text-white/70 mb-2">
            This appears to be a GLTF model with missing dependencies.
          </p>
          <div className="text-left text-xs text-white/60 space-y-1">
            <p><strong>Solutions:</strong></p>
            <p>• Convert to GLB format (self-contained)</p>
            <p>• Upload ALL .bin and texture files together</p>
            <p>• Use <a href="https://products.aspose.app/3d/conversion/gltf-to-glb" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline">GLTF to GLB converter</a></p>
          </div>
        </div>
      )}
      
      <button
        onClick={resetErrorBoundary}
        className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-sm transition-colors"
      >
        Try Again
      </button>
      
      <div className="text-xs text-white/50 space-y-1 mt-4 w-full">
        <p><strong>Common solutions:</strong></p>
        <p>• Convert to GLB format (self-contained)</p>
        <p>• Upload all GLTF dependencies (.bin, textures)</p>
        <p>• Verify file permissions in Supabase</p>
        <p>• Check model file integrity</p>
      </div>
    </div>
  );
}

// Improved Model component with proper error handling
function Model({ url, onLoadingComplete }: { 
  url: string, 
  onLoadingComplete?: () => void
}) {
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  
  // Validate URL before attempting to load
  const isValidUrl = url && (url.startsWith('http') || url.startsWith('blob:')) && url.includes('.');
  
  useEffect(() => {
    // Cleanup function to set mounted ref to false when unmounting
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Reset error state when URL changes
    setError(null);
    
    // If URL is invalid, set error immediately
    if (!isValidUrl) {
      setError('Invalid model URL provided');
    } else if (onLoadingComplete && mountedRef.current) {
      // Small delay to allow model to actually render before marking as complete
      const timer = setTimeout(() => {
        onLoadingComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [url, isValidUrl, onLoadingComplete]);
  
  try {
    // Only call useGLTF if we have a valid URL
    if (!isValidUrl) {
      throw new Error('Invalid model URL provided');
    }
    
    const { scene } = useGLTF(url);
    
    if (!scene) {
      throw new Error('Model scene could not be loaded');
    }
    
    return (
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
    );
  } catch (e) {
    // Re-throw for ErrorBoundary to catch
    if (e instanceof Error) {
      throw e;
    }
    // Handle non-Error throws
    throw new Error('Failed to load 3D model');
  }
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
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [showModelIssues, setShowModelIssues] = useState(false);
  const [modelError, setModelError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get the URL for the avatar (model or avaturn)
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
  const isGltfModel = selectedAvatarData?.fileFormat === 'gltf' || (modelUrl && modelUrl.toLowerCase().endsWith('.gltf'));

  // Handle model loading complete
  const handleModelLoadingComplete = useCallback(() => {
    setModelLoaded(true);
    setModelError(null);
  }, []);

  // Function to force reload the model
  const handleReloadModel = useCallback(() => {
    setModelLoaded(false);
    setShowModelIssues(false);
    setModelError(null);
    setReloadTrigger(prev => prev + 1);
    // Clear the GLTF cache for this URL
    if (modelUrl) {
      useGLTF.clear(modelUrl);
    }
  }, [modelUrl]);

  // Reset state when switching avatars
  useEffect(() => {
    setModelLoaded(false);
    setShowModelIssues(false);
    setModelError(null);
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

  // Error boundary reset function
  const handleErrorBoundaryReset = useCallback(() => {
    setModelLoaded(false);
    setShowModelIssues(false);
    setModelError(null);
    setReloadTrigger(prev => prev + 1);
    if (modelUrl) {
      useGLTF.clear(modelUrl);
    }
  }, [modelUrl]);

  // Handle errors from the error boundary
  const handleModelError = useCallback((error: Error) => {
    console.error('3D Model error:', error);
    setModelError(error);
    setModelLoaded(false);
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
                  setShowModelIssues(false);
                  setModelError(null);
                }}
              >
                {avatar.sourcePhoto ? (
                  <img 
                    src={avatar.sourcePhoto} 
                    alt="Source" 
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mb-2 relative">
                    {avatar.isCustomModel ? (
                      <Cuboid className="w-8 h-8 text-orange-400" />
                    ) : (
                      <User className="w-8 h-8 text-orange-400" />
                    )}
                    
                    {/* File format indicator */}
                    {avatar.fileFormat === 'gltf' && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1 py-0.5 rounded-full font-medium">
                        GLTF
                      </div>
                    )}
                    {avatar.fileFormat === 'glb' && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-black text-xs px-1 py-0.5 rounded-full font-medium">
                        GLB
                      </div>
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
                <div className="mt-1 flex items-center justify-between">
                  {getAvatarUrl(avatar) || (avatar.isExternal && avatar.embedCode) ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                      No Model
                    </span>
                  )}
                  
                  {avatar.fileFormat === 'gltf' && (
                    <AlertTriangle className="w-3 h-3 text-yellow-400" title="GLTF format - may have dependency issues" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* GLTF Warning for current selection */}
          {isGltfModel && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                GLTF Model Detected
              </h4>
              <p className="text-white/70 text-sm mb-2">
                This model uses GLTF format, which requires all texture and binary files to be uploaded together. 
                If the model fails to load, it may be missing dependencies.
              </p>
              <p className="text-yellow-300 text-xs">
                💡 For best results, convert to GLB format using <a href="https://products.aspose.app/3d/conversion/gltf-to-glb" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">online converters</a> or Blender.
              </p>
            </div>
          )}
          
          {/* 3D Viewer */}
          <div className="bg-white/5 rounded-lg overflow-hidden border border-white/20">
            <div className="relative h-96 bg-black/30">
              {isExternalEmbed ? (
                // Render external embed (like p3d.in iframe)
                <ExternalModelEmbed embedCode={selectedAvatarData.embedCode} />
              ) : modelError ? (
                // Show error fallback outside Canvas to avoid R3F hook issues
                <ModelErrorFallback 
                  error={modelError} 
                  resetErrorBoundary={handleErrorBoundaryReset}
                />
              ) : (
                <div className="w-full h-full relative">
                  {/* Canvas container with key for remounting */}
                  <div className="w-full h-full" key={`model-canvas-${selectedAvatar}-${reloadTrigger}`}>
                    <ErrorBoundary
                      FallbackComponent={({ error }) => (
                        <ModelErrorFallback 
                          error={error} 
                          resetErrorBoundary={handleErrorBoundaryReset}
                        />
                      )}
                      onError={handleModelError}
                      resetKeys={[selectedAvatar, reloadTrigger]}
                    >
                      <Canvas
                        ref={canvasRef}
                        shadows
                        dpr={[1, 1.5]} // Lower DPR for better performance
                        gl={{ 
                          antialias: true, 
                          alpha: true, 
                          preserveDrawingBuffer: true,
                          powerPreference: 'default' // Less demanding on GPU
                        }}
                        camera={{ position: [0, 0, 5], fov: 50 }}
                        onCreated={(state) => {
                          // Handle canvas creation errors
                          state.gl.domElement.addEventListener('webglcontextlost', (event) => {
                            event.preventDefault();
                            console.error('WebGL context lost');
                            setModelError(new Error('WebGL context lost - please refresh'));
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
                            />
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
                          target={[0, 0, 0]}
                        />
                        <Environment preset="city" />
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} />
                        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
                      </Canvas>
                    </ErrorBoundary>
                    
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
                  <h3 className="text-white font-medium flex items-center gap-2">
                    {selectedAvatarData?.isCustomModel 
                      ? (selectedAvatarData.modelName || '3D Model') 
                      : '3D Avatar'}
                    {selectedAvatarData?.fileFormat === 'gltf' && (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                        GLTF
                      </span>
                    )}
                    {selectedAvatarData?.fileFormat === 'glb' && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                        GLB
                      </span>
                    )}
                  </h3>
                  <p className="text-white/60 text-sm">
                    {hasValidModel ? (modelLoaded && !modelError ? 'Interactive 3D Model' : 'Loading model...') : 'No model available'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {modelUrl && (!modelLoaded || modelError) && (
                    <button
                      onClick={handleReloadModel}
                      className="p-2 rounded-full bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                      title="Reload model"
                    >
                      <RefreshCw className="w-5 h-5 text-orange-400" />
                    </button>
                  )}
                  
                  {(!modelLoaded || modelError) && (
                    <button
                      onClick={() => setShowModelIssues(!showModelIssues)}
                      className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                      title="Show troubleshooting info"
                    >
                      <Info className="w-5 h-5 text-blue-400" />
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
          
          {/* Error Details Panel */}
          {showModelIssues && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                3D Model Troubleshooting Guide
              </h4>
              <div className="text-white/70 text-sm space-y-3">
                {isGltfModel ? (
                  <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/20">
                    <p className="text-yellow-400 font-medium mb-1">⚠️ GLTF Format Detected</p>
                    <p className="text-white/70 text-xs">
                      GLTF files require all associated texture and binary files to be present in the same location. 
                      The upload process only uploads the .gltf file itself, not its dependencies.
                    </p>
                  </div>
                ) : null}
                
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
                  <p className="font-medium text-green-400 text-xs mb-1">✅ Recommended Solution:</p>
                  <p className="text-xs mb-2">Convert your model to GLB format using Blender or an online converter. GLB files are self-contained and include all textures and geometry in a single file, preventing dependency issues.</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a 
                      href="https://products.aspose.app/3d/conversion/gltf-to-glb" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Aspose GLTF to GLB
                    </a>
                    <a 
                      href="https://anyconv.com/gltf-to-glb-converter/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded"
                    >
                      <ExternalLink className="w-3 h-3" />
                      AnyConv Converter
                    </a>
                  </div>
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
          
          {/* Enhanced File Format Guidance */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              3D Model Format Guidelines
            </h4>
            <div className="text-white/70 text-sm space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                  <p className="font-medium text-green-400">✅ Recommended: GLB Format</p>
                  <ul className="text-xs space-y-1 mt-1">
                    <li>• Self-contained file (includes all assets)</li>
                    <li>• No missing file issues</li>
                    <li>• Faster loading and smaller size</li>
                    <li>• Best for web 3D viewers</li>
                    <li>• Works reliably across all devices</li>
                  </ul>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="font-medium text-yellow-400">⚠️ GLTF Format Issues</p>
                  <ul className="text-xs space-y-1 mt-1">
                    <li>• Requires ALL asset files separately</li>
                    <li>• Must upload all files to the EXACT same location</li>
                    <li>• Original file names must be preserved</li>
                    <li>• Prone to loading errors</li>
                    <li>• Not recommended for web 3D viewers</li>
                  </ul>
                </div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <Link className="w-4 h-4 text-orange-400" />
                  <p className="text-orange-400 text-xs font-medium">Online 3D Model Converters:</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a href="https://products.aspose.app/3d/conversion/gltf-to-glb" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline hover:text-orange-300">Aspose Converter</a>
                  <a href="https://anyconv.com/gltf-to-glb-converter/" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline hover:text-orange-300">AnyConv</a>
                  <a href="https://www.vectary.com/3d-modeling-tool/file-converter/" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline hover:text-orange-300">Vectary</a>
                </div>
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