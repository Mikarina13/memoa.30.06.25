import { useState } from 'react';
import { FileVideo, Mic, Newspaper, ExternalLink, Calendar, Link2 } from 'lucide-react';

interface MediaLinksDetailProps {
  data: Array<{
    id: string;
    title: string;
    url: string;
    type: 'video' | 'podcast' | 'article';
    source: string;
    description?: string;
    date: string;
  }>;
}

export function MediaLinksDetail({ data }: MediaLinksDetailProps) {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<boolean>(false);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="w-5 h-5 text-red-400" />;
      case 'podcast': return <Mic className="w-5 h-5 text-purple-400" />;
      case 'article': return <Newspaper className="w-5 h-5 text-blue-400" />;
      default: return <Link2 className="w-5 h-5 text-gray-400" />;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'from-red-500/20 to-red-600/20 border-red-500/30';
      case 'podcast': return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
      case 'article': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };
  
  const canEmbed = (url: string) => {
    // Check if the URL is from a service that typically allows embedding
    return (
      url.includes('youtube.com') || 
      url.includes('youtu.be') || 
      url.includes('spotify.com') || 
      url.includes('soundcloud.com') ||
      url.includes('vimeo.com') ||
      url.includes('twitch.tv')
    );
  };
  
  const getEmbedUrl = (url: string) => {
    // Convert standard URLs to embed URLs
    if (url.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      } catch (e) {
        console.error('Invalid YouTube URL:', e);
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (url.includes('youtu.be')) {
      try {
        const videoId = url.split('/').pop();
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      } catch (e) {
        console.error('Invalid YouTube URL:', e);
      }
      return url;
    }
    
    if (url.includes('spotify.com/track')) {
      try {
        const trackId = url.split('/').pop()?.split('?')[0];
        if (trackId) return `https://open.spotify.com/embed/track/${trackId}`;
      } catch (e) {
        console.error('Invalid Spotify URL:', e);
      }
      return url;
    }
    
    if (url.includes('spotify.com/episode')) {
      const episodeId = url.split('/').pop()?.split('?')[0];
      return `https://open.spotify.com/embed/episode/${episodeId}`;
    }
    
    if (url.includes('spotify.com/show')) {
      try {
        const playlistId = url.split('/').pop()?.split('?')[0];
        if (playlistId) return `https://open.spotify.com/embed/playlist/${playlistId}`;
      } catch (e) {
        console.error('Invalid Spotify URL:', e);
      }
      return url;
    }
    
    if (url.includes('vimeo.com')) {
      try {
        const videoId = url.split('/').pop();
        if (videoId) return `https://player.vimeo.com/video/${videoId}`;
      } catch (e) {
        console.error('Invalid Vimeo URL:', e);
      }
      return url;
    }
    
    if (url.includes('twitch.tv')) {
      try {
        const channel = url.split('/').pop();
        if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
      } catch (e) {
        console.error('Invalid Twitch URL:', e);
      }
      return url;
    }
    
    return url;
  };
  
  const handleLinkClick = (url: string) => {
    if (canEmbed(url)) {
      setSelectedLink(url);
      setEmbedError(false);
    } else {
      // Open non-embeddable links in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  
  const handleEmbedError = () => {
    setEmbedError(true);
  };
  
  // Group media links by type
  const groupedLinks = data.reduce((acc, link) => {
    if (!acc[link.type]) {
      acc[link.type] = [];
    }
    acc[link.type].push(link);
    return acc;
  }, {} as Record<string, typeof data>);

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Media Links</h2>
      
      {/* Embedded Content */}
      {selectedLink && !embedError && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Media Preview</h3>
            <button 
              onClick={() => setSelectedLink(null)}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            {(() => {
              const embedUrl = getEmbedUrl(selectedLink);
              
              // YouTube embed
              if (embedUrl.includes('youtube.com/embed/')) {
                return (
                  <iframe
                    src={embedUrl}
                    title="YouTube Video"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={handleEmbedError}
                  ></iframe>
                );
              }
              
              // Spotify embed
              if (embedUrl.includes('spotify.com/embed/')) {
                return (
                  <iframe
                    src={embedUrl}
                    title="Spotify Player"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="encrypted-media"
                    onError={handleEmbedError}
                  ></iframe>
                );
              }
              
              // Vimeo embed
              if (embedUrl.includes('player.vimeo.com/video/')) {
                return (
                  <iframe
                    src={embedUrl}
                    title="Vimeo Video"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    onError={handleEmbedError}
                  ></iframe>
                );
              }
              
              // Twitch embed
              if (embedUrl.includes('player.twitch.tv/')) {
                return (
                  <iframe
                    src={embedUrl}
                    title="Twitch Stream"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    onError={handleEmbedError}
                  ></iframe>
                );
              }
              
              // Default fallback
              return (
                <iframe
                  src={embedUrl}
                  title="Embedded content"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={handleEmbedError}
                ></iframe>
              );
            })()}
          </div>
        </div>
      )}
      
      {selectedLink && embedError && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/20 mb-6">
          <div className="text-center py-6">
            <Link2 className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Content cannot be embedded</h3>
            <p className="text-white/60 mb-4">This content cannot be displayed directly in this view.</p>
            <a 
              href={selectedLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
        </div>
      )}
      
      {/* Videos */}
      {groupedLinks.video && groupedLinks.video.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <FileVideo className="w-5 h-5" />
            Videos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedLinks.video.map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileVideo className="w-5 h-5 text-red-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(link.date).toLocaleDateString()}
                  </span>
                </div>
                
                {link.description && (
                  <p className="text-white/70 text-sm mb-3">{link.description}</p>
                )}
                
                <div className="flex justify-end">
                  <button 
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Watch Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Podcasts */}
      {groupedLinks.podcast && groupedLinks.podcast.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Podcasts
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedLinks.podcast.map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(link.date).toLocaleDateString()}
                  </span>
                </div>
                
                {link.description && (
                  <p className="text-white/70 text-sm mb-3">{link.description}</p>
                )}
                
                <div className="flex justify-end">
                  <button 
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Listen to Podcast
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Articles */}
      {groupedLinks.article && groupedLinks.article.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Articles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedLinks.article.map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(link.date).toLocaleDateString()}
                  </span>
                </div>
                
                {link.description && (
                  <p className="text-white/70 text-sm mb-3">{link.description}</p>
                )}
                
                <div className="flex justify-end">
                  <button 
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Read Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {Object.keys(groupedLinks).length === 0 && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Link2 className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Media Links</h3>
          <p className="text-white/60">No media links have been added yet.</p>
        </div>
      )}
    </div>
  );
}