import { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';

interface YouTubeVideoProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  showControls?: boolean;
}

export function YouTubeVideo({ 
  videoId, 
  title = 'YouTube Video', 
  className = '', 
  autoplay = false,
  showControls = true
}: YouTubeVideoProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Reset states when video ID changes
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
  }, [videoId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load video. Please check your internet connection or try again later.');
  };

  const retryLoading = () => {
    if (retryCount < 3) {
      setIsLoading(true);
      setError(null);
      setRetryCount(prev => prev + 1);
      
      // Force iframe reload
      if (iframeRef.current) {
        const src = iframeRef.current.src;
        iframeRef.current.src = '';
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = src;
          }
        }, 100);
      }
    } else {
      setError('Unable to load the video after multiple attempts. Try opening it directly on YouTube.');
    }
  };

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-black/50 flex items-center justify-center rounded-lg">
        <div className="text-white text-center p-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="font-medium">No video ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 rounded-lg">
          <div className="text-white text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 rounded-lg p-4">
          <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-red-400 mb-4 text-center max-w-sm">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={retryLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <a 
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
              Open in YouTube
            </a>
          </div>
        </div>
      )}
      
      {/* YouTube Iframe */}
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&controls=${showControls ? 1 : 0}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}