import { useState } from 'react';
import { Heart, MapPin, Film, BookOpen, Quote, Globe, Gamepad2, ExternalLink, Play, Pause, X, Utensils } from 'lucide-react';

interface PersonalFavoritesDetailProps {
  data: any;
}

export function PersonalFavoritesDetail({ data }: PersonalFavoritesDetailProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null); 
  const [mapLoaded, setMapLoaded] = useState(false);

  // Helper function to extract YouTube video ID
  const getYouTubeId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper function to extract Spotify track ID
  const getSpotifyId = (url: string) => {
    if (!url || typeof url !== 'string') return null;
    
    if (url.includes('spotify.com/track/')) {
      const parts = url.split('/');
      const idWithParams = parts[parts.length - 1];
      return idWithParams.split('?')[0];
    }
    return null;
  };

  // Play YouTube video
  const playYouTubeVideo = (url: string) => {
    const videoId = getYouTubeId(url);
    if (videoId) {
      setCurrentSong(videoId);
      setIsPlaying(true);
    } else {
      // If not a YouTube URL, just open it in a new tab
      window.open(url, '_blank');
    }
  };

  // Handle video click
  const handleVideoClick = (url: string) => {
    const videoId = getYouTubeId(url);
    if (videoId) {
      setShowVideoModal(videoId);
    } else {
      window.open(url, '_blank');
    }
  };

  // Handle location click
  const handleLocationClick = (location: string) => {
    setSelectedLocation(location);
    setMapLoaded(false);
    
    // Small delay to ensure the iframe is reset before loading a new location
    setTimeout(() => {
      setMapLoaded(true);
    }, 100);
  };

  // Check if string is a URL
  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">Personal Favorites</h2>
      
      {/* Songs */}
      {data.favorite_songs && data.favorite_songs.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-white">Favorite Songs</h3>
          </div>
          
          <div className="space-y-3">
            {data.favorite_songs.map((song: string, index: number) => {
              // Check if it's a YouTube URL
              const youtubeId = getYouTubeId(song);
              const spotifyId = getSpotifyId(song);
              const isUrl = isValidUrl(song);
              
              return (
                <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                  {youtubeId ? (
                    // YouTube song
                    <div className="flex flex-col md:flex-row">
                      <div className="w-full md:w-48 h-24 bg-black relative cursor-pointer flex-shrink-0" onClick={() => playYouTubeVideo(song)}>
                        <img 
                          src={`https://img.youtube.com/vi/${youtubeId}/0.jpg`}
                          alt="YouTube Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="p-3 flex-1">
                        <p className="text-white font-medium mb-2 line-clamp-1">YouTube Video</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => playYouTubeVideo(song)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            Play
                          </button>
                          <a
                            href={song}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            YouTube
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : spotifyId ? (
                    // Spotify song
                    <div className="p-3">
                      <iframe 
                        src={`https://open.spotify.com/embed/track/${spotifyId}`} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="encrypted-media"
                        className="rounded-lg"
                      ></iframe>
                    </div>
                  ) : isUrl ? (
                    // Other URL
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium line-clamp-1">{song}</p>
                        <a
                          href={song}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Link
                        </a>
                      </div>
                    </div>
                  ) : (
                    // Regular song name
                    <div className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{song}</p>
                        <a
                          href={`https://open.spotify.com/search/${encodeURIComponent(song)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Find on Spotify
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* YouTube Player */}
          {currentSong && (
            <div className="mt-4 bg-black/30 rounded-lg overflow-hidden">
              <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${currentSong}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Foods */}
      {data.favorite_foods && data.favorite_foods.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Utensils className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Favorite Foods</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.favorite_foods.map((food: string, index: number) => (
              <div key={index} className="bg-white/10 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-white">{food}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Movies */}
      {data.favorite_movies && data.favorite_movies.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Favorite Movies</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.favorite_movies.map((movie: string, index: number) => {
              // Check if it's a URL
              const youtubeId = getYouTubeId(movie);
              const isUrl = isValidUrl(movie);
              
              return (
                <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                  {youtubeId ? (
                    // YouTube trailer
                    <div className="h-40 bg-black relative cursor-pointer" onClick={() => handleVideoClick(movie)}>
                      <img 
                        src={`https://img.youtube.com/vi/${youtubeId}/0.jpg`}
                        alt="YouTube Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors">
                        <div className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-sm font-medium">Movie Trailer</p>
                      </div>
                    </div>
                  ) : isUrl && movie.includes('movieposters.com') ? (
                    // Movie poster URL
                    <div className="h-40 relative">
                      <img 
                        src={movie}
                        alt="Movie Poster"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                        }}
                      />
                    </div>
                  ) : book.toLowerCase().includes('harry potter') ? (
                    // Special case for Harry Potter books
                    <div className="h-40 relative">
                      <img 
                        src="https://images.pexels.com/photos/8391515/pexels-photo-8391515.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        alt={book}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <BookOpen className="w-5 h-5 text-emerald-400 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">{book}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Regular movie with poster from Pexels
                    <div className="h-40 relative">
                      <img 
                        src={`https://images.pexels.com/photos/${7991579 + index * 100}/pexels-photo-${7991579 + index * 100}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`}
                        alt={movie}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <Film className="w-5 h-5 text-blue-500 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">{movie}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-white font-medium">{isUrl ? 'Movie Link' : movie}</p>
                    <a 
                      href={isUrl ? movie : `https://www.imdb.com/find?q=${encodeURIComponent(movie)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isUrl ? 'Open Link' : 'Find on IMDb'}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Books */}
      {data.favorite_books && data.favorite_books.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Favorite Books</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.favorite_books.map((book: string, index: number) => {
              const isUrl = isValidUrl(book);
              const isAmazonUrl = isUrl && book.includes('amazon.com');
              
              return (
                <div key={index} className="bg-white/10 rounded-lg overflow-hidden">
                  {isAmazonUrl ? (
                    // Amazon book link with image
                    <div className="h-40 relative">
                      <img 
                        src={book}
                        alt="Book Cover"
                        className="w-full h-full object-contain bg-emerald-900/20"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-sm font-medium">Amazon Book</p>
                      </div>
                    </div>
                  ) : isUrl ? (
                    // External book URL that's not Amazon
                    <div className="h-40 relative">
                      <img 
                        src="https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        alt={book}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <BookOpen className="w-5 h-5 text-emerald-400 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">External Book Link</span>
                        </div>
                      </div>
                    </div>
                  ) : book.toLowerCase().includes('dune') ? (
                    // Special case for Dune book
                    <div className="h-40 relative">
                      <img 
                        src="https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        alt={book}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <BookOpen className="w-5 h-5 text-emerald-400 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">{book}</span>
                        </div>
                      </div>
                    </div>
                  ) : book.toLowerCase().includes('harry potter') ? (
                    // Special case for Harry Potter books
                    <div className="h-40 relative">
                      <img 
                        src="https://images.pexels.com/photos/8391515/pexels-photo-8391515.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        alt={book}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <BookOpen className="w-5 h-5 text-emerald-400 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">{book}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Regular book with cover from Pexels
                    <div className="h-40 relative">
                      <img 
                        src={`https://images.pexels.com/photos/${1370295 + index * 100}/pexels-photo-${1370295 + index * 100}.jpeg?auto=compress&cs=tinysrgb&w=400`}
                        alt={book}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.src = "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent/0 flex items-end">
                        <div className="p-2">
                          <BookOpen className="w-5 h-5 text-emerald-400 inline-block mr-1" />
                          <span className="text-white text-sm font-medium">{book}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-white font-medium">{isUrl ? 'Book Link' : book}</p>
                    <a 
                      href={isUrl ? book : `https://www.goodreads.com/search?q=${encodeURIComponent(book)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {isUrl ? 'Open Link' : 'Find on Goodreads'}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Quotes */}
      {data.favorite_quotes && data.favorite_quotes.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Quote className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Favorite Quotes</h3>
          </div>
          <div className="space-y-3">
            {data.favorite_quotes.map((quote: string, index: number) => (
              <div key={index} className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg p-4 border-l-4 border-amber-500">
                <p className="text-white/90 italic">"{quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Locations */}
      {data.favorite_locations && data.favorite_locations.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Favorite Locations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {data.favorite_locations.map((location: string, index: number) => {
              const isUrl = isValidUrl(location);
              const isGoogleMapsUrl = isUrl && (location.includes('maps.google') || location.includes('maps.app.goo.gl'));
              
              return (
                <div 
                  key={index} 
                  className={`bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedLocation === location ? 'ring-2 ring-purple-400' : 'hover:bg-white/15'
                  }`}
                  onClick={() => handleLocationClick(location)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <p className="text-white font-medium">{isGoogleMapsUrl ? 'Google Maps Location' : location}</p>
                    {isGoogleMapsUrl && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                        Map Link
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedLocation && (
            <div className="mt-4 rounded-lg overflow-hidden border border-white/20 h-64 bg-gray-900">
              {mapLoaded && (
                <iframe
                  title={`Map of ${selectedLocation}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={isValidUrl(selectedLocation) && (selectedLocation.includes('maps.google') || selectedLocation.includes('maps.app.goo.gl')) 
                    ? selectedLocation
                    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(selectedLocation)}`}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              )}
              {!mapLoaded && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              <div className="absolute bottom-4 right-4 z-10">
                <a
                  href={isValidUrl(selectedLocation) 
                    ? selectedLocation 
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowVideoModal(null)}>
          <div className="relative w-full max-w-3xl p-2" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-black/50 rounded-full"
              onClick={() => setShowVideoModal(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${showVideoModal}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
      
      {/* No items message */}
      {!data.favorite_songs?.length && !data.favorite_movies?.length && 
       !data.favorite_books?.length && !data.favorite_quotes?.length && 
       !data.favorite_foods?.length && !data.favorite_locations?.length && (
        <div className="bg-white/5 rounded-lg p-8 text-center border border-white/10">
          <Heart className="w-16 h-16 text-pink-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Favorites Added</h3>
          <p className="text-white/60">No personal favorites have been added yet.</p>
        </div>
      )}
    </div>
  );
}