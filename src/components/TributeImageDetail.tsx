import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Download, ExternalLink, Image as ImageIcon, Video, Play, Pause, X } from 'lucide-react';

interface TributeImageDetailProps {
  data: Array<{
    id: string;
    url: string;
    style?: string;
    prompt?: string;
    createdAt: string;
    isVideo?: boolean;
  }>;
}

export function TributeImageDetail({ data }: TributeImageDetailProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  const handleImageClick = (url: string, isVideo: boolean = false) => {
    setSelectedImage(url);
    if (isVideo) {
      setCurrentVideo(url);
    } else {
      setCurrentVideo(null);
    }
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  const toggleVideoPlayback = () => {
    const video = document.getElementById('tribute-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">AI Tribute Images</h2>
      
      {data.length > 0 ? (
        <div className="space-y-6">
          {/* Image/Video Viewer */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <button 
                onClick={handleCloseViewer}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {currentVideo ? (
                <div className="relative max-w-4xl w-full">
                  <video 
                    id="tribute-video"
                    src={currentVideo}
                    className="w-full h-auto max-h-[80vh]"
                    controls={false}
                    onEnded={handleVideoEnded}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={toggleVideoPlayback}
                      className="p-4 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <img 
                  src={selectedImage} 
                  alt="Tribute" 
                  className="max-w-4xl w-full h-auto max-h-[80vh] object-contain"
                />
              )}
            </div>
          )}
          
          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <div 
                key={item.id} 
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group relative cursor-pointer"
                onClick={() => handleImageClick(item.url, item.isVideo)}
              >
                {item.isVideo ? (
                  <div className="w-full h-48 relative bg-black/50">
                    <video 
                      src={item.url}
                      className="w-full h-48 object-cover opacity-70"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/60" />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt="Tribute Image" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      e.currentTarget.src = "https://images.pexels.com/photos/4439425/pexels-photo-4439425.jpeg";
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-white/80 flex items-center gap-1">
                          {item.isVideo ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-amber-400" />}
                          {item.isVideo ? 'Video' : 'Image'} Tribute
                        </div>
                        <div className="text-xs text-white/50">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={item.url} 
                          download 
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Prompt Information */}
          {data[0]?.prompt && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
              <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Sample Prompt Used
              </h3>
              <p className="text-white/80 bg-black/30 p-3 rounded-lg">{data[0].prompt}</p>
            </div>
          )}
          
          {/* External Links */}
          <div className="bg-white/5 rounded-lg p-4 mt-4">
            <h3 className="text-white font-medium mb-3">Create More AI Tributes</h3>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://openai.com/dall-e-3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                DALL·E
              </a>
              <a 
                href="https://www.midjourney.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Midjourney
              </a>
              <a 
                href="https://openai.com/sora" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Sora
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Sparkles className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No AI Tribute Images</h3>
          <p className="text-white/60 mb-6">No AI-generated tribute images have been added yet.</p>
        </div>
      )}
    </div>
  );
}