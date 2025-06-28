import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface YouTubeVideoProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
}

export function YouTubeVideo({ videoId, title = 'YouTube Video', className = '', autoplay = false }: YouTubeVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset loading state when video ID changes
    setIsLoading(true);
    setError(null);
  }, [videoId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load video. Please check your internet connection or try again later.');
  };

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-black/50 flex items-center justify-center rounded-lg">
        <div className="text-white text-center p-4">
          <p>No video ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-lg">
          <div className="text-white text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-lg">
          <div className="text-white text-center p-4">
            <p className="text-red-400 mb-2">{error}</p>
            <button 
              onClick={() => {
                setIsLoading(true);
                setError(null);
                // Force iframe reload by changing the key
                const iframe = document.getElementById(`youtube-iframe-${videoId}`) as HTMLIFrameElement;
                if (iframe) {
                  iframe.src = iframe.src;
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full aspect-video rounded-lg overflow-hidden">
        <iframe
          id={`youtube-iframe-${videoId}`}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        ></iframe>
      </div>
    </div>
  );
}