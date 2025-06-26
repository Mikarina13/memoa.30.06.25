import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Film, BookOpen, Quote, Globe, Plus, Trash2, Save, Upload, Download, ExternalLink, CheckCircle, Gamepad2, Utensils } from 'lucide-react';
import { MemoirIntegrations, DigitalPresenceEntry, GameEntry } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface PersonalPreferencesInterfaceProps {
  memoriaProfileId?: string;
  onPreferencesSaved?: (preferencesData: any) => void;
  onClose?: () => void;
  initialTab?: 'favorites' | 'digital'; // New prop
}

const GAMING_PLATFORMS = [
  'PC (Steam)',
  'PC (Epic Games)',
  'PC (Origin)',
  'PlayStation 5',
  'PlayStation 4',
  'Xbox Series X/S',
  'Xbox One',
  'Nintendo Switch',
  'Mobile (iOS)',
  'Mobile (Android)',
  'VR (Meta Quest)',
  'VR (Steam VR)',
  'Browser Game',
  'Other'
];

const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook', 'Instagram', 'Twitter (X)', 'LinkedIn', 'YouTube', 'TikTok',
  'Pinterest', 'Snapchat', 'Reddit', 'Discord', 'Twitch', 'Spotify',
  'WhatsApp', 'Telegram', 'Viber', 'WeChat', 'Line', 'Tumblr', 'Flickr',
  'Vimeo', 'SoundCloud', 'Bandcamp', 'Behance', 'Dribbble', 'GitHub',
  'Stack Overflow', 'Medium', 'Substack', 'OnlyFans', 'Patreon', 'Etsy',
  'Shopify Store', 'Personal Website', 'Blog', 'Portfolio', 'Other'
];

interface PersonalPreferences {
  favorite_songs: string[];
  favorite_locations: string[];
  favorite_movies: string[];
  favorite_books: string[];
  favorite_quotes: string[];
  favorite_foods: string[];
  favorite_signature_dishes: string[];
  digital_presence: DigitalPresenceEntry[];
  gaming_preferences: GameEntry[];
}

