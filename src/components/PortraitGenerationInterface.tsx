import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Image as ImageIcon, Sparkles, Download, Trash2, ExternalLink, CheckCircle, AlertCircle, Wand2, Grid3X3, X, ArrowUpRight } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface PortraitGenerationInterfaceProps {
  memoriaProfileId?: string;
  onPortraitsGenerated?: (portraitData: any) => void;
  onClose?: () => void;
}

// Define artistic style options with prompts
const artisticStyles = [
  {
    id: 'portrait',
    name: 'Portrait',
    icon: <Camera className="w-6 h-6 text-blue-400" />,
    description: 'Realistic portrait in photographic style',
    prompt: 'Ultra-realistic portrait of [PERSON_NAME], photorealistic, stunning detail, perfect lighting, 8k, award-winning photography, cinematic',
    examples: ['https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=1600']
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    icon: <Wand2 className="w-6 h-6 text-emerald-400" />,
    description: 'Classic oil painting in renaissance style',
    prompt: 'Renaissance oil painting portrait of [PERSON_NAME], by Rembrandt, detailed brush strokes, warm lighting, masterpiece, museum quality',
    examples: ['https://images.pexels.com/photos/1918290/pexels-photo-1918290.jpeg?auto=compress&cs=tinysrgb&w=1600']
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    icon: <Wand2 className="w-6 h-6 text-indigo-400" />,
    description: 'Soft, flowing watercolor portrait',
    prompt: 'Watercolor portrait of [PERSON_NAME], soft colors, flowing paint, artistic, serene atmosphere, delicate brush strokes',
    examples: ['https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?auto=compress&cs=tinysrgb&w=1600']
  },
  {
    id: 'sculpture',
    name: 'Sculpture',
    icon: <Wand2 className="w-6 h-6 text-stone-400" />,
    description: 'Marble sculpture like classical art',
    prompt: 'Marble sculpture bust of [PERSON_NAME], classical style, museum lighting, highly detailed, reminiscent of Michelangelo, white marble',
    examples: ['https://images.pexels.com/photos/134402/pexels-photo-134402.jpeg?auto=compress&cs=tinysrgb&w=1600']
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    icon: <Wand2 className="w-6 h-6 text-amber-400" />,
    description: 'Luminous stained glass artwork',
    prompt: 'Stained glass portrait of [PERSON_NAME], vibrant colors, backlit, cathedral style, intricate lead work, spiritual, radiant',
    examples: ['https://images.pexels.com/photos/1837432/pexels-photo-1837432.jpeg?auto=compress&cs=tinysrgb&w=1600']
  },
  {
    id: 'historical',
    name: 'Historical',
    icon: <Wand2 className="w-6 h-6 text-purple-400" />,
    description: 'Old-time historical photography',
    prompt: 'Historical photograph of [PERSON_NAME], vintage daguerreotype, sepia tones, 1800s style portrait, antique photo, period-authentic',
    examples: ['https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=1600']
  }
];

// AI services we recommend for image generation
const aiServices = [
  {
    name: 'Midjourney',
    url: 'https://www.midjourney.com',
    description: 'Powerful AI for artistic image generation',
    logo: 'https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    name: 'Sora',
    url: 'https://openai.com/sora',
    description: 'OpenAI\'s text-to-video and image-to-video AI model',
    logo: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    name: 'Remini',
    url: 'https://remini.ai/',
    description: 'Mobile app for enhancing and restoring photos',
    logo: 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1600'
  }
];

