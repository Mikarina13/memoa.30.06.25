import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Plus, Trash2, Heart, ExternalLink, Save, Upload, Download, Star } from 'lucide-react';
import { MemoirIntegrations, GameEntry } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface GamingPreferencesInterfaceProps {
  memoriaProfileId?: string;
  onGamesStored?: (gamingData: any) => void;
  onClose?: () => void;
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

export function GamingPreferencesInterface({ memoriaProfileId, onClose, onGamesStored }: GamingPreferencesInterfaceProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<GameEntry[]>([]);
  const [newGame, setNewGame] = useState<Partial<GameEntry>>({
    name: '',
    platform: 'PC (Steam)',
    invite_link: '',
    invite_code: '',
    notes: '',
    favorite: false
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadExistingGames();
    }
  }, [user]);

  const loadExistingGames = async () => {
    try {
      console.log(`Loading gaming preferences for user ${user.id}${memoriaProfileId ? `, Memoria profile: ${memoriaProfileId}` : ''}`);
      const gamingData = await MemoirIntegrations.getGamingPreferences(user.id, memoriaProfileId);
      
      if (gamingData?.games) {
        setGames(gamingData.games);
        console.log(`Loaded ${gamingData.games.length} games`);
      } else {
        console.log('No gaming preferences found');
        
        // Try to recover data if none was found
        console.log('Attempting to recover gaming preferences data...');
        const recoveredData = await MemoirIntegrations.recoverData(
          user.id, 
          'preferences.gaming', 
          memoriaProfileId
        );
        
        if (recoveredData?.games) {
          console.log(`Recovered ${recoveredData.games.length} games`);
          setGames(recoveredData.games);
        }
      }
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const handleAddGame = () => {
    if (!newGame.name?.trim()) {
      alert('Please enter a game name');
      return;
    }

    const gameEntry: GameEntry = {
      id: `game-${Date.now()}`,
      name: newGame.name.trim(),
      platform: newGame.platform || 'PC (Steam)',
      invite_link: newGame.invite_link?.trim() || '',
      invite_code: newGame.invite_code?.trim() || '',
      notes: newGame.notes?.trim() || '',
      favorite: newGame.favorite || false,
      timestamp: new Date().toISOString()
    };

    setGames(prev => [...prev, gameEntry]);
    setNewGame({
      name: '',
      platform: 'PC (Steam)',
      invite_link: '',
      invite_code: '',
      notes: '',
      favorite: false
    });
  };

  const handleDeleteGame = (gameId: string) => {
    setGames(prev => prev.filter(g => g.id !== gameId));
  };

  const handleToggleFavorite = (gameId: string) => {
    setGames(prev => prev.map(game => 
      game.id === gameId ? { ...game, favorite: !game.favorite } : game
    ));
  };

  const handleImportGames = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.games && Array.isArray(data.games)) {
            const importedGames = data.games.map((game: any, index: number) => ({
              id: `imported-${Date.now()}-${index}`,
              name: game.name || `Imported Game ${index + 1}`,
              platform: game.platform || 'PC (Steam)',
              invite_link: game.invite_link || '',
              invite_code: game.invite_code || '',
              notes: game.notes || '',
              favorite: game.favorite || false,
              timestamp: new Date().toISOString()
            }));
            setGames(prev => [...prev, ...importedGames]);
          }
        } catch (error) {
          alert('Invalid file format. Please upload a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const exportGames = () => {
    const data = {
      games: games,
      exportDate: new Date().toISOString(),
      user: user.email,
      totalGames: games.length,
      favoriteGames: games.filter(g => g.favorite).length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gaming-preferences-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveGames = async () => {
    if (!user) return;

    setSaveStatus('saving');
    setSaveError(null);

    try {
      console.log(`Saving gaming preferences for user ${user.id}${memoriaProfileId ? `, Memoria profile: ${memoriaProfileId}` : ''}`);
      
      const gamingData = await MemoirIntegrations.storeGamingPreferences(user.id, games, memoriaProfileId);
      setSaveStatus('success');
      onGamesStored?.(gamingData);

      // Auto-close after successful save
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (error) {
      console.error('Error saving games:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const favoriteGames = games.filter(g => g.favorite);
  const platformCounts = games.reduce((acc, game) => {
    acc[game.platform] = (acc[game.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Determine context label based on whether we have a memoriaProfileId
  const contextLabel = memoriaProfileId ? 'Memorial Gaming' : 'Personal Gaming';

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
            <Gamepad2 className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">{contextLabel} Preferences</h2>
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
              - {memoriaProfileId ? 'Preserving your loved one\'s gaming preferences' : 'Recording your personal gaming preferences'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Stats Overview */}
          {games.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-medium">Total Games</span>
                </div>
                <div className="text-2xl font-bold text-white">{games.length}</div>
              </div>
              
              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span className="text-pink-400 font-medium">Favorites</span>
                </div>
                <div className="text-2xl font-bold text-white">{favoriteGames.length}</div>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 font-medium">Platforms</span>
                </div>
                <div className="text-2xl font-bold text-white">{Object.keys(platformCounts).length}</div>
              </div>
            </div>
          )}

          {/* Add New Game */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Game</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Game Name *</label>
                <input
                  type="text"
                  placeholder="Enter game name"
                  value={newGame.name}
                  onChange={(e) => setNewGame(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Platform</label>
                <select
                  value={newGame.platform}
                  onChange={(e) => setNewGame(prev => ({ ...prev, platform: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
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
                  value={newGame.invite_link}
                  onChange={(e) => setNewGame(prev => ({ ...prev, invite_link: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/60 mb-2">Friend Code / Invite Code</label>
                <input
                  type="text"
                  placeholder="Friend code, lobby code, etc."
                  value={newGame.invite_code}
                  onChange={(e) => setNewGame(prev => ({ ...prev, invite_code: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-2">Notes</label>
              <textarea
                placeholder="Add any notes about when you play, preferred game modes, etc."
                value={newGame.notes}
                onChange={(e) => setNewGame(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 h-20 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newGame.favorite}
                  onChange={(e) => setNewGame(prev => ({ ...prev, favorite: e.target.checked }))}
                  className="rounded border-white/10 bg-white/5 text-pink-500 focus:ring-pink-500"
                />
                <Heart className={`w-5 h-5 ${newGame.favorite ? 'text-pink-400 fill-current' : 'text-white/60'}`} />
                <span className="text-white">Mark as favorite</span>
              </label>
              
              <button
                onClick={handleAddGame}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Game
              </button>
            </div>
          </div>

          {/* Saved Games */}
          {games.length > 0 && (
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Your Games ({games.length})</h3>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer transition-colors hover:bg-blue-500/30">
                    <Upload className="w-4 h-4" />
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportGames}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={exportGames}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {games.map((game) => (
                  <div key={game.id} className="bg-white/5 rounded-lg p-4">
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
                        
                        <p className="text-white/50 text-xs">
                          Added {new Date(game.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggleFavorite(game.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            game.favorite 
                              ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30' 
                              : 'bg-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${game.favorite ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Section */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-6 border border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Save Gaming Preferences</h3>
                <p className="text-white/70">
                  {memoriaProfileId 
                    ? "Your loved one's gaming preferences will be preserved as part of their digital memorial."
                    : "Your gaming preferences will be preserved as part of your digital legacy."}
                </p>
              </div>
              
              <button
                onClick={handleSaveGames}
                disabled={games.length === 0 || saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <Save className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Games
                  </>
                )}
              </button>
            </div>

            {saveError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {saveError}
              </div>
            )}

            {saveStatus === 'success' && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                Your gaming preferences have been saved successfully!
              </div>
            )}

            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <h4 className="text-cyan-400 font-medium mb-2">Gaming Legacy Benefits:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                {memoriaProfileId ? (
                  <>
                    <li>• Preserve your loved one's favorite games for future generations</li>
                    <li>• Document gaming communities they were part of</li>
                    <li>• Record their preferred platforms and gameplay styles</li>
                    <li>• Keep memories of shared gaming experiences</li>
                  </>
                ) : (
                  <>
                    <li>• Share your favorite games with friends and family</li>
                    <li>• Preserve gaming communities you were part of</li>
                    <li>• Help others discover games you loved</li>
                    <li>• Keep memories of shared gaming experiences</li>
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