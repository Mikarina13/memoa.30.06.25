import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Upload, ExternalLink, CheckCircle, AlertCircle, Download, Eye, Cuboid as Cube, FileUp, Trash2, AlertTriangle, Info, Link } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface AvaturnAvatarInterfaceProps {
  memoriaProfileId?: string;
  onAvatarCreated?: (avatarData: any) => void;
  onClose?: () => void;
}

export function AvaturnAvatarInterface({ memoriaProfileId, onAvatarCreated, onClose }: AvaturnAvatarInterfaceProps) {
  const { user } = useAuth();
  const [uploadedModel, setUploadedModel] = useState<File | null>(null);
  const [externalModelUrl, setExternalModelUrl] = useState<string>('');
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [avatarData, setAvatarData] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'gallery'>('model');
  const [showGltfWarning, setShowGltfWarning] = useState<boolean>(false);

  const modelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadExistingAvatars();
    }
  }, [user]);

  const loadExistingAvatars = async () => {
    try {
      if (memoriaProfileId) {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        if (profile?.profile_data?.avaturn_avatars) {
          setAvatarData(profile.profile_data.avaturn_avatars);
        }
      } else {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.memoir_data?.avaturn_avatars) {
          setAvatarData(profile.memoir_data.avaturn_avatars);
        }
      }
    } catch (error) {
      console.error('Error loading avatars:', error);
    }
  };

  const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      setUploadedModel(file);
      const url = URL.createObjectURL(file);
      setModelPreview(url);
      setActiveTab('model');
      
      // Show warning if it's a GLTF file (not GLB)
      if (file.name.endsWith('.gltf')) {
        setShowGltfWarning(true);
      } else {
        setShowGltfWarning(false);
      }
    } else {
      alert('Please select a valid 3D model file (.glb or .gltf)');
    }
    event.target.value = '';
  };

  const handleDeleteModel = async (avatarId: string) => {
    if (!user) return;
    
    try {
      setDeletingModel(avatarId);
      
      // Remove the avatar from the collection
      const updatedAvatars = avatarData?.avatars.filter((avatar: any) => avatar.id !== avatarId) || [];
      
      const avatarCollection = {
        avatars: updatedAvatars,
        last_updated: new Date().toISOString()
      };
      
      if (memoriaProfileId) {
        // Update Memoria profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          avaturn_avatars: avatarCollection
        }, memoriaProfileId);
      } else {
        // Update user profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          avaturn_avatars: avatarCollection
        });
      }
      
      // Update local state
      setAvatarData(avatarCollection);
      
      // Update integration status if no avatars left
      if (updatedAvatars.length === 0) {
        if (memoriaProfileId) {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
            status: 'not_started',
            avatar_created: false
          }, memoriaProfileId);
        } else {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
            status: 'not_started',
            avatar_created: false
          });
        }
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Failed to delete model. Please try again.');
    } finally {
      setDeletingModel(null);
    }
  };

  // Helper function to generate proper p3d.in embed code
  const generateP3dEmbedCode = (url: string): string => {
    let modelId;
    if (url.includes('/e/')) {
      // Format: https://p3d.in/e/abc123
      modelId = url.split('/e/').pop();
    } else {
      // Format: https://p3d.in/abc123
      modelId = url.split('p3d.in/').pop();
    }
    
    return `<iframe allowfullscreen width="640" height="480" loading="lazy" frameborder="0" src="https://p3d.in/e/${modelId}"></iframe>`;
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const openAvaturn = () => {
    window.open('https://avaturn.me/', '_blank');
  };

  const uploadCustomModel = async () => {
    if (!user || (!uploadedModel && !externalModelUrl)) return;

    // Validate URL if provided
    if (externalModelUrl && !validateUrl(externalModelUrl)) {
      setUploadError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    // Show additional warning for GLTF files
    if (uploadedModel && uploadedModel.name.endsWith('.gltf')) {
      const confirmed = window.confirm(
        '⚠️ GLTF files require all associated files (.bin files and textures) to work properly.\n\n' +
        'This may cause loading errors if dependencies are missing.\n\n' +
        'For best results, convert to GLB format which is self-contained.\n\n' +
        'Continue anyway?'
      );
      
      if (!confirmed) {
        return;
      }
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      if (memoriaProfileId) {
        // Update integration status to in_progress for Memoria profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
          status: 'in_progress'
        }, memoriaProfileId);
      } else {
        // Update integration status to in_progress for user profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
          status: 'in_progress'
        });
      }

      let modelUrl: string;
      
      // If external URL is provided, use it directly
      if (externalModelUrl) {
        modelUrl = externalModelUrl;
      } else if (uploadedModel) {
        // Otherwise upload the file to storage
        modelUrl = await MemoirIntegrations.upload3DModelFile(user.id, uploadedModel, memoriaProfileId);
      } else {
        throw new Error('No model file or URL provided');
      }

      const newAvatarData = {
        id: `custom-model-${Date.now()}`,
        sourcePhoto: null,
        modelName: uploadedModel ? uploadedModel.name : externalModelUrl.split('/').pop() || 'External 3D Model',
        modelSize: uploadedModel ? uploadedModel.size : 0,
        modelUrl: modelUrl,
        isExternal: !!externalModelUrl,
        externalSource: externalModelUrl ? new URL(externalModelUrl).hostname : null,
        embedCode: externalModelUrl && externalModelUrl.includes('p3d.in') ? generateP3dEmbedCode(externalModelUrl) : null,
        createdAt: new Date().toISOString(),
        status: 'ready',
        isCustomModel: true,
        fileFormat: uploadedModel ? (uploadedModel.name.endsWith('.gltf') ? 'gltf' : 'glb') : 'external'
      };

      const avatarCollection = {
        avatars: avatarData?.avatars ? [...avatarData.avatars, newAvatarData] : [newAvatarData],
        last_updated: new Date().toISOString()
      };

      if (memoriaProfileId) {
        // Store avatar data in Memoria profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          avaturn_avatars: avatarCollection
        }, memoriaProfileId);

        // Update integration status to completed for Memoria profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
          status: 'completed',
          avatar_created: true
        }, memoriaProfileId);
      } else {
        // Store avatar data in user profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          avaturn_avatars: avatarCollection
        });

        // Update integration status to completed for user profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
          status: 'completed',
          avatar_created: true
        });
      }

      setAvatarData(avatarCollection);
      setUploadStatus('success');
      setActiveTab('gallery');
      setShowGltfWarning(false);
      onAvatarCreated?.(avatarCollection);

    } catch (error) {
      console.error('Error uploading custom model:', error);
      setUploadStatus('error');
      
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError('An unexpected error occurred. Please try again.');
      }

      if (user && memoriaProfileId) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
            status: 'error'
          }, memoriaProfileId);
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      } else if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'avaturn', {
            status: 'error'
          });
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-70 p-4"
    >
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-orange-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Memorial Avatar Studio" : "Avatar Creation Studio"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'model' ? 'bg-orange-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('model')}
          >
            Upload 3D Model
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'gallery' ? 'bg-orange-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('gallery')}
          >
            Gallery ({avatarData?.avatars?.length || 0})
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'model' && (
            <div className="space-y-6">
              {/* Important Notice About File Formats */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Important: Choose the Right File Format
                </h4>
                <div className="text-white/70 text-sm space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                      <p className="font-medium text-green-400 mb-1">✅ Recommended: GLB Format</p>
                      <ul className="text-xs space-y-1">
                        <li>• Self-contained (all textures included)</li>
                        <li>• No missing file issues</li>
                        <li>• Faster loading and smaller size</li>
                        <li>• Best for web display</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                      <p className="font-medium text-yellow-400 mb-1">⚠️ GLTF Format Requirements</p>
                      <ul className="text-xs space-y-1">
                        <li>• Requires ALL associated files (.bin, textures)</li>
                        <li>• Files must be uploaded together</li>
                        <li>• Often causes loading errors</li>
                        <li>• Convert to GLB if possible</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-orange-400">
                    💡 Use <a href="https://products.aspose.app/3d/conversion/gltf-to-glb" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-300">online converters</a> or Blender to convert GLTF to GLB format.
                  </p>
                </div>
              </div>

              {/* GLTF Warning */}
              {showGltfWarning && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    GLTF File Detected - Dependencies Required
                  </h4>
                  <div className="text-white/70 text-sm space-y-2">
                    <p>This GLTF file may require additional files that are not included:</p>
                    <ul className="list-disc list-inside text-xs space-y-1 ml-4">
                      <li>Binary data files (.bin)</li>
                      <li>Texture images (.jpg, .png, .webp)</li>
                      <li>Material definition files</li>
                    </ul>
                    <p className="text-yellow-300 font-medium">
                      ⚠️ Upload may fail if these files are missing. Consider converting to GLB format instead.
                    </p>
                  </div>
                </div>
              )}

              {/* 3D Model Upload Interface */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Upload Your 3D Model</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">External 3D Model URL (Optional)</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url" 
                          placeholder="https://p3d.in/e/abc123 or other 3D model URL"
                          value={externalModelUrl}
                          onChange={(e) => setExternalModelUrl(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                        />
                        {externalModelUrl && (
                          <a 
                            href={externalModelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        Supports <a href="https://p3d.in" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">p3d.in</a>, 
                        <a href="https://sketchfab.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline"> Sketchfab</a>, 
                        and other direct model URLs
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 w-full h-0.5 bg-white/10 top-1/2 transform -translate-y-1/2"></div>
                    <div className="relative flex justify-center">
                      <span className="bg-black px-4 text-white/50 text-sm">OR</span>
                    </div>
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                    onClick={() => modelInputRef.current?.click()}
                  >
                    {uploadedModel ? (
                      <div className="space-y-4">
                        <div className="mx-auto h-40 w-40 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 relative">
                          <Cube className="w-16 h-16 text-orange-400" />
                          {uploadedModel.name.endsWith('.gltf') && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                              GLTF
                            </div>
                          )}
                          {uploadedModel.name.endsWith('.glb') && (
                            <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                              GLB
                            </div>
                          )}
                        </div>
                        <p className="text-white">{uploadedModel.name}</p>
                        <p className="text-white/60 text-sm">
                          {(uploadedModel.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            modelInputRef.current?.click();
                          }}
                          className="text-orange-400 hover:text-orange-300 underline"
                        >
                          Change Model
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Cube className="w-12 h-12 text-white/40 mx-auto" /> 
                        <div>
                          <p className="text-white text-lg mb-2">
                            {memoriaProfileId ? "Upload a 3D model of your loved one" : "Upload your 3D model file"}
                          </p>
                          <p className="text-white/60 text-sm">Click here or drag and drop a GLB/GLTF file</p>
                          <p className="text-orange-400 text-xs mt-2">Recommended: GLB format for best compatibility</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={modelInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleModelUpload}
                    className="hidden"
                  />
                </div>

                {(uploadedModel || externalModelUrl) && (
                  <div className="mt-6">
                    <button
                      onClick={uploadCustomModel} 
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {uploadStatus === 'uploading' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading Model...
                        </>
                      ) : uploadStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Upload Complete!
                        </>
                      ) : uploadStatus === 'error' ? (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          Try Again
                        </>
                      ) : (
                        <>
                          <FileUp className="w-5 h-5" />
                          {uploadedModel ? "Upload 3D Model" : "Add External Model"}
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {uploadError}
                  </div>
                )}

                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <h4 className="text-orange-400 font-medium mb-2">3D Model Guidelines:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• <strong>GLB files:</strong> Self-contained, recommended format</li>
                    <li>• <strong>GLTF files:</strong> May require additional texture/binary files</li>
                    <li>• Optimized models under 50MB work best</li>
                    <li>• Models should be in T-pose for best results</li>
                    <li>• For p3d.in models, use format: https://p3d.in/e/abc123</li>
                    <li className="text-orange-400">• External models will open in a new tab when clicked</li> 
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {avatarData?.avatars?.length > 0 ? (
                <div className="space-y-6">
                  {avatarData.avatars.map((avatar: any) => (
                    <div key={avatar.id} className="bg-white/5 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2"> 
                            {avatar.isCustomModel ? (memoriaProfileId ? 'Memorial 3D Model' : '3D Model') : (memoriaProfileId ? 'Memorial Avatar' : '3D Avatar')}
                            {avatar.fileFormat === 'gltf' && (
                              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                                GLTF
                              </span>
                            )}
                            {avatar.fileFormat === 'glb' && (
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                                GLB
                              </span>
                            )}
                          </h3>
                          <p className="text-white/60 text-sm flex items-center gap-2">
                            Created on {new Date(avatar.createdAt).toLocaleDateString()}
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this model?')) {
                                  handleDeleteModel(avatar.id);
                                }
                              }}
                              className={`ml-2 p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors ${
                                deletingModel === avatar.id ? 'opacity-50 cursor-wait' : ''
                              }`}
                              disabled={deletingModel === avatar.id}
                              title="Delete model"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            Ready
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {avatar.isCustomModel ? (
                          <>
                            <div>
                              <h4 className="text-white font-medium mb-2">3D Model</h4>
                              <div className="w-full h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 flex items-center justify-center relative">
                                <div className="text-center">
                                  <Cube className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                  <p className="text-orange-400 text-sm">{avatar.modelName}</p>
                                  {avatar.isExternal && (
                                    <p className="text-xs text-orange-300 mt-1">External Model</p>
                                  )}
                                </div>
                                {avatar.fileFormat === 'gltf' && (
                                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    GLTF
                                  </div>
                                )}
                                {avatar.fileFormat === 'glb' && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
                                    GLB
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-white font-medium mb-2">Model Details</h4>
                              <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-white/70 text-sm">
                                  <span className="text-white/50">File:</span> {avatar.modelName}
                                </p>
                                {avatar.modelSize && (
                                  <p className="text-white/70 text-sm">
                                    <span className="text-white/50">Size:</span> {(avatar.modelSize / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                )}
                                <p className="text-white/70 text-sm">
                                  <span className="text-white/50">Type:</span> {avatar.isExternal ? 'External 3D Model' : `Custom 3D Model (${avatar.fileFormat?.toUpperCase() || 'Unknown'})`}
                                </p>
                                {avatar.externalSource && (
                                  <p className="text-white/70 text-sm">
                                    <span className="text-white/50">Source:</span> {avatar.externalSource}
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h4 className="text-white font-medium mb-2">Source Photo</h4>
                              <img 
                                src={avatar.sourcePhoto} 
                                alt="Source" 
                                className="w-full h-32 object-cover rounded-lg border border-white/20"
                              />
                            </div>
                            
                            <div>
                              <h4 className="text-white font-medium mb-2">3D Avatar</h4>
                              <div className="w-full h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 flex items-center justify-center">
                                <div className="text-center">
                                  <User className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                  <p className="text-orange-400 text-sm">3D Avatar Ready</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        {avatar.isCustomModel ? (
                          <a
                            href={avatar.isExternal ? avatar.modelUrl : avatar.modelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {avatar.isExternal ? 'View Model' : 'Download Model'}
                          </a>
                        ) : (
                          <a
                            href={avatar.avaturnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View in Avaturn
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {memoriaProfileId ? "No Memorial Avatars Created" : "No Avatars Created"}
                  </h3>
                  <p className="text-white/60 mb-6">Upload a 3D model to get started.</p>
                  <button
                    onClick={() => setActiveTab('model')}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Upload 3D Model
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}