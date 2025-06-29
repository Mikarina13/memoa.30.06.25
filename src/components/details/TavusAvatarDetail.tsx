import { useState, useRef, useEffect } from 'react';
import { Camera, ExternalLink, Play, Pause, Send, Loader, AlertCircle, MessageSquare, RefreshCw, Info, X, Globe, Link } from 'lucide-react';
import { MemoirIntegrations } from '../../lib/memoir-integrations';
import { TavusAPI } from '../../lib/tavus-api';
import { useAuth } from '../../hooks/useAuth';

interface TavusAvatarDetailProps {
  data: {
    avatarId: string;
    status: string;
    memoriaProfileId?: string;
  };
}

export function TavusAvatarDetail({ data }: TavusAvatarDetailProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{text: string, isUser: boolean, videoUrl?: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ 
    apiKey?: string, 
    replicaId: string, 
    personaId?: string, 
    conversationId?: string, 
    conversationName?: string 
  } | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);
  const [showInfoBox, setShowInfoBox] = useState(false);
  
  // Reference to the chat container for scrolling
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Video element reference
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Default avatar image for placeholder
  const defaultAvatarImage = 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1';
  
  // Reference for polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load Tavus credentials on component mount
  useEffect(() => {
    loadTavusCredentials();
    
    return () => {
      // Clean up polling interval on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);
  
  // Scroll to bottom of chat when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const loadTavusCredentials = async () => {
    if (!user) return;
    
    setIsLoadingCredentials(true);
    try {
      // Load Tavus credentials from the user's profile
      const tavsCredentials = await MemoirIntegrations.getTavusCredentials(
        user.id, 
        data.memoriaProfileId
      );
      
      if (tavsCredentials) {
        setCredentials({
          apiKey: tavsCredentials.tavus_api_key,
          replicaId: tavsCredentials.tavus_avatar_id || data.avatarId,
          personaId: tavsCredentials.tavus_persona_id,
          conversationId: tavsCredentials.tavus_conversation_id,
          conversationName: tavsCredentials.tavus_conversation_name
        });
        console.log('Tavus credentials loaded');
      } else {
        console.log('No Tavus credentials found, using avatarId from props', data.avatarId);
        setCredentials({
          replicaId: data.avatarId
        });
      }
    } catch (err) {
      console.error('Error loading Tavus credentials:', err);
      setError('Failed to load Tavus credentials. Please try again later.');
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
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
      // Check if we have an API key and replica ID
      if (!credentials || !credentials.apiKey) {
        throw new Error('Tavus API key not configured. Please set up your Tavus integration in the dashboard.');
      }
      
      if (!credentials.replicaId) {
        throw new Error('Tavus Replica ID not configured. Please set up your Tavus integration in the dashboard.');
      }
      
      const tavusApi = new TavusAPI(credentials.apiKey);
      
      // Send message to Tavus API
      const response = await tavusApi.sendMessage({
        replica_id: credentials.replicaId,
        persona_id: credentials.personaId,
        message: userMessage
      });
      
      console.log('Tavus video generation initiated:', response);
      
      // Add a placeholder response to chat history
      setChatHistory(prev => [...prev, {
        text: "Generating video response...",
        isUser: false
      }]);
      
      // Start polling for video status
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      let attempts = 0;
      const maxAttempts = 30; // Maximum polling attempts (5 minutes at 10-second intervals)
      
      pollingIntervalRef.current = setInterval(async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          // Stop polling if max attempts reached
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setError('Video generation timed out. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        try {
          const videoStatus = await tavusApi.getVideo(response.id);
          console.log('Video status:', videoStatus);
          
          if (videoStatus.status === 'ready' && videoStatus.url) {
            // Video is ready
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            // Update the last message with the video URL
            setChatHistory(prev => {
              const newHistory = [...prev];
              const lastMessage = newHistory[newHistory.length - 1];
              if (!lastMessage.isUser) {
                newHistory[newHistory.length - 1] = {
                  ...lastMessage,
                  text: "Video response ready:",
                  videoUrl: videoStatus.url
                };
              }
              return newHistory;
            });
            
            // Show the video
            setCurrentVideoUrl(videoStatus.url);
            setVideoVisible(true);
            
            const video = videoRef.current;
            if (video) {
              video.src = videoStatus.url;
              video.load();
              video.play().then(() => {
                setIsPlaying(true);
              }).catch(error => {
                console.error('Error playing video:', error);
              });
            }
            
            setIsProcessing(false);
          } else if (videoStatus.status === 'failed') {
            // Video generation failed
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            throw new Error('Video generation failed. Please try again.');
          }
          // Continue polling for other statuses (pending, processing)
        } catch (pollingError) {
          console.error('Error checking video status:', pollingError);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          setError(pollingError instanceof Error ? pollingError.message : 'Failed to check video status');
          setIsProcessing(false);
        }
      }, 10000); // Check every 10 seconds
      
    } catch (err) {
      console.error('Error sending message to Tavus:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsProcessing(false);
      
      // Add error message to chat
      setChatHistory(prev => [...prev, {
        text: "Error: Failed to generate video response. Please check your Tavus configuration.",
        isUser: false
      }]);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Video Avatar</h2>
      
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Interactive Video Avatar</h3>
          </div>
          
          <button
            onClick={() => setShowInfoBox(!showInfoBox)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Information"
          >
            <Info className="w-5 h-5 text-white/70" />
          </button>
        </div>
        
        {/* Information Box */}
        <AnimatePresence>
          {showInfoBox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/50 rounded-lg p-4 mb-4 border border-white/10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-white font-medium">About Tavus Integration</h4>
                <button
                  onClick={() => setShowInfoBox(false)}
                  className="p-1 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-white/70 text-sm mb-3">
                Tavus is an AI video platform that creates personalized videos at scale. The integration works as follows:
              </p>
              
              <ol className="text-white/70 text-sm space-y-2 list-decimal pl-5 mb-3">
                <li>You send a message to your Tavus avatar</li>
                <li>The message is sent to Tavus API to generate a video response</li>
                <li>This process takes time (usually 30-60 seconds)</li>
                <li>Once ready, the video response appears in the chat</li>
              </ol>
              
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <p className="text-purple-300 text-sm">
                  <strong>Note:</strong> You need a valid Tavus API key, Replica ID, and optionally a Persona ID for this feature to work. If you haven't set these up yet, go to the Memoir dashboard and set up your Tavus integration.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Avatar ID</h4>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
              Ready
            </span>
          </div>
          <p className="text-white/70 text-sm font-mono">{data.avatarId}</p>
          
          {credentials?.personaId && (
            <div className="mt-2">
              <h4 className="text-white font-medium text-sm">Persona ID</h4>
              <p className="text-white/70 text-sm font-mono">{credentials.personaId}</p>
            </div>
          )}
          
          {credentials?.conversationId && (
            <div className="mt-2">
              <h4 className="text-white font-medium text-sm flex items-center gap-1">
                <Link className="w-4 h-4 text-blue-400" />
                Conversation ID
              </h4>
              <p className="text-white/70 text-sm font-mono">{credentials.conversationId}</p>
            </div>
          )}
          
          {credentials?.conversationName && (
            <div className="mt-2">
              <h4 className="text-white font-medium text-sm">Conversation Name</h4>
              <p className="text-white/70 text-sm font-mono">{credentials.conversationName}</p>
            </div>
          )}
        </div>
        
        <div className="bg-black/30 rounded-lg overflow-hidden mb-6">
          <div className="relative aspect-video bg-black/50">
            {isLoadingCredentials ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader className="w-8 h-8 text-white/50 animate-spin" />
                  <p className="text-white/70">Loading Tavus credentials...</p>
                </div>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef}
                  src={currentVideoUrl || undefined}
                  className={`w-full h-full object-contain transition-opacity duration-300 ${videoVisible ? 'opacity-100' : 'opacity-0'}`}
                  onEnded={() => setIsPlaying(false)}
                  poster={defaultAvatarImage}
                  preload="auto"
                ></video>
                
                <div className={`absolute inset-0 flex items-center justify-center ${videoVisible && isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                  {!currentVideoUrl && (
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
                  )}
                </div>
              </>
            )}
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
          <div 
            id="chat-container" 
            ref={chatContainerRef}
            className="p-4 h-64 overflow-y-auto space-y-3 bg-black/30 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
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
                    {msg.videoUrl && (
                      <button
                        onClick={() => {
                          setCurrentVideoUrl(msg.videoUrl);
                          setVideoVisible(true);
                          const video = videoRef.current;
                          if (video) {
                            video.src = msg.videoUrl;
                            video.load();
                            video.play().then(() => {
                              setIsPlaying(true);
                            }).catch(err => console.error('Error playing video:', err));
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-sm flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Play Video
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-white/90 flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating video response...</span>
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
          
          {!credentials?.apiKey && !isLoadingCredentials && (
            <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Tavus API key not configured</p>
                <p className="text-yellow-400/80">Please set up your Tavus integration in the dashboard first.</p>
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isProcessing || !credentials?.apiKey || isLoadingCredentials}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isProcessing && credentials?.apiKey) {
                  sendMessage();
                  // Keep focus on input after sending
                  e.currentTarget.focus();
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isProcessing || !credentials?.apiKey || isLoadingCredentials}
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
            {credentials?.conversationId && (
              <li>• Web-based conversation interface via Tavus</li>
            )}
          </ul>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="space-y-1">
            <h4 className="text-white font-medium">Video Avatar</h4>
            <p className="text-white/60 text-sm">Send messages to generate video responses</p>
          </div>
          
          <div className="flex gap-2">
            {credentials?.conversationId && (
              <a
                href={TavusAPI.getConversationUrl(credentials.conversationId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                Open Conversation
              </a>
            )}
            
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