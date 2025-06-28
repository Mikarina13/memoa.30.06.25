import { useState } from 'react';
import { Volume2, Play, Pause, Mic, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import { ElevenLabsAPI } from '../../lib/elevenlabs-api';

interface VoiceDetailProps {
  data: {
    voiceId: string;
    status: string;
  };
  memoriaProfileId?: string; // Add prop to determine if this is a Memoria profile
}

export function VoiceDetail({ data, memoriaProfileId }: VoiceDetailProps) {
  // Initialize text based on profile type
  const defaultMessage = memoriaProfileId
    ? "Hello, this is my voice preserved in the digital realm. Welcome to my memorial space."
    : "Hello, this is my voice preserved in the digital realm. I've created this to enhance my digital legacy.";
    
  const [textToSpeak, setTextToSpeak] = useState(defaultMessage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const generateAndPlaySpeech = async () => {
    if (!textToSpeak.trim()) return;
    
    setGenerationStatus('generating');
    setError(null);
    
    try {
      // Check if we have an API key
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
            
      if (!apiKey) {
        throw new Error('ElevenLabs API key is not configured. Please add VITE_ELEVENLABS_API_KEY to your .env file with your actual API key from https://elevenlabs.io/app/subscription');
      }
      
      if (apiKey === 'your_elevenlabs_api_key_here') {
        throw new Error('Please replace the placeholder ElevenLabs API key in your .env file with your actual API key from https://elevenlabs.io/app/subscription');
      }
      
      if (apiKey.length < 20) {
        throw new Error('The ElevenLabs API key appears to be invalid. Please ensure you have copied the complete API key from https://elevenlabs.io/app/subscription');
      }
      
      // Initialize the API client
      const elevenLabsAPI = new ElevenLabsAPI(apiKey);
      
      // Skip validation and go straight to speech generation
      
      // Generate speech
      const audioBuffer = await elevenLabsAPI.textToSpeech(
        data.voiceId,
        { 
          text: textToSpeak,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }
      );
      
      // Create a blob URL for the audio
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous audio URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Clean up previous audio element
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      
      setAudioUrl(url);
      
      // Play the audio
      const newAudio = new Audio(url);
      newAudio.onended = () => setIsPlaying(false);
      newAudio.play();
      setIsPlaying(true);
      setAudio(newAudio);
      setGenerationStatus('success');
      
    } catch (err) {
      console.error('Error generating speech:', err);
      let errorMessage = 'Failed to generate speech';
      
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Invalid ElevenLabs API key or insufficient permissions. Please check your API key configuration.';
        } else if (err.message.includes('403')) {
          errorMessage = 'ElevenLabs API key does not have permission to use this voice or feature.';
        } else if (err.message.includes('429')) {
          errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.';
        } else if (err.message.includes('quota')) {
          errorMessage = 'ElevenLabs API quota exceeded. Please check your subscription.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setGenerationStatus('error');
    } finally {
      if (generationStatus !== 'success') {
        setGenerationStatus('idle');
      }
    }
  };

  const togglePlayback = () => {
    if (!audioUrl || !audio) return;
    
    if (isPlaying) {
      // Stop playback
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      // Start playback
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Interactive Voice Clone</h2>
      
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Interactive Voice Clone</h3>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Voice ID</h4>
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
              Ready
            </span>
          </div>
          <p className="text-white/70 text-sm font-mono">{data.voiceId}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Enter text to hear this voice speak</label>
            <textarea
              value={textToSpeak}
              onChange={(e) => setTextToSpeak(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 h-24 resize-none"
              placeholder="Type something to hear this voice speak..."
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={generateAndPlaySpeech}
              disabled={generationStatus === 'generating' || !textToSpeak.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {generationStatus === 'generating' ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Generate Speech
                </>
              )}
            </button>
            
            {audioUrl && generationStatus === 'success' && (
              <button
                type="button"
                onClick={togglePlayback}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
            )}
            
            <a
              href="https://elevenlabs.io/app/voice-lab"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Manage in ElevenLabs
            </a>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {generationStatus === 'success' && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              Speech generated successfully! You can play it again or generate new speech with different text.
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-blue-400 font-medium mb-2">Voice Features:</h4>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Create text-to-speech audio with this voice</li>
            <li>• Add voice narration to memory points</li>
            <li>• Preserve the unique vocal characteristics</li>
            <li>• Create personalized audio messages</li>
            <li>• Use for guided tours in memorial spaces</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-purple-400 font-medium mb-2">Try Saying:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Conditional sample messages based on profile type */}
            {memoriaProfileId ? (
              // Messages for MEMORIA profiles (memorial for someone who has passed)
              <>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("Hello, I'm glad you're visiting my memorial space. This is what my voice sounded like.")}
                >
                  Welcome Message
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("I want to share some of my favorite memories with you. These are the moments that shaped who I am.")}
                >
                  Memory Introduction
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("Thank you for keeping my memory alive. It means the world to me that you're here.")}
                >
                  Thank You Message
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("This is a personal message just for you. I hope it brings you comfort to hear my voice again.")}
                >
                  Personal Message
                </button>
              </>
            ) : (
              // Messages for MEMOIR profiles (user's own profile while still alive)
              <>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("Hello and welcome to my digital legacy. I've created this space to share my life stories and experiences with you.")}
                >
                  Welcome Message
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("I want to share some of my favorite memories with you. These moments have shaped who I am and what I value.")}
                >
                  Memory Introduction
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("I'm glad you're exploring my digital legacy. I hope you find it meaningful and insightful.")}
                >
                  Greeting Message
                </button>
                <button 
                  className="text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm transition-colors"
                  onClick={() => setTextToSpeak("This is a personal reflection on what matters most to me. I hope these thoughts resonate with you in some way.")}
                >
                  Personal Reflection
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}