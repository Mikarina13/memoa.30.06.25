import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Image,
  Video,
  FileText,
  Volume2,
  Cuboid as Cube,
  Upload,
  User,
  Brain,
  Heart,
  Gamepad2,
  Globe,
  Mic,
  ExternalLink,
  Film
} from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';
import { ProfileSummaryDisplay } from './ProfileSummaryDisplay';

interface GalleryItem {
  id: string;
  media_type: string;
  title: string;
  file_path: string;
  file_size?: number;
}

interface Narrative {
  id: string;
  type: string;
  typeLabel: string;
  content: string;
}

interface VoiceInfo {
  voiceId: string;
  status: string;
}

interface AvatarInfo {
  id: string;
  modelUrl?: string;
  avaturnUrl?: string;
  isCustomModel?: boolean;
  modelName?: string;
  createdAt: string;
}

interface PersonalData {
  [key: string]: unknown;
}

export interface PreloadedData {
  galleryItems?: GalleryItem[];
  narratives?: Narrative[];
  voiceData?: VoiceInfo | null;
  avatars?: AvatarInfo[];
  personalData?: PersonalData | null;
  aiInsights?: Record<string, unknown> | null;
}

interface AssetLibraryProps {
  userAssets: GalleryItem[];
  onUploadAsset: (file: File, type: string) => void;
  onSelectAsset?: (asset: unknown) => void;
  onClose: () => void;
  preloadedData?: PreloadedData;
}

