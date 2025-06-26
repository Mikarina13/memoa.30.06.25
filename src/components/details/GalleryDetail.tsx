import { useState } from 'react';
import { Image, Video, ChevronLeft, ChevronRight, Download, ExternalLink, Play, Pause, Folder } from 'lucide-react';

interface GalleryDetailProps {
  data: Array<{
    id: string;
    title: string;
    description?: string;
    media_type: 'image' | 'video';
    file_path: string;
    file_size: number;
    mime_type: string;
    thumbnail_url?: string;
    metadata: any;
    tags: string[];
    created_at: string;
  }>;
}

export function GalleryDetail({ data }: GalleryDetailProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const currentItem = data[currentIndex];
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % data.length);
    setIsPlaying(false);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length);
    setIsPlaying(false);
  };
  
  const togglePlayback = () => {
    const video = document.getElementById('gallery-video') as HTMLVideoElement;
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
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">Gallery</h2>
      
      {data.length > 0 ? (
        <div className="space-y-6">
          {/* Main Carousel */}
          <div className="bg-black/30 rounded-lg overflow-hidden relative border border-white/10">
            <div className="aspect-video relative bg-black">
              {currentItem.media_type === 'image' ? (
                <img 
                  src={currentItem.file_path} 
                  alt={currentItem.title}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              ) : (
                <video 
                  id="gallery-video"
                  src={currentItem.file_path}
                  className="w-full h-full object-contain max-h-[60vh]"
                  controls={true}
                  onEnded={handleVideoEnded}
                ></video>
              )}
              
              {/* Navigation Arrows */}
              {data.length > 1 && (
                <>
                  <button 
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  
                  <button 
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}
              
              {/* Video Play Button Overlay */}
              {currentItem.media_type === 'video' && !isPlaying && (
                <button 
                  onClick={togglePlayback}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 bg-pink-500/80 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </button>
              )}
            </div>
          </div>
          
          {/* Item Details */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              {currentItem.media_type === 'image' ? (
                <Image className="w-5 h-5 text-pink-400" />
              ) : (
                <Video className="w-5 h-5 text-purple-400" />
              )}
              <h3 className="text-lg font-semibold text-white">{currentItem.title}</h3>
            </div>
            
            {currentItem.description && (
              <p className="text-white/70 mb-3 bg-white/5 p-3 rounded-lg">{currentItem.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                {formatFileSize(currentItem.file_size)} • {new Date(currentItem.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-2">
                <a 
                  href={currentItem.file_path}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" 
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
                
                <a 
                  href={currentItem.file_path}
                  download={currentItem.title}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" 
                  title="Download"
                >
                  <Download className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Thumbnails */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white/80 font-medium mb-3 flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              Gallery Items ({data.length})
            </h4>
            
            {data.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {data.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                      index === currentIndex ? 'ring-2 ring-pink-400 scale-105' : 'hover:scale-105'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {item.media_type === 'image' ? (
                      <img 
                        src={item.thumbnail_url || item.file_path} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-black/50 relative">
                        <img 
                          src={item.thumbnail_url || item.file_path}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-70"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-purple-500/80 rounded-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Image className="w-16 h-16 text-pink-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Gallery Items</h3>
          <p className="text-white/60">No photos or videos have been added to the gallery yet.</p>
        </div>
      )}
    </div>
  );
}