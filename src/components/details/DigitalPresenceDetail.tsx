import { useState } from 'react';
import { Globe, ExternalLink, Facebook, Instagram, Twitter, Linkedin, Youtube, Github, Twitch, AlignJustify as Spotify, Rss, Mail, Globe2, MessageSquare } from 'lucide-react';

interface DigitalPresenceDetailProps {
  data: Array<{
    id: string;
    name: string;
    url: string;
    timestamp: string;
  }>;
}

export function DigitalPresenceDetail({ data }: DigitalPresenceDetailProps) {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<boolean>(false);

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes('facebook')) return <Facebook className="w-6 h-6 text-blue-500" />;
    if (platformLower.includes('instagram')) return <Instagram className="w-6 h-6 text-pink-500" />;
    if (platformLower.includes('twitter') || platformLower.includes('x.com')) return <Twitter className="w-6 h-6 text-blue-400" />;
    if (platformLower.includes('linkedin')) return <Linkedin className="w-6 h-6 text-blue-600" />;
    if (platformLower.includes('youtube')) return <Youtube className="w-6 h-6 text-red-500" />;
    if (platformLower.includes('github')) return <Github className="w-6 h-6 text-white" />;
    if (platformLower.includes('twitch')) return <Twitch className="w-6 h-6 text-purple-500" />;
    if (platformLower.includes('spotify')) return <Spotify className="w-6 h-6 text-green-500" />;
    if (platformLower.includes('blog') || platformLower.includes('medium')) return <Rss className="w-6 h-6 text-orange-500" />;
    if (platformLower.includes('email') || platformLower.includes('mail')) return <Mail className="w-6 h-6 text-blue-400" />;
    if (platformLower.includes('discord') || platformLower.includes('slack')) return <MessageSquare className="w-6 h-6 text-indigo-400" />;
    
    return <Globe2 className="w-6 h-6 text-purple-400" />;
  };

  const getPlatformColor = (platform: string) => {
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes('facebook')) return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    if (platformLower.includes('instagram')) return 'from-pink-500/20 to-purple-600/20 border-pink-500/30';
    if (platformLower.includes('twitter') || platformLower.includes('x.com')) return 'from-blue-400/20 to-blue-500/20 border-blue-400/30';
    if (platformLower.includes('linkedin')) return 'from-blue-600/20 to-blue-700/20 border-blue-600/30';
    if (platformLower.includes('youtube')) return 'from-red-500/20 to-red-600/20 border-red-500/30';
    if (platformLower.includes('github')) return 'from-gray-600/20 to-gray-700/20 border-gray-600/30';
    if (platformLower.includes('twitch')) return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    if (platformLower.includes('spotify')) return 'from-green-500/20 to-green-600/20 border-green-500/30';
    if (platformLower.includes('blog') || platformLower.includes('medium')) return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
    
    return 'from-purple-500/20 to-indigo-500/20 border-purple-500/30';
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
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (url.includes('spotify.com/track')) {
      const trackId = url.split('/').pop()?.split('?')[0];
      return `https://open.spotify.com/embed/track/${trackId}`;
    }
    
    if (url.includes('spotify.com/playlist')) {
      const playlistId = url.split('/').pop()?.split('?')[0];
      return `https://open.spotify.com/embed/playlist/${playlistId}`;
    }
    
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    if (url.includes('twitch.tv')) {
      const channel = url.split('/').pop();
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
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

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">Digital Presence</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {data.map((item, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-r ${getPlatformColor(item.name)} rounded-lg p-4 border cursor-pointer hover:bg-opacity-80 transition-all ${
              selectedLink === item.url ? 'ring-2 ring-purple-400' : ''
            }`}
            onClick={() => handleLinkClick(item.url)}
          >
            <div className="flex items-center gap-3 mb-2">
              {getPlatformIcon(item.name)}
              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
              {item.url.includes('youtube.com') && (
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                  YouTube
                </span>
              )}
              {item.url.includes('spotify.com') && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                  Spotify
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/70 text-sm truncate max-w-[200px] bg-black/30 px-2 py-1 rounded">{item.url}</p>
              <button 
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedLink && !embedError && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Content Preview</h3>
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
        <div className="bg-white/5 rounded-lg p-4 border border-white/20">
          <div className="text-center py-6">
            <Globe className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Content cannot be embedded</h3>
            <p className="text-white/60 mb-4">This content cannot be displayed directly in this view.</p>
            <a 
              href={selectedLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}