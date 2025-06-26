import { useState, useEffect } from 'react';
import { Heart, MapPin, Film, BookOpen, Quote, Globe, Gamepad2, ExternalLink, Utensils } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';

interface ProfileSummaryDisplayProps {
  userId: string;
  context?: 'memoir' | 'memoria';
}

export function ProfileSummaryDisplay({ userId, context = 'memoir' }: ProfileSummaryDisplayProps) {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favorites' | 'digital' | 'games'>('favorites');

  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId, context]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await MemoirIntegrations.getPersonalPreferences(userId, context);
      setPreferences(data);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load personal preferences');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white/5 rounded-lg text-center">
        <div className="w-6 h-6 border-2 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-white/70">Loading preferences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-4 bg-white/5 rounded-lg text-center">
        <p className="text-white/70">No personal preferences found.</p>
      </div>
    );
  }

  const contextTitle = context === 'memoria' ? 'Loved One\'s Favorites' : 'Personal Favorites';

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4">
        <h3 className="text-white font-bold text-lg">{contextTitle}</h3>
        <p className="text-white/80 text-sm">
          {context === 'memoria' 
            ? 'A collection of what brought them joy and meaning'
            : 'A collection of what brings you joy and meaning'
          }
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'favorites' 
              ? 'text-pink-600 border-b-2 border-pink-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('favorites')}
        >
          Favorites
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'digital' 
              ? 'text-pink-600 border-b-2 border-pink-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('digital')}
        >
          Digital Presence
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'games' 
              ? 'text-pink-600 border-b-2 border-pink-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('games')}
        >
          Games
        </button>
      </div>
      
      <div className="p-4">
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {/* Songs */}
            {preferences.favorite_songs && preferences.favorite_songs.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <h4 className="font-medium text-gray-800">Favorite Songs</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_songs.slice(0, 5).map((song: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm">
                      • {song}
                    </li>
                  ))}
                  {preferences.favorite_songs.length > 5 && (
                    <li className="text-gray-500 text-xs italic">
                      +{preferences.favorite_songs.length - 5} more songs
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Foods */}
            {preferences.favorite_foods && preferences.favorite_foods.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-4 h-4 text-red-500" />
                  <h4 className="font-medium text-gray-800">Favorite Foods</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_foods.slice(0, 5).map((food: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm">
                      • {food}
                    </li>
                  ))}
                  {preferences.favorite_foods.length > 5 && (
                    <li className="text-gray-500 text-xs italic">
                      +{preferences.favorite_foods.length - 5} more foods
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Movies */}
            {preferences.favorite_movies && preferences.favorite_movies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-blue-500" />
                  <h4 className="font-medium text-gray-800">Favorite Movies</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_movies.slice(0, 5).map((movie: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm">
                      • {movie}
                    </li>
                  ))}
                  {preferences.favorite_movies.length > 5 && (
                    <li className="text-gray-500 text-xs italic">
                      +{preferences.favorite_movies.length - 5} more movies
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Books */}
            {preferences.favorite_books && preferences.favorite_books.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-medium text-gray-800">Favorite Books</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_books.slice(0, 5).map((book: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm">
                      • {book}
                    </li>
                  ))}
                  {preferences.favorite_books.length > 5 && (
                    <li className="text-gray-500 text-xs italic">
                      +{preferences.favorite_books.length - 5} more books
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Locations */}
            {preferences.favorite_locations && preferences.favorite_locations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <h4 className="font-medium text-gray-800">Favorite Places</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_locations.slice(0, 5).map((location: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm">
                      • {location}
                    </li>
                  ))}
                  {preferences.favorite_locations.length > 5 && (
                    <li className="text-gray-500 text-xs italic">
                      +{preferences.favorite_locations.length - 5} more places
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Quotes */}
            {preferences.favorite_quotes && preferences.favorite_quotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="w-4 h-4 text-purple-500" />
                  <h4 className="font-medium text-gray-800">Favorite Quotes</h4>
                </div>
                <ul className="space-y-1">
                  {preferences.favorite_quotes.slice(0, 3).map((quote: string, index: number) => (
                    <li key={index} className="text-gray-600 text-sm italic">
                      "{quote}"
                    </li>
                  ))}
                  {preferences.favorite_quotes.length > 3 && (
                    <li className="text-gray-500 text-xs">
                      +{preferences.favorite_quotes.length - 3} more quotes
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'digital' && (
          <div className="space-y-4">
            {preferences.digital_presence && preferences.digital_presence.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <h4 className="font-medium text-gray-800">Digital Presence</h4>
                </div>
                <ul className="space-y-2">
                  {preferences.digital_presence.map((item: any, index: number) => (
                    <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-700 font-medium">{item.name}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No digital presence links added yet.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'games' && (
          <div className="space-y-4">
            {preferences.gaming_preferences && preferences.gaming_preferences.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gamepad2 className="w-4 h-4 text-cyan-500" />
                  <h4 className="font-medium text-gray-800">Gaming Preferences</h4>
                </div>
                <ul className="space-y-2">
                  {preferences.gaming_preferences.map((game: any, index: number) => (
                    <li key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{game.name}</span>
                          {game.favorite && (
                            <Heart className="w-3 h-3 text-pink-500 fill-current" />
                          )}
                        </div>
                        <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-800 rounded-full">
                          {game.platform}
                        </span>
                      </div>
                      
                      {game.notes && (
                        <p className="text-gray-600 text-sm mt-1">{game.notes}</p>
                      )}
                      
                      {game.invite_link && (
                        <a
                          href={game.invite_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Game Link
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No gaming preferences added yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}