export function PortraitGenerationInterface({ memoriaProfileId, onPortraitsGenerated, onClose }: PortraitGenerationInterfaceProps) {
  const { user } = useAuth();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [generatedPortraits, setGeneratedPortraits] = useState<GeneratedPortrait[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generateStatus, setGenerateStatus] = useState<'idle' | 'uploading' | 'generating' | 'success' | 'error'>('idle');
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'gallery'>('upload');
  const [personName, setPersonName] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && memoriaProfileId) {
      // Load profile info to get the person's name
      loadProfileInfo();
      // Load any previously saved generated images
      loadSavedImages();
    }
  }, [user, memoriaProfileId]);

  const loadProfileInfo = async () => {
    try {
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
      if (profile) {
        setPersonName(profile.name || '');
      }
    } catch (error) {
      console.error('Error loading profile info:', error);
    }
  };

  const loadSavedImages = async () => {
    try {
      setGenerateStatus('idle');
      
      if (memoriaProfileId) {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        
        if (profile?.profile_data?.tribute_images) {
          setGeneratedPortraits(profile.profile_data.tribute_images || []);
        }
      }
    } catch (error) {
      console.error('Error loading tribute images:', error);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    
    // Find the selected style
    const style = artisticStyles.find(s => s.id === styleId);
    if (style) {
      // Replace [PERSON_NAME] with the actual person's name
      let updatedPrompt = style.prompt;
      if (personName && personName.trim() !== '') {
        updatedPrompt = updatedPrompt.replace('[PERSON_NAME]', personName);
      } else {
        updatedPrompt = updatedPrompt.replace('[PERSON_NAME]', 'your loved one');
      }
      setPrompt(updatedPrompt);
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

      // Mock AI portrait generation (in real implementation, this would call AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate mock portrait URLs (in real implementation, these would be actual generated images)
      const mockGeneratedImages = [
        'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=400',
        'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400'
      ];

      const newPortrait = {
        id: `portrait-${Date.now()}`,
        name: `${selectedStyle} Portrait Set`,
        sourceImage: sourceImage!,
        generatedImages: mockGeneratedImages,
        style: selectedStyle,
        timestamp: new Date(),
        prompt: prompt
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
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white/70 mb-6">
          Create beautiful AI-generated artistic interpretations of your loved one in different styles.
        </p>

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

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://www.midjourney.com', '_blank', 'noopener,noreferrer');
                }}
                className="bg-black/40 border border-white/10 rounded-lg overflow-hidden hover:bg-black/60 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src="https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                      alt="Midjourney" 
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <h3 className="text-lg font-medium text-white flex items-center gap-1">
                      Midjourney <ArrowUpRight className="w-4 h-4 text-white/60" />
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm mb-3">Powerful AI for artistic image generation</p>
                  <p className="text-white/60 text-xs">
                    Create stunning AI-generated images with artistic styles and photorealistic quality.
                  </p>
                </div>
              </a>
              
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://openai.com/sora', '_blank', 'noopener,noreferrer');
                }}
                className="bg-black/40 border border-white/10 rounded-lg overflow-hidden hover:bg-black/60 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src="https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                      alt="Sora" 
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <h3 className="text-lg font-medium text-white flex items-center gap-1">
                      Sora <ArrowUpRight className="w-4 h-4 text-white/60" />
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm mb-3">OpenAI's text-to-video and image-to-video AI model</p>
                  <p className="text-white/60 text-xs">
                    Generate realistic videos from text prompts or transform images into videos.
                  </p>
                </div>
              </a>
              
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://remini.ai/', '_blank', 'noopener,noreferrer');
                }}
                className="bg-black/40 border border-white/10 rounded-lg overflow-hidden hover:bg-black/60 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src="https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                      alt="Remini" 
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <h3 className="text-lg font-medium text-white flex items-center gap-1">
                      Remini <ArrowUpRight className="w-4 h-4 text-white/60" />
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm mb-3">Mobile app for enhancing and restoring photos</p>
                  <p className="text-white/60 text-xs">
                    Enhance old photos and create AI portraits with amazing quality.
                  </p>
                </div>
              </a>
            </div>

            {/* Sample Prompts Section */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2 pb-2 border-b border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Sample Prompts
              </h3>
              
              <div className="space-y-3">
                {artisticStyles.map(style => (
                  <div key={style.id} className="bg-black/40 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      {style.icon}
                      <h4 className="text-white font-medium">{style.name}</h4>
                    </div>
                    <p className="text-white/70 text-sm mb-2">{style.prompt.replace('[PERSON_NAME]', 'your loved one')}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(style.prompt.replace('[PERSON_NAME]', 'your loved one'));
                        // Show temporary success message
                        const button = document.getElementById(`copy-button-${style.id}`);
                        if (button) {
                          const originalText = button.innerText;
                          button.innerText = 'Copied!';
                          button.classList.add('bg-green-500/20', 'text-green-400');
                          button.classList.remove('bg-amber-500/20', 'text-amber-400');
                          setTimeout(() => {
                            button.innerText = originalText;
                            button.classList.remove('bg-green-500/20', 'text-green-400');
                            button.classList.add('bg-amber-500/20', 'text-amber-400');
                          }, 2000);
                        }
                      }}
                      id={`copy-button-${style.id}`}
                      className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors flex items-center gap-1 w-fit"
                    >
                      <Trash2 className="w-3 h-3" />
                      Copy Prompt
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-black/40 border border-amber-500/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Upload Generated Content
              </h3>
              
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleImageUpload}
                multiple
              />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-500/30 rounded-lg p-8 cursor-pointer hover:bg-amber-500/5 transition-colors"
              >
                <div className="flex justify-center gap-4 mb-4">
                  <ImageIcon className="w-8 h-8 text-amber-400/70" />
                  <Video className="w-8 h-8 text-amber-400/70" />
                </div>
                <div className="text-center">
                  <p className="text-white text-lg mb-2">Click to upload</p>
                  <p className="text-white/60 text-sm">Upload images from Midjourney or videos from Sora</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Style Selection */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Portrait Style</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artisticStyles.map((style) => (
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
                  disabled={!sourceImage || !selectedStyle || generateStatus === 'generating'}
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

                <div className="flex flex-wrap gap-2">
                  <a 
                    href="https://www.midjourney.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Midjourney
                  </a>
                  <a 
                    href="https://openai.com/sora" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Sora
                  </a>
                  <a 
                    href="https://remini.ai/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Remini
                  </a>
                </div>
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
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Portrait Gallery
            </h3>
            
            {generatedPortraits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedPortraits.map((content) => (
                  <div key={content.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group relative">
                    <img 
                      src={content.sourceImage} 
                      alt="Source" 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="w-full">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-amber-400" />
                              Portrait Set
                            </div>
                            <div className="text-xs text-white/50">
                              {new Date(content.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={content.generatedImages[0]} 
                              download 
                              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 text-white" />
                            </a>
                            <button 
                              onClick={() => deletePortraitSet(content.id)}
                              className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Grid3X3 className="w-12 h-12 text-white/20" />
                  <h4 className="text-xl font-medium text-white mb-2">No Portraits Generated Yet</h4>
                  <p className="text-white/60 mb-6">
                    Select a style and upload a photo to generate portraits.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors"
                   >
                     Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface GeneratedPortrait {
  id: string;
  name: string;
  sourceImage: string;
  generatedImages: string[];
  style: string;
  timestamp: string | Date;
  prompt?: string;
}