export function AssetLibrary({
  userAssets,
  onUploadAsset,
  onSelectAsset,
  onClose,
  preloadedData
}: AssetLibraryProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('uploads');
  const [isLoading, setIsLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(preloadedData?.galleryItems || []);
  const [narratives, setNarratives] = useState<Narrative[]>(preloadedData?.narratives || []);
  const [voiceData, setVoiceData] = useState<VoiceInfo | null>(preloadedData?.voiceData || null);
  const [avatars, setAvatars] = useState<AvatarInfo[]>(preloadedData?.avatars || []);
  const [personalData, setPersonalData] = useState<PersonalData | null>(preloadedData?.personalData || null);
  const [aiInsights, setAiInsights] = useState<Record<string, unknown> | null>(preloadedData?.aiInsights || null);
  
  useEffect(() => {
    if (!user) return;

    if (preloadedData) {
      switch (activeTab) {
        case 'gallery':
          setGalleryItems(preloadedData.galleryItems || []);
          break;
        case 'narratives':
          setNarratives(preloadedData.narratives || []);
          setAiInsights(preloadedData.aiInsights || null);
          break;
        case 'voice':
          setVoiceData(preloadedData.voiceData || null);
          break;
        case 'models':
          setAvatars(preloadedData.avatars || []);
          break;
        case 'personal':
          setPersonalData(preloadedData.personalData || null);
          break;
      }
      setIsLoading(false);
    } else {
      loadUserContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, preloadedData]);

  const loadUserContent = async () => {
    try {
      setIsLoading(true);
      
      // Load content based on active tab
      if (activeTab === 'gallery') {
        let items = await MemoirIntegrations.getGalleryItems(user.id);
        
        // Filter out AI tribute images from gallery display
        items = items.filter(item => {
          // More thorough check for tribute images
          if (!item.metadata) return true;
          
          // Check multiple possible tribute indicators
          const isTribute = 
            item.metadata.tribute === true || 
            item.metadata.isTribute === true ||
            (item.metadata.type === 'tribute') ||
            (item.tags && item.tags.includes('tribute')) ||
            (item.folder === 'Tribute Images') ||
            (item.title && item.title.toLowerCase().includes('tribute'));
          
          return !isTribute;
        });
        
        setGalleryItems(items || []);
      } 
      else if (activeTab === 'narratives') {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        
        if (profile?.memoir_data?.narratives) {
          const narrativeData = profile.memoir_data.narratives;
          const processedNarratives: Narrative[] = [];
          
          // Process all narrative types
          const narrativeTypes = [
            { key: 'personal_stories', label: 'Personal Story' },
            { key: 'memories', label: 'Memory' },
            { key: 'values', label: 'Core Value' },
            { key: 'wisdom', label: 'Wisdom' },
            { key: 'reflections', label: 'Reflection' }
          ];
          
          narrativeTypes.forEach(({ key, label }) => {
            if (narrativeData[key]) {
              processedNarratives.push(
                ...narrativeData[key].map((item: Record<string, unknown>) => ({
                  ...item,
                  type: key,
                  typeLabel: label
                }))
              );
            }
          });
          
          setNarratives(processedNarratives);
          
          // Also load AI insights if available
          if (narrativeData.ai_insights) {
            setAiInsights(narrativeData.ai_insights);
          }
        }
      }
      else if (activeTab === 'voice') {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.elevenlabs_voice_id) {
          setVoiceData({
            voiceId: profile.elevenlabs_voice_id,
            status: profile.integration_status?.elevenlabs?.status || 'not_started'
          });
        }
      }
      else if (activeTab === 'models') {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.memoir_data?.avaturn_avatars?.avatars) {
          setAvatars(profile.memoir_data.avaturn_avatars.avatars);
        }
      }
      else if (activeTab === 'personal') {
        const personalPrefs = await MemoirIntegrations.getPersonalPreferences(user.id);
        setPersonalData(personalPrefs);
      }
    } catch (error) {
      console.error('Error loading user content:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' :
                   file.type.startsWith('audio/') ? 'audio' : 'model';
      onUploadAsset(file, type);
    }
    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSelectAsset = (asset: unknown) => {
    if (onSelectAsset) {
      onSelectAsset(asset);
    }
  };

  const getNarrativeTypeIcon = (type: string) => {
    switch (type) {
      case 'personal_stories':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'memories':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'values':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'wisdom':
        return <Brain className="w-4 h-4 text-emerald-400" />;
      case 'reflections':
        return <Brain className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 border border-white/20 rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Asset Library</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'uploads' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Uploads</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'gallery' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Gallery</span>
          </button>
          
          <button
            onClick={() => setActiveTab('narratives')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'narratives' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Narratives</span>
          </button>
          
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'voice' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice</span>
          </button>
          
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'models' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Cube className="w-4 h-4" />
            <span>3D Models</span>
          </button>
          
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'personal' 
                ? 'bg-pink-500 text-white' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Personal</span>
          </button>
        </div>
        
        {/* Content Area */}
        <div>
          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <div className="space-y-6">
              <div className="mb-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Upload Asset
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf,image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userAssets.map((asset) => (
                  <div 
                    key={asset.id} 
                    className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSelectAsset(asset)}
                  >
                    <div className="w-full h-20 bg-white/10 rounded mb-2 flex items-center justify-center">
                      {asset.asset_type === 'image' && <Image className="w-8 h-8 text-white/60" />}
                      {asset.asset_type === 'video' && <Video className="w-8 h-8 text-white/60" />}
                      {asset.asset_type === 'audio' && <Volume2 className="w-8 h-8 text-white/60" />}
                      {asset.asset_type === 'model' && <Cube className="w-8 h-8 text-white/60" />}
                    </div>
                    <h4 className="text-white text-sm font-medium truncate">{asset.asset_name}</h4>
                    <p className="text-white/60 text-xs">{asset.asset_type}</p>
                  </div>
                ))}
                
                {userAssets.length === 0 && (
                  <div className="col-span-4 text-center py-8">
                    <p className="text-white/60">No assets uploaded yet. Click "Upload Asset" to add files.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading gallery items...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSelectAsset({
                        ...item,
                        asset_type: item.media_type === 'image' ? 'image' : 'video',
                        asset_name: item.title,
                        file_path: item.file_path
                      })}
                    >
                      {item.media_type === 'image' ? (
                        <div className="relative">
                          <img 
                            src={item.file_path} 
                            alt={item.title}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative h-32 bg-black/50 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white/60" />
                        </div>
                      )}
                      
                      <div className="p-3">
                        <h4 className="text-white text-sm font-medium truncate">{item.title}</h4>
                        <p className="text-white/60 text-xs">{formatFileSize(item.file_size)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {galleryItems.length === 0 && (
                    <div className="col-span-4 text-center py-8">
                      <p className="text-white/60">No gallery items found. Upload photos and videos in the Gallery section of MEMOIR.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Narratives Tab */}
          {activeTab === 'narratives' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading narratives...</p>
                </div>
              ) : (
                <>
                  {/* AI Insights */}
                  {aiInsights && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-lg p-4 border border-purple-500/30 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-400" />
                        <h3 className="text-white font-medium">AI Insights</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-purple-400 text-sm mb-1">Personality Traits</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiInsights.personality_traits.map((trait: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-emerald-400 text-sm mb-1">Core Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiInsights.core_themes.map((theme: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-blue-400 text-sm mb-1">Writing Style</h4>
                        <p className="text-white/70 text-xs">{aiInsights.writing_style}</p>
                      </div>
                      
                      <button
                        onClick={() => handleSelectAsset({
                          id: 'ai-insights',
                          asset_type: 'ai_insights',
                          asset_name: 'AI Personality Insights',
                          content: aiInsights
                        })}
                        className="mt-3 w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                      >
                        Use AI Insights in Memorial Space
                      </button>
                    </div>
                  )}
                
                  <div className="space-y-3">
                    {narratives.map((narrative) => (
                      <div 
                        key={narrative.id || narrative.timestamp} 
                        className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => handleSelectAsset({
                          ...narrative,
                          asset_type: 'narrative',
                          asset_name: narrative.title
                        })}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getNarrativeTypeIcon(narrative.type)}
                          <h4 className="text-white text-sm font-medium">{narrative.title}</h4>
                          <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                            {narrative.typeLabel}
                          </span>
                        </div>
                        <p className="text-white/70 text-xs line-clamp-2">{narrative.content}</p>
                      </div>
                    ))}
                    
                    {narratives.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-white/60">No narratives found. Create narratives in the Narrative Studio of MEMOIR.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading voice data...</p>
                </div>
              ) : (
                <div>
                  {voiceData ? (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Volume2 className="w-6 h-6 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">ElevenLabs Voice Clone</h3>
                      </div>
                      
                      <div className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium">Voice ID</h4>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            Active
                          </span>
                        </div>
                        <p className="text-white/70 text-sm font-mono">{voiceData.voiceId}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => handleSelectAsset({
                            id: voiceData.voiceId,
                            asset_type: 'voice',
                            asset_name: 'ElevenLabs Voice Clone',
                            voice_id: voiceData.voiceId
                          })}
                          className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Mic className="w-5 h-5" />
                          Use Voice in Memorial Space
                        </button>
                        
                        <a
                          href="https://elevenlabs.io/app/voice-lab"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Manage in ElevenLabs
                        </a>
                      </div>
                      
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-blue-400 font-medium mb-2">Voice Features:</h4>
                        <ul className="text-white/70 text-sm space-y-1">
                          <li>• Create text-to-speech audio with your voice</li>
                          <li>• Add voice narration to memory points</li>
                          <li>• Generate welcome messages for your memorial space</li>
                          <li>• Create guided tours with your voice</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <Volume2 className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Voice Clone Found</h3>
                      <p className="text-white/60 mb-6">Clone your voice in the Voice Studio of MEMOIR first.</p>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        Go to MEMOIR Dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* 3D Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-orange-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading 3D models...</p>
                </div>
              ) : (
                <div>
                  {avatars && avatars.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {avatars.map((avatar) => (
                        <div 
                          key={avatar.id} 
                          className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => handleSelectAsset({
                            ...avatar,
                            asset_type: 'model',
                            asset_name: avatar.isCustomModel ? avatar.modelName : '3D Avatar',
                            file_path: avatar.modelUrl || avatar.avaturnUrl
                          })}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {avatar.isCustomModel ? (
                              <Cube className="w-5 h-5 text-orange-400" />
                            ) : (
                              <User className="w-5 h-5 text-orange-400" />
                            )}
                            <h4 className="text-white font-medium">
                              {avatar.isCustomModel ? avatar.modelName : '3D Avatar'}
                            </h4>
                          </div>
                          
                          <div className="w-full h-32 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg border border-orange-500/30 flex items-center justify-center">
                            {avatar.isCustomModel ? (
                              <Cube className="w-10 h-10 text-orange-400" />
                            ) : (
                              <User className="w-10 h-10 text-orange-400" />
                            )}
                          </div>
                          
                          <p className="text-white/60 text-xs mt-2">
                            Created on {new Date(avatar.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <User className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No 3D Models Found</h3>
                      <p className="text-white/60 mb-6">Create 3D avatars in the Avatar Creation Studio of MEMOIR first.</p>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                      >
                        Go to MEMOIR Dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-pink-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading personal data...</p>
                </div>
              ) : (
                <div>
                  {personalData ? (
                    <div className="bg-white/5 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-6 h-6 text-pink-400" />
                        <h3 className="text-lg font-semibold text-white">Personal Preferences</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-4 h-4 text-pink-400" />
                            <h4 className="text-white font-medium">Favorite Songs</h4>
                          </div>
                          <p className="text-white/70 text-sm">
                            {personalData.favorite_songs?.length || 0} songs saved
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Film className="w-4 h-4 text-blue-400" />
                            <h4 className="text-white font-medium">Favorite Movies</h4>
                          </div>
                          <p className="text-white/70 text-sm">
                            {personalData.favorite_movies?.length || 0} movies saved
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-purple-400" />
                            <h4 className="text-white font-medium">Digital Presence</h4>
                          </div>
                          <p className="text-white/70 text-sm">
                            {personalData.digital_presence?.length || 0} links saved
                          </p>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Gamepad2 className="w-4 h-4 text-cyan-400" />
                            <h4 className="text-white font-medium">Gaming Preferences</h4>
                          </div>
                          <p className="text-white/70 text-sm">
                            {personalData.gaming_preferences?.length || 0} games saved
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSelectAsset({
                          id: 'personal-preferences',
                          asset_type: 'profile_summary',
                          asset_name: 'Personal Preferences',
                          content: personalData
                        })}
                        className="w-full px-4 py-3 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Heart className="w-5 h-5" />
                        Use Profile Summary in Memorial Space
                      </button>
                      
                      <div className="mt-4 bg-white/5 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <ProfileSummaryDisplay userId={user.id} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <Heart className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No Personal Preferences Found</h3>
                      <p className="text-white/60 mb-6">Add your personal preferences in the MEMOIR dashboard first.</p>
                      <button
                        onClick={onClose}
                        className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                      >
                        Go to MEMOIR Dashboard
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}