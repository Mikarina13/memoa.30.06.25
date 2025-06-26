import { useState } from 'react';
import { Gamepad2, Heart, ExternalLink, Code } from 'lucide-react';

interface GamingPreferencesDetailProps {
  data: Array<{
    id: string;
    name: string;
    platform: string;
    invite_link?: string;
    invite_code?: string;
    notes?: string;
    favorite: boolean;
    timestamp: string;
  }>;
}

export function GamingPreferencesDetail({ data }: GamingPreferencesDetailProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const getPlatformColor = (platform: string) => {
    if (platform.includes('PC')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    if (platform.includes('PlayStation')) return 'from-indigo-500/20 to-blue-600/20 border-indigo-500/30';
    if (platform.includes('Xbox')) return 'from-green-500/20 to-green-600/20 border-green-500/30';
    if (platform.includes('Nintendo')) return 'from-red-500/20 to-red-600/20 border-red-500/30';
    if (platform.includes('Mobile')) return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    if (platform.includes('VR')) return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  const getPlatformIcon = (platform: string) => {
    // This would ideally use specific icons for each platform
    // For now, we'll use the Gamepad2 icon for all
    return <Gamepad2 className="w-5 h-5 text-cyan-400" />;
  };

  const getGameImageUrl = (gameName: string, platform: string) => {
    // This is a placeholder function that would ideally connect to a game database API
    // For now, we'll return a generic game image
    // Use different images based on platform type for more variety
    if (platform.toLowerCase().includes('playstation')) {
      return 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    } else if (platform.toLowerCase().includes('xbox')) {
      return 'https://images.pexels.com/photos/4219883/pexels-photo-4219883.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    } else if (platform.toLowerCase().includes('nintendo')) {
      return 'https://images.pexels.com/photos/371924/pexels-photo-371924.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    } else if (platform.toLowerCase().includes('mobile')) {
      return 'https://images.pexels.com/photos/18264716/pexels-photo-18264716/free-photo-of-man-playing-mobile-game.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    } else if (platform.toLowerCase().includes('vr')) {
      return 'https://images.pexels.com/photos/8721342/pexels-photo-8721342.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    } else {
      return 'https://images.pexels.com/photos/159393/gamepad-video-game-controller-game-controller-controller-159393.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
    }
  };

  const getStoreLink = (gameName: string, platform: string) => {
    // Generate appropriate store links based on platform
    if (platform.includes('Steam')) {
      return `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`;
    }
    if (platform.includes('Epic')) {
      return `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(gameName)}&sortBy=relevancy&sortDir=DESC`;
    }
    if (platform.includes('PlayStation')) {
      return `https://store.playstation.com/en-us/search/${encodeURIComponent(gameName)}`;
    }
    if (platform.includes('Xbox')) {
      return `https://www.xbox.com/en-US/games/store/search?q=${encodeURIComponent(gameName)}`;
    }
    if (platform.includes('Nintendo')) {
      return `https://www.nintendo.com/search/?q=${encodeURIComponent(gameName)}&p=1&cat=gme&sort=df`;
    }
    
    // Default to a Google search if no specific store is applicable
    return `https://www.google.com/search?q=${encodeURIComponent(gameName)}+game`;
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Gaming Preferences</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {data.map((game, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-r ${getPlatformColor(game.platform)} rounded-lg overflow-hidden cursor-pointer transition-all ${
              selectedGame === game.id ? 'ring-2 ring-cyan-400 transform scale-[1.02] shadow-lg shadow-cyan-500/20' : 'hover:scale-[1.01]'
            }`}
            onClick={() => setSelectedGame(game.id === selectedGame ? null : game.id)}
          >
            <div className="h-40 bg-black/30 relative">
              <img 
                src={getGameImageUrl(game.name, game.platform)} 
                alt={game.name}
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center justify-end p-4">
                <h3 className="font-semibold text-white text-lg text-center mb-1">{game.name}</h3>
                <div className="flex items-center gap-2">
                  {getPlatformIcon(game.platform)}
                  <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                    {game.platform}
                  </span>
                </div>
              </div>
              {game.favorite && (
                <div className="absolute top-2 right-2">
                  <Heart className="w-5 h-5 text-pink-400 fill-current" />
                </div>
              )}
            </div>
            
            <div className="p-4">
              {game.notes && (
                <div className="mb-3">
                  <h4 className="text-white/80 text-sm font-medium mb-1">Notes:</h4>
                  <p className="text-white/70 text-sm bg-white/5 p-2 rounded-lg">{game.notes}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {game.invite_link && (
                  <a 
                    href={game.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Join
                  </a>
                )}
                
                <a 
                  href={getStoreLink(game.name, game.platform)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/30 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Gamepad2 className="w-3 h-3" />
                  Store
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedGame && (
        <div className="bg-white/5 rounded-lg p-6 border border-white/20 animate-fadeIn">
          {(() => {
            const game = data.find(g => g.id === selectedGame);
            if (!game) return null;
            
            return (
              <>
                <div className="flex items-center gap-3 mb-4">
                  {getPlatformIcon(game.platform)}
                  <h3 className="text-xl font-semibold text-white">{game.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img 
                      src={getGameImageUrl(game.name, game.platform)} 
                      alt={game.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white/80 font-medium mb-1">Platform</h4>
                      <p className="text-cyan-400 font-medium">{game.platform}</p>
                    </div>
                    
                    {game.notes && (
                      <div>
                        <h4 className="text-white/80 font-medium mb-1">Notes</h4>
                        <p className="text-white/70">{game.notes}</p>
                      </div>
                    )}
                    
                    {game.invite_code && (
                      <div>
                        <h4 className="text-white/80 font-medium mb-1">Invite Code</h4>
                        <div className="bg-white/10 rounded-lg p-2 flex items-center justify-between group">
                          <code className="text-amber-400 font-mono select-all">{game.invite_code}</code>
                          <Code className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 pt-2">
                      {game.invite_link && (
                        <a 
                          href={game.invite_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Join Game
                        </a>
                      )}
                      
                      <a 
                        href={getStoreLink(game.name, game.platform)}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                      >
                        <Gamepad2 className="w-4 h-4" />
                        View in Store
                      </a>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}