export function PersonalPreferencesInterface({ memoriaProfileId, onPreferencesSaved, onClose, initialTab = 'favorites' }: PersonalPreferencesInterfaceProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PersonalPreferences>({
    favorite_songs: [],
    favorite_locations: [],
    favorite_movies: [],
    favorite_books: [],
    favorite_quotes: [],
    favorite_foods: [],
    favorite_signature_dishes: [],
    digital_presence: [],
    gaming_preferences: []
  });
  
  const [newItems, setNewItems] = useState({
    song: '',
    location: '',
    movie: '',
    book: '',
    quote: '',
    food: '',
    signatureDish: '',
    digitalPresenceName: '',
    digitalPresenceUrl: '',
    gameName: '',
    gamePlatform: 'PC (Steam)',
    gameInviteLink: '',
    gameInviteCode: '',
    gameNotes: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favorites' | 'digital'>(initialTab);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save timer
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadExistingPreferences();
    }
  }, [user, memoriaProfileId]);

  // Set initial tab on mount or when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && autoSaveEnabled && user) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save after 2 seconds of inactivity
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSavePreferences(true); // true indicates auto-save
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [preferences, hasUnsavedChanges, autoSaveEnabled, user, memoriaProfileId]);

  const loadExistingPreferences = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading personal preferences for user:`, user.id, memoriaProfileId ? `(Memoria profile: ${memoriaProfileId})` : '(MEMOIR)');
      
      let personalData;
      
      if (memoriaProfileId) {
        // Use the right method for Memoria profile
        personalData = await MemoirIntegrations.getPersonalPreferences(user.id, memoriaProfileId);
      } else {
        // Use the right method for Memoir profile
        personalData = await MemoirIntegrations.getPersonalPreferences(user.id);
      }
      
      console.log(`Loaded personal preferences:`, personalData);
      
      if (personalData) {
        setPreferences({
          favorite_songs: personalData.favorite_songs || [],
          favorite_locations: personalData.favorite_locations || [],
          favorite_movies: personalData.favorite_movies || [],
          favorite_books: personalData.favorite_books || [],
          favorite_quotes: personalData.favorite_quotes || [],
          favorite_foods: personalData.favorite_foods || [],
          favorite_signature_dishes: personalData.favorite_signature_dishes || [],
          digital_presence: personalData.digital_presence || [],
          gaming_preferences: personalData.gaming_preferences || []
        });
      }
      
      // If data is still missing, try recovery
      if (!personalData || 
          (!personalData.favorite_foods && !personalData.favorite_signature_dishes)) {
        console.log('Attempting to recover missing personal preferences data...');
        const recoveredData = await MemoirIntegrations.recoverData(
          user.id, 
          'preferences.personal', 
          memoriaProfileId
        );
        
        if (recoveredData) {
          console.log('Recovered personal preferences:', recoveredData);
          setPreferences(prev => ({
            ...prev,
            favorite_songs: recoveredData.favorite_songs || prev.favorite_songs,
            favorite_locations: recoveredData.favorite_locations || prev.favorite_locations,
            favorite_movies: recoveredData.favorite_movies || prev.favorite_movies,
            favorite_books: recoveredData.favorite_books || prev.favorite_books,
            favorite_quotes: recoveredData.favorite_quotes || prev.favorite_quotes,
            favorite_foods: recoveredData.favorite_foods || prev.favorite_foods,
            favorite_signature_dishes: recoveredData.favorite_signature_dishes || prev.favorite_signature_dishes,
            digital_presence: recoveredData.digital_presence || prev.digital_presence,
            gaming_preferences: recoveredData.gaming_preferences || prev.gaming_preferences
          }));
        }
      }
    } catch (error) {
      console.error(`Error loading personal preferences:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = (category: keyof PersonalPreferences, value: string | DigitalPresenceEntry, inputKey?: string) => {
    if (!value) return;

    setPreferences(prev => ({
      ...prev,
      [category]: [...prev[category], value]
    }));

    setHasUnsavedChanges(true);

    // Clear the input using the provided inputKey
    if (category === 'digital_presence') {
      setNewItems(prev => ({
        ...prev,
        digitalPresenceName: '',
        digitalPresenceUrl: ''
      }));
    } else if (category === 'gaming_preferences') {
      setNewItems(prev => ({
        ...prev,
        gameName: '',
        gamePlatform: 'PC (Steam)',
        gameInviteLink: '',
        gameInviteCode: '',
        gameNotes: ''
      }));
    } else if (inputKey) {
      setNewItems(prev => ({
        ...prev,
        [inputKey]: ''
      }));
    }
  };

  const removeItem = (category: keyof PersonalPreferences, index: number) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  const addDigitalPresence = () => {
    if (!newItems.digitalPresenceName.trim() || !newItems.digitalPresenceUrl.trim()) {
      alert('Please enter both name and URL');
      return;
    }

    const digitalPresenceEntry: DigitalPresenceEntry = {
      id: `digital-${Date.now()}`,
      name: newItems.digitalPresenceName.trim(),
      url: newItems.digitalPresenceUrl.trim(),
      timestamp: new Date().toISOString()
    };

    addItem('digital_presence', digitalPresenceEntry);
  };

  const addGamingPreference = () => {
    if (!newItems.gameName.trim()) {
      alert('Please enter a game name');
      return;
    }

    const gameEntry: GameEntry = {
      id: `game-${Date.now()}`,
      name: newItems.gameName.trim(),
      platform: newItems.gamePlatform,
      invite_link: newItems.gameInviteLink?.trim() || '',
      invite_code: newItems.gameInviteCode?.trim() || '',
      notes: newItems.gameNotes?.trim() || '',
      favorite: false,
      timestamp: new Date().toISOString()
    };

    addItem('gaming_preferences', gameEntry);
  };

  const toggleGameFavorite = (gameId: string) => {
    setPreferences(prev => ({
      ...prev,
      gaming_preferences: prev.gaming_preferences.map(game => 
        game.id === gameId ? { ...game, favorite: !game.favorite } : game
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePreferences = async (isAutoSave: boolean = false) => {
    if (!user) return;

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const context = memoriaProfileId ? 'Memoria' : 'MEMOIR';
      console.log(`Saving ${context} personal preferences:`, preferences);
      
      const personalData = await MemoirIntegrations.storePersonalPreferences(user.id, preferences, memoriaProfileId);
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      onPreferencesSaved?.(personalData);

      if (!isAutoSave) {
        // Show success message for manual saves
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        // Quick reset for auto-saves
        setTimeout(() => {
          setSaveStatus('idle');
        }, 1000);
      }
    } catch (error) {
      console.error(`Error saving ${context} personal preferences:`, error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const exportPreferences = () => {
    const data = {
      preferences: preferences,
      context: context,
      exportDate: new Date().toISOString(),
      user: user.email,
      totalItems: Object.values(preferences).reduce((acc, arr) => acc + arr.length, 0)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-preferences-${memoriaProfileId ? 'memoria' : 'memoir'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.preferences) {
            setPreferences(prev => ({
              favorite_songs: [...prev.favorite_songs, ...(data.preferences.favorite_songs || [])],
              favorite_locations: [...prev.favorite_locations, ...(data.preferences.favorite_locations || [])],
              favorite_movies: [...prev.favorite_movies, ...(data.preferences.favorite_movies || [])],
              favorite_books: [...prev.favorite_books, ...(data.preferences.favorite_books || [])],
              favorite_quotes: [...prev.favorite_quotes, ...(data.preferences.favorite_quotes || [])],
              favorite_foods: [...prev.favorite_foods, ...(data.preferences.favorite_foods || [])],
              favorite_signature_dishes: [...prev.favorite_signature_dishes, ...(data.preferences.favorite_signature_dishes || [])],
              digital_presence: [...prev.digital_presence, ...(data.preferences.digital_presence || [])],
              gaming_preferences: [...prev.gaming_preferences, ...(data.preferences.gaming_preferences || [])]
            }));
            setHasUnsavedChanges(true);
          }
        } catch (error) {
          alert('Invalid file format. Please upload a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const preferenceCategories = [
    { id: 'favorite_songs', label: 'Favorite Songs', icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-500/30', inputKey: 'song' },
    { id: 'favorite_foods', label: 'Favorite Foods', icon: Utensils, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30', inputKey: 'food' },
    { id: 'favorite_signature_dishes', label: 'Signature Dishes', icon: Utensils, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30', inputKey: 'signatureDish' },
    { id: 'favorite_locations', label: 'Favorite Locations', icon: MapPin, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', inputKey: 'location' },
    { id: 'favorite_movies', label: 'Favorite Movies', icon: Film, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30', inputKey: 'movie' },
    { id: 'favorite_books', label: 'Favorite Books', icon: BookOpen, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30', inputKey: 'book' },
    { id: 'favorite_quotes', label: 'Favorite Quotes', icon: Quote, color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/30', inputKey: 'quote' },
    { id: 'gaming_preferences', label: 'Gaming Preferences', icon: Gamepad2, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-500/30', inputKey: 'gameName' }
  ];

  const totalItems = Object.values(preferences).reduce((acc, arr) => acc + arr.length, 0);

  // Dynamic title based on whether this is for Memoria or Memoir
  const title = memoriaProfileId ? 'Personal Favorites of Your Loved One' : 'Personal Preferences';
  const context = memoriaProfileId ? 'Memoria' : 'MEMOIR';

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <div className="bg-black/90 border border-white/20 rounded-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your preferences...</p>
        </div>
      </motion.div>
    );
  }

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
            <Heart className="w-8 h-8 text-pink-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">{title}</h2>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Unsaved changes
              </div>
            )}
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Context Indicator */}
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${memoriaProfileId ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
            <span className="text-white/80 text-sm font-medium">
              {memoriaProfileId ? 'Memoria Mode' : 'MEMOIR Mode'}
            </span>
            <span className="text-white/60 text-sm">
              - {memoriaProfileId ? 'Preserving your loved one\'s favorites' : 'Recording your personal preferences'}
            </span>
          </div>
        </div>

        {/* Auto-save Toggle */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-white font-medium">Auto-save</h3>
              <p className="text-white/60 text-sm">Automatically save changes as you make them</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
          </label>
        </div>

        {/* Stats Overview */}
        {totalItems > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-pink-400 font-medium">Total Items</span>
              </div>
              <div className="text-2xl font-bold text-white">{totalItems}</div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Film className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">Media</span>
              </div>
              <div className="text-2xl font-bold text-white">{preferences.favorite_songs.length + preferences.favorite_movies.length}</div>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Literature</span>
              </div>
              <div className="text-2xl font-bold text-white">{preferences.favorite_books.length + preferences.favorite_quotes.length}</div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-purple-400" />
                <span className="text-purple-400 font-medium">Digital</span>
              </div>
              <div className="text-2xl font-bold text-white">{preferences.digital_presence.length}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'favorites' ? 'bg-pink-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('favorites')}
          >
            Personal Favorites
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'digital' ? 'bg-purple-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('digital')}
          >
            Digital Presence
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'favorites' && (
            <div className="space-y-6">
              {preferenceCategories.map((category) => {
                const Icon = category.icon;
                const items = preferences[category.id as keyof PersonalPreferences] as string[];
                const inputValue = newItems[category.inputKey as keyof typeof newItems] as string;
                
                return (
                  <div key={category.id} className={`${category.bgColor} rounded-lg p-6 border ${category.borderColor}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      <h3 className="text-lg font-semibold text-white">{category.label}</h3>
                      <span className="text-sm px-2 py-1 bg-white/10 rounded-full text-white/60">
                        {items.length} items
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {category.id === 'gaming_preferences' ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-white/60 mb-2">Game Name *</label>
                              <input
                                type="text"
                                placeholder="Enter game name"
                                value={newItems.gameName}
                                onChange={(e) => setNewItems(prev => ({ ...prev, gameName: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-white/60 mb-2">Platform</label>
                              <select
                                value={newItems.gamePlatform}
                                onChange={(e) => setNewItems(prev => ({ ...prev, gamePlatform: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-white/40"
                              >
                                {GAMING_PLATFORMS.map(platform => (
                                  <option key={platform} value={platform} className="bg-black">
                                    {platform}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm text-white/60 mb-2">Invite Link</label>
                              <input
                                type="url"
                                placeholder="Discord server, Steam group, etc."
                                value={newItems.gameInviteLink}
                                onChange={(e) => setNewItems(prev => ({ ...prev, gameInviteLink: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-white/60 mb-2">Friend Code / Invite Code</label>
                              <input
                                type="text"
                                placeholder="Friend code, lobby code, etc."
                                value={newItems.gameInviteCode}
                                onChange={(e) => setNewItems(prev => ({ ...prev, gameInviteCode: e.target.value }))}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm text-white/60 mb-2">Notes</label>
                            <textarea
                              placeholder="Add any notes about when you play, preferred game modes, etc."
                              value={newItems.gameNotes}
                              onChange={(e) => setNewItems(prev => ({ ...prev, gameNotes: e.target.value }))}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 h-20 resize-none"
                            />
                          </div>
                          
                          <button
                            onClick={addGamingPreference}
                            className={`px-4 py-2 ${category.bgColor} ${category.color} rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2`}
                          >
                            <Plus className="w-4 h-4" />
                            Add Game
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={`Add a ${category.label.toLowerCase().slice(9)}`}
                            value={inputValue}
                            onChange={(e) => setNewItems(prev => ({ ...prev, [category.inputKey]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addItem(category.id as keyof PersonalPreferences, inputValue, category.inputKey);
                              }
                            }}
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                          />
                          <button
                            onClick={() => addItem(category.id as keyof PersonalPreferences, inputValue, category.inputKey)}
                            className={`px-4 py-2 ${category.bgColor} ${category.color} rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2`}
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      )}
                      
                      {items.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {category.id === 'gaming_preferences' ? (
                            (preferences.gaming_preferences as GameEntry[]).map((game, index) => (
                              <div key={game.id} className="bg-white/5 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-medium text-white">{game.name}</h4>
                                      <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                                        {game.platform}
                                      </span>
                                      {game.favorite && (
                                        <Heart className="w-4 h-4 text-pink-400 fill-current" />
                                      )}
                                    </div>
                                    
                                    {(game.invite_link || game.invite_code) && (
                                      <div className="space-y-1 mb-2">
                                        {game.invite_link && (
                                          <div className="flex items-center gap-2">
                                            <ExternalLink className="w-3 h-3 text-blue-400" />
                                            <a
                                              href={game.invite_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 text-sm underline"
                                            >
                                              Invite Link
                                            </a>
                                          </div>
                                        )}
                                        {game.invite_code && (
                                          <div className="text-white/70 text-sm">
                                            <span className="text-white/50">Code:</span> {game.invite_code}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {game.notes && (
                                      <p className="text-white/70 text-sm mb-2">{game.notes}</p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() => toggleGameFavorite(game.id)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        game.favorite 
                                          ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' 
                                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                                      }`}
                                    >
                                      <Heart className={`w-4 h-4 ${game.favorite ? 'fill-current' : ''}`} />
                                    </button>
                                    
                                    <button
                                      onClick={() => removeItem(category.id as keyof PersonalPreferences, index)}
                                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                <span className="text-white flex-1">{item}</span>
                                <button
                                  onClick={() => removeItem(category.id as keyof PersonalPreferences, index)}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'digital' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Digital Presence</h3>
                <span className="text-sm px-2 py-1 bg-white/10 rounded-full text-white/60">
                  {preferences.digital_presence.length} links
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Platform name (e.g., Facebook, LinkedIn)"
                    value={newItems.digitalPresenceName}
                    onChange={(e) => setNewItems(prev => ({ ...prev, digitalPresenceName: e.target.value }))}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    list="social-media-platforms" // Add datalist attribute
                  />
                  <datalist id="social-media-platforms">
                    {SOCIAL_MEDIA_PLATFORMS.map(platform => (
                      <option key={platform} value={platform} />
                    ))}
                  </datalist>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newItems.digitalPresenceUrl}
                    onChange={(e) => setNewItems(prev => ({ ...prev, digitalPresenceUrl: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addDigitalPresence();
                      }
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>
                
                <button
                  onClick={addDigitalPresence}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
                
                {preferences.digital_presence.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {preferences.digital_presence.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-white font-medium">{item.name}</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Visit
                          </a>
                        </div>
                        <button
                          onClick={() => removeItem('digital_presence', index)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Save & Import/Export */}
          <div className="bg-white/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Actions</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer transition-colors hover:bg-blue-500/30">
                  <Upload className="w-4 h-4" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPreferences}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={exportPreferences}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <button
                  onClick={() => handleSavePreferences(false)}
                  disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {saveError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {saveError}
              </div>
            )}

            <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
              <h4 className="text-pink-400 font-medium mb-2">
                {memoriaProfileId ? 'Memoria Legacy Benefits:' : 'Legacy Benefits:'}
              </h4>
              <ul className="text-white/70 text-sm space-y-1">
                {memoriaProfileId ? (
                  <>
                    <li>• Preserve their favorite foods, entertainment and inspirations</li>
                    <li>• Document their gaming communities and favorite games</li>
                    <li>• Honor their meaningful quotes and philosophies</li>
                    <li>• Help others understand what brought them joy</li>
                    <li>• Create lasting connections through shared memories</li>
                  </>
                ) : (
                  <>
                    <li>• Share your favorite foods, entertainment with loved ones</li>
                    <li>• Preserve gaming communities and invite links</li>
                    <li>• Preserve meaningful quotes and philosophies</li>
                    <li>• Help others discover what inspired you</li>
                    <li>• Create connections through shared interests</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}