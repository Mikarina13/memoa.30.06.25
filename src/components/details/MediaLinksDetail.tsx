import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, ExternalLink, Facebook, Instagram, Twitter, Linkedin, Youtube, Github, Twitch, AlignJustify as Spotify, Rss, Mail, Globe2, MessageSquare } from 'lucide-react';

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
            <Globe className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
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
      {data.filter(link => link.type === 'video').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <Youtube className="w-5 h-5" />
            Videos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.filter(link => link.type === 'video').map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Youtube className="w-5 h-5 text-red-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
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
      {data.filter(link => link.type === 'podcast').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
            <Spotify className="w-5 h-5" />
            Podcasts
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.filter(link => link.type === 'podcast').map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Spotify className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
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
      {data.filter(link => link.type === 'article').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
            <Rss className="w-5 h-5" />
            Articles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.filter(link => link.type === 'article').map((link) => (
              <div 
                key={link.id} 
                className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                onClick={() => handleLinkClick(link.url)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Rss className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">{link.title}</h4>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                  <span>{link.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
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
      
      {Object.keys(data).length === 0 && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Globe className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Media Links</h3>
          <p className="text-white/60">No media links have been added yet.</p>
        </div>
      )}
    </div>
  );
}