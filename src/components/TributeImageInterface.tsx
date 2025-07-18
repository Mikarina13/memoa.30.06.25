import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Image as ImageIcon, Sparkles, Download, Trash2, ExternalLink, Wand2, Grid3X3, X, ArrowUpRight, Video } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface TributeImageInterfaceProps {
  memoriaProfileId?: string;
  onImagesGenerated?: (portraitData: any) => void;
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
    name: 'DALL·E',
    url: 'https://openai.com/dall-e-3',
    description: 'OpenAI\'s advanced image generation model',
    logo: 'https://images.pexels.com/photos/5717641/pexels-photo-5717641.jpeg?auto=compress&cs=tinysrgb&w=1600'
  },
  {
    name: 'Midjourney',
    url: 'https://www.midjourney.com',
    description: 'Powerful AI for artistic image and image-to-video generation',
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

export function TributeImageInterface({ memoriaProfileId, onClose, onImagesGenerated }: TributeImageInterfaceProps) {
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
    } else if (user) {
      // For memoir, just load images
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
        // Load from Memoria profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        
        if (profile?.profile_data?.tribute_images) {
          setGeneratedPortraits(profile.profile_data.tribute_images || []);
        }
      } else {
        // Load from memoir data for personal tributes
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        
        if (profile?.memoir_data?.tribute_images) {
          setGeneratedPortraits(profile.memoir_data.tribute_images || []);
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
        updatedPrompt = updatedPrompt.replace('[PERSON_NAME]', memoriaProfileId ? 'your loved one' : 'yourself');
      }
      setPrompt(updatedPrompt);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    try {
      setGenerateStatus('uploading');
      
      const newImages = [];
      
      for (const file of Array.from(files)) {
        const newImage = {
          id: `tribute-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          url: '', // Will be set after upload
          title: `AI Tribute ${file.type.startsWith('video/') ? 'Video' : 'Image'} - ${memoriaProfileId ? personName : 'Self'}`,
          tribute: true,
          isTribute: true,
          type: 'tribute',
          style: selectedStyle || 'custom',
          prompt: prompt,
          createdAt: new Date().toISOString(),
          isVideo: file.type.startsWith('video/'),
          tags: ['tribute', 'ai-generated', 'custom', file.type.startsWith('video/') ? 'video' : 'image']
        };
        
        // Upload the file to storage
        const filePath = await MemoirIntegrations.uploadGalleryFile(user.id, file, memoriaProfileId);
        
        // Set the URL after upload
        newImage.url = filePath;
        
        // Create a gallery item entry
        await MemoirIntegrations.createGalleryItem({
          user_id: user.id,
          title: `${memoriaProfileId ? personName : 'Self'} Tribute ${file.type.startsWith('video/') ? 'Video' : 'Image'}`,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          metadata: {
            tribute: true,
            isTribute: true,
            style: selectedStyle || 'custom',
            prompt: prompt,
            memoriaProfileId: memoriaProfileId || null,
            isVideo: file.type.startsWith('video/'),
            folder: 'Tribute Images'
          },
          tags: ['tribute', 'ai-generated', 'custom', file.type.startsWith('video/') ? 'video' : 'image']
        }, memoriaProfileId);
        
        newImages.push(newImage);
      }
      
      // Add new images to state
      const updatedImages = [...generatedPortraits, ...newImages];
      setGeneratedPortraits(updatedImages);
      
      // Store updated images in the profile
      if (memoriaProfileId) {
        // Store in Memoria profile
        await MemoirIntegrations.updateMemoirData(user.id, {
          tribute_images: updatedImages
        }, memoriaProfileId);
      } else {
        // Store in user's Memoir profile
        await MemoirIntegrations.updateMemoirData(user.id, {
          tribute_images: updatedImages
        });
      }
      
      // Switch to the gallery tab
      setActiveTab('gallery');
      
      // Notify parent component if callback is provided
      if (onImagesGenerated) {
        onImagesGenerated(updatedImages);
      }
      
      setGenerateStatus('success');
    } catch (error) {
      console.error('Error uploading tribute image:', error);
      setGenerateStatus('error');
      setGenerateError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.');
    } finally {
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      if (!user) return;
      
      // Filter out the deleted image
      const updatedImages = generatedPortraits.filter(img => img.id !== imageId);
      setGeneratedPortraits(updatedImages);
      
      // Update the profile data
      if (memoriaProfileId) {
        // Update Memoria profile
        await MemoirIntegrations.updateMemoirData(user.id, {
          tribute_images: updatedImages
        }, memoriaProfileId);
      } else {
        // Update Memoir profile
        await MemoirIntegrations.updateMemoirData(user.id, {
          tribute_images: updatedImages
        });
      }
      
    } catch (error) {
      console.error('Error deleting tribute image:', error);
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
            <Sparkles className="w-8 h-8 text-amber-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">AI Tribute Image Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white/70 mb-6">
          Create beautiful AI-generated artistic interpretations {memoriaProfileId ? "of your loved one" : "of yourself"} in different styles.
        </p>

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'upload' ? 'bg-amber-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('upload')}
          >
            Generate AI Images
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'gallery' ? 'bg-amber-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('gallery')}
          >
            My Tribute Gallery
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://openai.com/dall-e-3', '_blank', 'noopener,noreferrer');
                }}
                className="bg-black/40 border border-white/10 rounded-lg overflow-hidden hover:bg-black/60 transition-colors cursor-pointer"
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src="https://images.pexels.com/photos/5717641/pexels-photo-5717641.jpeg?auto=compress&cs=tinysrgb&w=1600" 
                      alt="DALL·E" 
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <h3 className="text-lg font-medium text-white flex items-center gap-1">
                      DALL·E <ArrowUpRight className="w-4 h-4 text-white/60" />
                    </h3>
                  </div>
                  <p className="text-white/70 text-sm mb-3">OpenAI's advanced image generation model</p>
                  <p className="text-white/60 text-xs">
                    Generate realistic images from text prompts with photorealistic quality.
                  </p>
                </div>
              </a>
              
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
                  <p className="text-white/70 text-sm mb-3">Powerful AI for artistic image and image-to-video generation</p>
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
                    <p className="text-white/70 text-sm mb-2">{style.prompt.replace('[PERSON_NAME]', memoriaProfileId ? 'your loved one' : 'yourself')}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(style.prompt.replace('[PERSON_NAME]', memoriaProfileId ? 'your loved one' : 'yourself'));
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
            <div className="bg-black/40 border border-amber-500/20 rounded-lg">
              <h3 className="text-xl font-medium text-white mb-3 flex items-center gap-2 p-4 pb-0">
                <Upload className="w-6 h-6 text-amber-400" />
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
                className="border-2 border-dashed border-amber-500/30 rounded-lg p-12 cursor-pointer hover:bg-amber-500/5 transition-colors m-4 hover:scale-[1.02] transform duration-200"
              >
                <div className="flex justify-center gap-6 mb-6">
                  <ImageIcon className="w-20 h-20 text-amber-400/70" />
                  <Video className="w-20 h-20 text-amber-400/70" />
                </div>
                <div className="text-center">
                  <p className="text-white text-2xl mb-4 font-bold">Click to upload</p>
                  <p className="text-white/80 text-lg mb-2">Upload images from Midjourney or videos from Sora</p>
                  <p className="text-amber-400/90 text-md">Drag and drop files here or click to browse</p>
                </div>
              </div>
              
              {/* Error Display */}
              {generateStatus === 'error' && (
                <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 mb-2 font-medium">Upload Error</p>
                  <p className="text-white/70">{generateError || "There was an error uploading your file. Please try again."}</p>
                </div>
              )}
              
              {/* Success Display */}
              {generateStatus === 'success' && (
                <div className="m-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-medium flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Upload Successful!
                  </p>
                  <p className="text-white/70 mt-1">Your AI generated content has been uploaded.</p>
                </div>
              )}
              
              {/* Loading Display */}
              {generateStatus === 'uploading' && (
                <div className="m-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-blue-400">Uploading your content...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              My Tribute Gallery
            </h3>
            
            {generatedPortraits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedPortraits.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group relative cursor-pointer"
                  >
                    {item.isVideo ? (
                      <div className="w-full h-48 relative bg-black/50">
                        <video 
                          src={item.url}
                          className="w-full h-48 object-cover opacity-70"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-12 h-12 text-white/60" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt="Tribute Image" 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          // Fallback for broken images
                          e.currentTarget.src = "https://images.pexels.com/photos/4439425/pexels-photo-4439425.jpeg";
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="w-full">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              {item.isVideo ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
                              {item.isVideo ? 'Video' : 'Image'} Tribute
                            </div>
                            <div className="text-xs text-white/50">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={item.url} 
                              download 
                              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 text-white" />
                            </a>
                            <button 
                              onClick={() => handleDeleteImage(item.id)}
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
                  <Video className="w-12 h-12 text-white/20" />
                  <h4 className="text-xl font-medium text-white mb-2">No Tribute Images Yet</h4>
                  <p className="text-white/60 mb-6">
                    Select a style and create your first tribute image to see it here.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors"
                   >
                     Upload Tribute Content
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