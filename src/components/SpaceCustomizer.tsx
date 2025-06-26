import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Move, Maximize, Save, Layout, SlidersHorizontal as SliderHorizontal, Undo, CheckCircle, Settings, Download, Upload, AlertCircle, X, Eye, EyeOff, Share2 } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

export interface SpaceCustomizationSettings {
  itemSizeMultiplier: number;
  itemDistanceFromCenter: number;
  verticalSpread: number;
  rotationSpeed: number;
  autoRotate: boolean;
  colorTheme: string;
  backgroundIntensity: number;
  iconScale: number;
  itemColorOverrides: Record<string, string>;
  itemVisible: Record<string, boolean>;
  itemPositionOverrides: Record<string, [number, number, number]>;
  particleDensity: number;
  particleSize: number;
  particleSpeed: number;
}

interface SpaceCustomizerProps {
  settings: SpaceCustomizationSettings;
  onSettingsChange: (settings: SpaceCustomizationSettings) => void;
  onSave: () => void;
  memoriaProfileId?: string;
  profileType: 'memoir' | 'memoria';
}

const DEFAULT_SETTINGS: SpaceCustomizationSettings = {
  itemSizeMultiplier: 1,
  itemDistanceFromCenter: 10,
  verticalSpread: 2,
  rotationSpeed: 0.02,
  autoRotate: false,
  colorTheme: 'cosmos',
  backgroundIntensity: 0.5,
  iconScale: 1,
  itemColorOverrides: {},
  itemVisible: {},
  itemPositionOverrides: {},
  particleDensity: 1,
  particleSize: 1,
  particleSpeed: 1
};

const COLOR_THEMES = [
  { id: 'cosmos', name: 'Cosmic Nebula', description: 'Deep blues and purples with star accents' },
  { id: 'sunset', name: 'Digital Sunset', description: 'Warm oranges and pinks with horizon glow' },
  { id: 'emerald', name: 'Emerald Matrix', description: 'Vibrant greens and teals with data streams' },
  { id: 'neon', name: 'Neon Dreams', description: 'Bright cyberpunk aesthetic with glowing outlines' },
  { id: 'minimal', name: 'Minimal Elegance', description: 'Clean whites and grays with subtle highlights' },
  { id: 'midnight', name: 'Midnight Memory', description: 'Dark blues with memory-like light traces' },
];

