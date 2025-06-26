import { useState } from 'react';
import { Camera, ExternalLink, Play, Pause, Send, Loader, AlertCircle, MessageSquare, RefreshCw } from 'lucide-react';

interface TavusAvatarDetailProps {
  data: {
    avatarId: string;
    status: string;
  };
}

export function TavusAvatarDetail({ data }: TavusAvatarDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{text: string, isUser: boolean}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  
  // Use a more appropriate sample video that looks like a person talking
  const mockVideoUrl = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  // Poster image for the video
  const posterImage = 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  
  const togglePlayback = () => {
    const video = document.getElementById('tavus-video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        setVideoVisible(true);
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, {text: message, isUser: true}]);
    
    // Clear input and set processing state
    const userMessage = message;
    setMessage('');
    setIsProcessing(true);
    setError(null);
    
    try {
      // Check if we have an API key
      const apiKey = import.meta.env.VITE_TAVUS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Tavus API key is not configured. Please ensure VITE_TAVUS_API_KEY is set in your .env file and restart the development server.');
      }
      
      // In a real implementation, this would call the Tavus API
      // For now, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show the video element and start playback to simulate a response
      setVideoVisible(true);
      const video = document.getElementById('tavus-video') as HTMLVideoElement;
      if (video) {
        video.style.opacity = '1';
        video.play();
        setIsPlaying(true);
      }
      
      // Simulate a response
      const responses = [
        "Thanks for reaching out! It's great to connect with you in this digital space.",
        "I appreciate your message. This is a simulated response, but with a real API key, I could generate personalized video responses.",
        "Hello there! In a fully implemented version, I would respond with a video message that looks and sounds just like me.",
        "Thanks for your message. With the Tavus API properly configured, you'd see a video response that captures my expressions and voice."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Add avatar response to chat history
      setChatHistory(prev => [...prev, {text: randomResponse, isUser: false}]);
      
    } catch (err) {
      console.error('Error sending message to Tavus:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Video Avatar</h2>
      
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Interactive Video Avatar</h3>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Avatar ID</h4>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
              Ready
            </span>
          </div>
          <p className="text-white/70 text-sm font-mono">{data.avatarId}</p>
        </div>
        
        <div className="bg-black/30 rounded-lg overflow-hidden mb-6">
          <div className="relative aspect-video bg-black/50">
            <video 
              id="tavus-video"
              src={mockVideoUrl}
              className={`w-full h-full object-contain transition-opacity duration-300 ${videoVisible ? 'opacity-100' : 'opacity-0'}`}
              onEnded={() => setIsPlaying(false)}
              poster={posterImage}
              preload="auto"
              loop
            ></video>
            
            <div className={`absolute inset-0 flex items-center justify-center ${videoVisible && isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
              <button
                onClick={togglePlayback}
                className="w-16 h-16 bg-purple-500/80 hover:bg-purple-500 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-white ml-0" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Live Chat Interface */}
        <div className="mt-6 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          <div className="p-3 bg-purple-500/20 border-b border-white/10 flex items-center justify-between">
            <h4 className="text-white font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Live Chat with Avatar
            </h4>
            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </div>
          </div>
          
          {/* Chat History */}
          <div className="p-4 h-64 overflow-y-auto space-y-3 bg-black/30" id="chat-container">
            {chatHistory.length === 0 ? (
              <div className="text-center text-white/50 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Send a message to start chatting with this avatar</p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.isUser 
                        ? 'bg-purple-500/30 text-white' 
                        : 'bg-white/10 text-white/90'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-white/90 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating response...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  sendMessage();
                  // Keep focus on input after sending
                  e.currentTarget.focus();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isProcessing}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-purple-400 font-medium mb-2">Avatar Features:</h4>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Realistic video avatar generation</li>
            <li>• Conversational video interactions</li>
            <li>• Personalized video messages</li>
            <li>• Live chat with AI-powered responses</li>
          </ul>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-white font-medium">Sample Video Message</h4>
            <p className="text-white/60 text-sm">Click to play a sample of this avatar</p>
          </div>
          
          <a
            href="https://tavus.io/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Manage in Tavus
          </a>
        </div>
        
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="text-amber-400 font-medium mb-2">Try Asking:</h4>
          <ul className="text-white/70 text-sm space-y-1">
            <li className="cursor-pointer hover:text-white transition-colors" onClick={() => setMessage("Tell me about yourself")}>• "Tell me about yourself"</li>
            <li className="cursor-pointer hover:text-white transition-colors" onClick={() => setMessage("What were your favorite hobbies?")}>• "What were your favorite hobbies?"</li>
            <li className="cursor-pointer hover:text-white transition-colors" onClick={() => setMessage("Share a memorable story from your life")}>• "Share a memorable story from your life"</li>
            <li className="cursor-pointer hover:text-white transition-colors" onClick={() => setMessage("What advice would you give to future generations?")}>• "What advice would you give to future generations?"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}