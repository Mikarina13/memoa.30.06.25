import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image as ImageIcon, Sparkles, Download, Trash2, ExternalLink, CheckCircle, AlertCircle, Wand2, Grid3X3 } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface GeneratedPortrait {
  id: string;
  name: string;
  sourceImage: string;
  generatedImages: string[];
  style: string;
  timestamp: Date;
}

interface PortraitGenerationInterfaceProps {
  memoriaProfileId?: string;
  onPortraitsGenerated?: (portraitData: any) => void;
  onClose?: () => void;
}

export function PortraitGenerationInterface({ memoriaProfileId, onPortraitsGenerated, onClose }: PortraitGenerationInterfaceProps) {
  const { user } = useAuth();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [generatedPortraits, setGeneratedPortraits] = useState<GeneratedPortrait[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'uploading' | 'generating' | 'success' | 'error'>('idle');
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'gallery'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const portraitStyles = [
    { id: 'realistic', label: 'Realistic', description: 'Photorealistic portraits' },
    { id: 'artistic', label: 'Artistic', description: 'Artistic interpretation' },
    { id: 'vintage', label: 'Vintage', description: 'Classic vintage style' },
    { id: 'professional', label: 'Professional', description: 'Professional headshot style' },
    { id: 'casual', label: 'Casual', description: 'Casual everyday look' },
    { id: 'formal', label: 'Formal', description: 'Formal portrait style' }
  ];

  useEffect(() => {
    if (user) {
      loadExistingPortraits();
    }
  }, [user]);

  const loadExistingPortraits = async () => {
    try {
      if (memoriaProfileId) {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        if (profile?.profile_data?.portraits) {
          setGeneratedPortraits(profile.profile_data.portraits.generated || []);
        }
      } else {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.memoir_data?.portraits) {
          setGeneratedPortraits(profile.memoir_data.portraits.generated || []);
        }
      }
    } catch (error) {
      console.error('Error loading portraits:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSourceImageFile(file);
      const url = URL.createObjectURL(file);
      setSourceImage(url);
      setActiveTab('generate');
    } else {
      alert('Please select a valid image file.');
    }
    event.target.value = '';
  };

  const openAffiliatePrompt = () => {
    setShowAffiliatePrompt(true);
  };

  const generatePortraits = async () => {
    if (!user || !sourceImageFile) return;

    // Check if we have AI generation capabilities
    const hasAIAccess = import.meta.env.VITE_PORTRAIT_AI_KEY; // Placeholder for AI service
    
    if (!hasAIAccess) {
      setShowAffiliatePrompt(true);
      return;
    }

    setGenerateStatus('generating');
    setGenerateError(null);

    try {
      if (memoriaProfileId) {
        // Update integration status to in_progress for Memoria profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
          status: 'in_progress'
        }, memoriaProfileId);
      } else {
        // Update integration status to in_progress for user profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
          status: 'in_progress'
        });
      }

      setGenerateStatus('generating');

      // Mock AI portrait generation (in real implementation, this would call AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock portrait URLs (in real implementation, these would be actual generated images)
      const mockGeneratedImages = [
        'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400'
      ];

      const newPortrait: GeneratedPortrait = {
        id: `portrait-${Date.now()}`,
        name: `${selectedStyle} Portrait Set`,
        sourceImage: sourceImage!,
        generatedImages: mockGeneratedImages,
        style: selectedStyle,
        timestamp: new Date()
      };

      setGeneratedPortraits(prev => [...prev, newPortrait]);
      
      // Store portraits in memoir data
      const portraitData = {
        generated: [...generatedPortraits, newPortrait],
        last_updated: new Date().toISOString()
      };

      if (memoriaProfileId) {
        // Store portraits in Memoria profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          portraits: portraitData
        }, memoriaProfileId);

        // Update integration status to completed for Memoria profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
          status: 'completed',
          portraits_generated: true
        }, memoriaProfileId);
      } else {
        // Store portraits in user profile data
        await MemoirIntegrations.updateMemoirData(user.id, {
          portraits: portraitData
        });

        // Update integration status to completed for user profile
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
          status: 'completed',
          portraits_generated: true
        });
      }

      setGenerateStatus('success');
      setActiveTab('gallery');
      onPortraitsGenerated?.(portraitData);

    } catch (error) {
      console.error('Error generating portraits:', error);
      setGenerateStatus('error');
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          setGenerateError('AI generation quota exceeded. Please try again later.');
        } else {
          setGenerateError(error.message);
        }
      } else {
        setGenerateError('An unexpected error occurred. Please try again.');
      }

      // Update integration status to error
      if (user && memoriaProfileId) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
            status: 'error'
          }, memoriaProfileId);
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      } else if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'portrait_generation', {
            status: 'error'
          });
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  const deletePortraitSet = (portraitId: string) => {
    setGeneratedPortraits(prev => prev.filter(p => p.id !== portraitId));
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    a.click();
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
            <Wand2 className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Memorial Portrait Studio" : "Portrait Generation Studio"}
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
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'upload' ? 'bg-purple-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Photo
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'generate' ? 'bg-purple-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('generate')}
            disabled={!sourceImage}
          >
            Generate Portraits
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'gallery' ? 'bg-purple-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('gallery')}
          >
            Portrait Gallery ({generatedPortraits.length})
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Upload Interface */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {memoriaProfileId ? "Upload Photo of Your Loved One" : "Upload Source Photo"}
                </h3>
                
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {sourceImage ? (
                      <div className="space-y-4">
                        <img 
                          src={sourceImage} 
                          alt="Source" 
                          className="mx-auto h-40 w-40 object-cover rounded-lg border border-white/20"
                        />
                        <p className="text-white">Source photo uploaded successfully</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="text-purple-400 hover:text-purple-300 underline"
                        >
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 text-white/40 mx-auto" />
                        <div>
                          <p className="text-white text-lg mb-2">
                            {memoriaProfileId 
                              ? "Upload a clear photo of your loved one" 
                              : "Upload a clear photo of yourself"}
                          </p>
                          <p className="text-white/60 text-sm">Click here or drag and drop an image file</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-400 font-medium mb-2">Photo Guidelines:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Use a high-resolution, clear photo (minimum 512x512px)</li>
                    <li>• Ensure the face is well-lit and clearly visible</li>
                    <li>• Avoid sunglasses or face obstructions</li>
                    <li>• Front-facing photos work best for generation</li>
                    <li>• Single person photos produce better results</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Style Selection */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Choose Portrait Style</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portraitStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        selectedStyle === style.id
                          ? 'bg-purple-500/20 border border-purple-500/50'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <div className="font-medium text-white mb-1">{style.label}</div>
                      <div className="text-sm text-white/60">{style.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Preview */}
              {sourceImage && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Source Photo Preview</h3>
                  <div className="flex justify-center">
                    <img 
                      src={sourceImage} 
                      alt="Source" 
                      className="h-48 w-48 object-cover rounded-lg border border-white/20"
                    />
                  </div>
                </div>
              )}

              {/* Generation Controls */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">AI Portrait Generation</h3>
                </div>
                
                <p className="text-white/70 mb-4">
                  Generate multiple AI portraits in the selected style. This will create 4 unique variations based on your source photo.
                </p>

                {generateError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {generateError}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={generatePortraits}
                    disabled={!sourceImage || generateStatus === 'generating'}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {generateStatus === 'generating' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : generateStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Generated!
                      </>
                    ) : generateStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Try Again
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Generate Portraits
                      </>
                    )}
                  </button>

                  <button
                    onClick={openAffiliatePrompt}
                    className="flex items-center gap-2 px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get AI Access
                  </button>
                </div>

                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-400 font-medium mb-2">Portrait Generation Features:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Generate 4 unique portrait variations</li>
                    <li>• Multiple artistic styles available</li>
                    <li>• High-resolution output (1024x1024)</li>
                    <li>• Preserve facial features and characteristics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {generatedPortraits.length > 0 ? (
                <div className="space-y-6">
                  {generatedPortraits.map((portraitSet) => (
                    <div key={portraitSet.id} className="bg-white/5 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{portraitSet.name}</h3>
                          <p className="text-white/60 text-sm">
                            Generated on {portraitSet.timestamp.toLocaleDateString()} • {portraitSet.style} style
                          </p>
                        </div>
                        <button
                          onClick={() => deletePortraitSet(portraitSet.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="relative">
                          <img 
                            src={portraitSet.sourceImage} 
                            alt="Source" 
                            className="w-full h-32 object-cover rounded-lg border-2 border-blue-500/50"
                          />
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Source
                          </div>
                        </div>
                        
                        {portraitSet.generatedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={image} 
                              alt={`Generated ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border border-white/20"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <button
                                onClick={() => downloadImage(image, `portrait-${portraitSet.id}-${index + 1}.jpg`)}
                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                              >
                                <Download className="w-4 h-4 text-white" />
                              </button>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Grid3X3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Portraits Generated</h3>
                  <p className="text-white/60 mb-6">Upload a photo and generate AI portraits to see them here.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    Start Creating
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Affiliate Prompt Modal */}
      <AnimatePresence>
        {showAffiliatePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex items-center justify-center z-80"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-purple-500/30 rounded-xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Get AI Portrait Generation</h3>
              <p className="text-white/70 mb-6">
                To generate AI portraits, you'll need access to advanced AI image generation services. Create stunning portrait variations with professional quality.
              </p>
              
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
                <div className="text-purple-400 font-medium">AI Generation Features:</div>
                <ul className="text-white/70 text-sm mt-2 space-y-1">
                  <li>• Multiple artistic styles</li>
                  <li>• High-resolution outputs</li>
                  <li>• Facial feature preservation</li>
                  <li>• Professional quality results</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.open('https://openai.com/dall-e-3', '_blank')}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors"
                >
                  Learn More
                </button>
                <button
                  onClick={() => setShowAffiliatePrompt(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}