export function SpaceCustomizer({ 
  settings, 
  onSettingsChange, 
  onSave, 
  memoriaProfileId,
  profileType
}: SpaceCustomizerProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'layout' | 'appearance' | 'items'>('layout');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [presets, setPresets] = useState<{id: string, name: string, settings: SpaceCustomizationSettings}[]>([
    { id: 'default', name: 'Default', settings: DEFAULT_SETTINGS },
    { id: 'spread', name: 'Spread Out', settings: {...DEFAULT_SETTINGS, itemDistanceFromCenter: 15, verticalSpread: 4} },
    { id: 'compact', name: 'Compact', settings: {...DEFAULT_SETTINGS, itemDistanceFromCenter: 7, iconScale: 0.8} },
  ]);

  const itemTypes = useMemo(() => [
    { id: 'personal_favorites', name: 'Personal Favorites', color: '#ec4899' },
    { id: 'digital_presence', name: 'Digital Presence', color: '#a855f7' },
    { id: 'gaming_preferences', name: 'Gaming Preferences', color: '#06b6d4' },
    { id: 'voice', name: 'Voice Clone', color: '#3b82f6' },
    { id: 'tavus_avatar', name: 'Video Avatar', color: '#8b5cf6' },
    { id: 'avaturn_avatars', name: '3D Avatars', color: '#f97316' },
    { id: 'narratives', name: 'Narratives', color: '#10b981' },
    { id: 'gallery', name: 'Gallery', color: '#ec4899' },
    { id: 'personality', name: 'Personality', color: '#f43f5e' },
    { id: 'family_tree', name: 'Family Tree', color: '#22c55e' },
    { id: 'ai_tribute_images', name: 'AI Tributes', color: '#f59e0b' },
    { id: 'media_links', name: 'Media Links', color: '#f59e0b' },
    { id: 'documents', name: 'Documents', color: '#3b82f6' }
  ], []);

  // Reset save status after a delay
  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'error') {
      const timer = setTimeout(() => {
        setSaveStatus('idle');
        if (saveStatus === 'error') {
          setSaveError(null);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all customizations to default?')) {
      onSettingsChange(DEFAULT_SETTINGS);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onSettingsChange(preset.settings);
    }
  };

  const saveAsPreset = () => {
    const name = prompt('Enter a name for this preset:');
    if (name) {
      const newPreset = {
        id: `preset-${Date.now()}`,
        name,
        settings: {...settings}
      };
      
      setPresets(prev => [...prev, newPreset]);
      
      // Also save to user profile data
      savePresetToProfile(newPreset);
    }
  };

  const savePresetToProfile = async (preset: {id: string, name: string, settings: SpaceCustomizationSettings}) => {
    if (!user) return;
    
    try {
      // Get current memoir data
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
      
      // Determine which data object to update
      const dataObject = memoriaProfileId ? profile?.profile_data : profile?.memoir_data;
      
      if (!dataObject) return;
      
      // Update space_customization within the appropriate data object
      const spaceCustomization = dataObject.space_customization || {};
      const presets = spaceCustomization.presets || [];
      
      // Add new preset
      const updatedPresets = [...presets.filter((p: any) => p.id !== preset.id), preset];
      
      // Update memoir data
      const updatedData = {
        ...dataObject,
        space_customization: {
          ...spaceCustomization,
          presets: updatedPresets
        }
      };
      
      // Save to profile
      if (memoriaProfileId) {
        await MemoirIntegrations.updateMemoirData(user.id, updatedData, memoriaProfileId);
      } else {
        await MemoirIntegrations.updateMemoirData(user.id, updatedData);
      }
      
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  };

  const saveCustomizationSettings = async () => {
    if (!user) return;
    
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      // Get current memoir data
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
      
      // Determine which data object to update
      const dataObject = memoriaProfileId ? profile?.profile_data : profile?.memoir_data;
      
      if (!dataObject) {
        throw new Error('Profile data not found');
      }
      
      // Update space_customization within the appropriate data object
      const updatedData = {
        ...dataObject,
        space_customization: {
          ...dataObject.space_customization,
          settings,
          last_updated: new Date().toISOString()
        }
      };
      
      // Save to profile
      if (memoriaProfileId) {
        await MemoirIntegrations.updateMemoirData(user.id, updatedData, memoriaProfileId);
      } else {
        await MemoirIntegrations.updateMemoirData(user.id, updatedData);
      }
      
      setSaveStatus('success');
      onSave();
      
    } catch (error) {
      console.error('Error saving customization settings:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const exportSettings = () => {
    const data = {
      settings,
      exportedAt: new Date().toISOString(),
      type: profileType,
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoa-${profileType}-space-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data?.settings) {
          onSettingsChange(data.settings);
          alert('Settings imported successfully!');
        } else {
          alert('Invalid settings file format');
        }
      } catch (error) {
        alert('Failed to parse settings file');
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const updateItemColor = (itemId: string, color: string) => {
    onSettingsChange({
      ...settings,
      itemColorOverrides: {
        ...settings.itemColorOverrides,
        [itemId]: color
      }
    });
  };

  const toggleItemVisibility = (itemId: string) => {
    onSettingsChange({
      ...settings,
      itemVisible: {
        ...settings.itemVisible,
        [itemId]: !(settings.itemVisible[itemId] ?? true)
      }
    });
  };

  const getItemColor = (itemId: string, defaultColor: string): string => {
    return settings.itemColorOverrides[itemId] || defaultColor;
  };

  const isItemVisible = (itemId: string): boolean => {
    return settings.itemVisible[itemId] !== false; // Default to true if not set
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-20 right-4 z-40">
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsCollapsed(false)}
          className="p-3 bg-black/70 backdrop-blur-sm text-white rounded-full border border-white/20 shadow-lg hover:bg-black/90 transition-colors"
          title="Show Customizer"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-20 right-4 z-40 w-72 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-white font-bold font-[Orbitron]">Space Customizer</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-4 border border-white/10">
          <button
            className={`flex-1 py-2 text-center transition-colors text-sm ${
              activeTab === 'layout' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-black/30 text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('layout')}
          >
            <Layout className="w-4 h-4 mx-auto mb-1" />
            Layout
          </button>
          <button
            className={`flex-1 py-2 text-center transition-colors text-sm ${
              activeTab === 'appearance' ? 'bg-pink-500/30 text-pink-300' : 'bg-black/30 text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette className="w-4 h-4 mx-auto mb-1" />
            Style
          </button>
          <button
            className={`flex-1 py-2 text-center transition-colors text-sm ${
              activeTab === 'items' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-black/30 text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('items')}
          >
            <Maximize className="w-4 h-4 mx-auto mb-1" />
            Items
          </button>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 pb-1">
          {/* Layout Tab */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Distance from Center</span>
                  <span className="text-indigo-300">{settings.itemDistanceFromCenter.toFixed(1)}</span>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="20" 
                  step="0.5" 
                  value={settings.itemDistanceFromCenter} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    itemDistanceFromCenter: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Vertical Spread</span>
                  <span className="text-indigo-300">{settings.verticalSpread.toFixed(1)}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="6" 
                  step="0.5" 
                  value={settings.verticalSpread} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    verticalSpread: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Rotation Speed</span>
                  <span className="text-indigo-300">{settings.rotationSpeed.toFixed(2)}</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="0.1" 
                  step="0.01" 
                  value={settings.rotationSpeed} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    rotationSpeed: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white/80 text-sm">Auto-rotate Items</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.autoRotate}
                    onChange={(e) => onSettingsChange({
                      ...settings, 
                      autoRotate: e.target.checked
                    })}
                  />
                  <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Particle Density</span>
                  <span className="text-indigo-300">{settings.particleDensity.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2" 
                  step="0.1" 
                  value={settings.particleDensity} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    particleDensity: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <p className="text-white/50 text-xs">Affects star particle density in the background</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Particle Speed</span>
                  <span className="text-indigo-300">{settings.particleSpeed.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min="0.2" 
                  max="2" 
                  step="0.1" 
                  value={settings.particleSpeed} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    particleSpeed: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="pt-2">
                <label className="text-white/80 text-sm block mb-2">Preset Layouts</label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map(preset => (
                    <button 
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className="px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm"
                    >
                      {preset.name}
                    </button>
                  ))}
                  
                  <button 
                    onClick={saveAsPreset}
                    className="px-3 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    Save Current
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-white/80 text-sm">Color Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onSettingsChange({...settings, colorTheme: theme.id})}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        settings.colorTheme === theme.id 
                          ? 'bg-pink-500/30 text-pink-300 ring-1 ring-pink-400'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Background Intensity</span>
                  <span className="text-pink-300">{(settings.backgroundIntensity * 100).toFixed(0)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1" 
                  step="0.05" 
                  value={settings.backgroundIntensity} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    backgroundIntensity: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Icon Size</span>
                  <span className="text-pink-300">{settings.iconScale.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={settings.iconScale} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    iconScale: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Item Size</span>
                  <span className="text-pink-300">{settings.itemSizeMultiplier.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={settings.itemSizeMultiplier} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    itemSizeMultiplier: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-white/80 text-sm flex justify-between">
                  <span>Particle Size</span>
                  <span className="text-pink-300">{settings.particleSize.toFixed(1)}x</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.1" 
                  value={settings.particleSize} 
                  onChange={(e) => onSettingsChange({
                    ...settings, 
                    particleSize: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  onClick={resetToDefaults}
                  className="w-full px-3 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Undo className="w-4 h-4" />
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}
          
          {/* Items Tab */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <p className="text-white/60 text-xs mb-2">Customize visibility and colors for each item</p>
              
              {itemTypes.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: getItemColor(item.id, item.color) }}></div>
                    <span className="text-white/80 text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItemVisibility(item.id)}
                      className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      title={isItemVisible(item.id) ? 'Hide' : 'Show'}
                    >
                      {isItemVisible(item.id) ? (
                        <Eye className="w-3.5 h-3.5 text-white/70" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-white/40" />
                      )}
                    </button>
                    
                    <input
                      type="color"
                      value={getItemColor(item.id, item.color)}
                      onChange={(e) => updateItemColor(item.id, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer"
                      title="Change color"
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-emerald-300 text-xs mb-2">Tips:</p>
                <ul className="text-white/60 text-xs space-y-1">
                  <li>• Click the eye icon to toggle visibility</li>
                  <li>• Click the color box to customize colors</li>
                  <li>• Items will appear when added to your profile</li>
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 space-y-2">
          <button
            onClick={saveCustomizationSettings}
            disabled={saveStatus === 'saving'}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saveStatus === 'saving' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={exportSettings}
              className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            
            <label className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>
          </div>
        </div>
        
        {saveError && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}