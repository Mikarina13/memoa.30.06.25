import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Upload, ExternalLink, CheckCircle, AlertCircle, Volume2, Download, Trash2, Link, Save } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { ElevenLabsAPI } from '../lib/elevenlabs-api';
import { useAuth } from '../hooks/useAuth';

interface AudioFile {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
}

interface VoiceRecordingInterfaceProps {
  memoriaProfileId?: string;
  onVoiceCloned?: (voiceId: string) => void;
  onClose?: () => void;
}

export function VoiceRecordingInterface({ memoriaProfileId, onVoiceCloned, onClose }: VoiceRecordingInterfaceProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFiles, setRecordedFiles] = useState<AudioFile[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [cloneStatus, setCloneStatus] = useState<'idle' | 'cloning' | 'success' | 'error'>('idle');
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'record' | 'voice-id'>('record');
  
  // Voice ID input states
  const [inputVoiceId, setInputVoiceId] = useState('');
  const [voiceIdStatus, setVoiceIdStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');
  const [voiceIdError, setVoiceIdError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const recordingStartTime = useRef<number>(0);

  useEffect(() => {
    if (user) {
      loadCurrentVoiceId();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      // Cleanup audio URLs
      recordedFiles.forEach(file => {
        URL.revokeObjectURL(file.url);
        if (audioRefs.current[file.id]) {
          audioRefs.current[file.id].pause();
          delete audioRefs.current[file.id];
        }
      });
    };
  }, [recordedFiles]);

  const loadCurrentVoiceId = async () => {
    try {
      if (memoriaProfileId) {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        if (profile?.elevenlabs_voice_id) {
          setCurrentVoiceId(profile.elevenlabs_voice_id);
          setVoiceId(profile.elevenlabs_voice_id);
        }
      } else {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.elevenlabs_voice_id) {
          setCurrentVoiceId(profile.elevenlabs_voice_id);
          setVoiceId(profile.elevenlabs_voice_id);
        }
      }
    } catch (error) {
      console.error('Error loading current voice ID:', error);
    }
  };

  const validateVoiceId = (id: string): boolean => {
    // ElevenLabs voice IDs are typically 20-character alphanumeric strings
    const voiceIdRegex = /^[a-zA-Z0-9]{20,}$/;
    return voiceIdRegex.test(id.trim());
  };

  const handleVoiceIdSave = async () => {
    if (!user || !inputVoiceId.trim()) return;

    const trimmedId = inputVoiceId.trim();
    
    if (!validateVoiceId(trimmedId)) {
      setVoiceIdError('Invalid voice ID format. Voice IDs should be 20+ character alphanumeric strings.');
      return;
    }

    setVoiceIdStatus('validating');
    setVoiceIdError(null);

    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      
      if (apiKey && memoriaProfileId) {
        // Validate the voice ID exists in ElevenLabs for Memoria profile
        const elevenLabsAPI = new ElevenLabsAPI(apiKey);
        
        try {
          await elevenLabsAPI.getVoice(trimmedId);
        } catch (error) {
          if (error instanceof Error && error.message.includes('404')) {
            setVoiceIdError('Voice ID not found in your ElevenLabs account. Please check the ID and try again.');
            setVoiceIdStatus('error');
            return;
          }
        }

        setVoiceIdStatus('saving');

        // Save the voice ID to the Memoria profile
        await MemoirIntegrations.storeElevenLabsVoiceId(user.id, trimmedId, memoriaProfileId);
        
        setCurrentVoiceId(trimmedId);
        setVoiceId(trimmedId);
        setInputVoiceId('');
        setVoiceIdStatus('success');
        onVoiceCloned?.(trimmedId);
      } else if (apiKey) {
        // Validate the voice ID exists in ElevenLabs
        const elevenLabsAPI = new ElevenLabsAPI(apiKey);
        
        try {
          await elevenLabsAPI.getVoice(trimmedId);
        } catch (error) {
          if (error instanceof Error && error.message.includes('404')) {
            setVoiceIdError('Voice ID not found in your ElevenLabs account. Please check the ID and try again.');
            setVoiceIdStatus('error');
            return;
          }
        }
      }

      setVoiceIdStatus('saving');

      // Save the voice ID to the profile
      await MemoirIntegrations.storeElevenLabsVoiceId(user.id, trimmedId);
      
      setCurrentVoiceId(trimmedId);
      setVoiceId(trimmedId);
      setInputVoiceId('');
      setVoiceIdStatus('success');
      onVoiceCloned?.(trimmedId);

      // Auto-reset status after 3 seconds
      setTimeout(() => {
        setVoiceIdStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error saving voice ID:', error);
      setVoiceIdStatus('error');
      setVoiceIdError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      audioContextRef.current = new AudioContext({ sampleRate: 44100 });
      
      // Use a more compatible audio format for better ElevenLabs compatibility
      const options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options.mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else {
        options.mimeType = 'audio/webm';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      chunksRef.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - recordingStartTime.current) / 1000;
        
        const newFile: AudioFile = {
          id: `recording-${Date.now()}`,
          name: `Voice Recording ${recordedFiles.length + 1}`,
          blob,
          url,
          duration,
          timestamp: new Date()
        };

        setRecordedFiles(prev => [...prev, newFile]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = (file: AudioFile) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => audio.pause());
    
    if (currentlyPlaying === file.id) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(file.url);
    audioRefs.current[file.id] = audio;
    
    audio.onended = () => {
      setCurrentlyPlaying(null);
      delete audioRefs.current[file.id];
    };

    audio.play();
    setCurrentlyPlaying(file.id);
  };

  const deleteFile = (fileId: string) => {
    const file = recordedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
      if (audioRefs.current[fileId]) {
        audioRefs.current[fileId].pause();
        delete audioRefs.current[fileId];
      }
      if (currentlyPlaying === fileId) {
        setCurrentlyPlaying(null);
      }
    }
    setRecordedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file);
        const newFile: AudioFile = {
          id: `upload-${Date.now()}-${index}`,
          name: file.name,
          blob: file,
          url,
          duration: 0, // We'll get this when audio loads
          timestamp: new Date()
        };
        
        setRecordedFiles(prev => [...prev, newFile]);
      }
    });
    
    event.target.value = ''; // Reset input
  };

  const openElevenLabsAffiliate = () => {
    const affiliateLink = ElevenLabsAPI.getAffiliateLink('memoa', 'WORLDSLARGESTHACKATHON-0bb0fa21');
    window.open(affiliateLink, '_blank');
    setShowAffiliatePrompt(false);
  };

  const cloneVoiceWithElevenLabs = async () => {
    if (!user || recordedFiles.length === 0) return;

    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      setShowAffiliatePrompt(true);
      return;
    }

    setCloneStatus('cloning');
    setCloneError(null);

    try {
      // Initialize ElevenLabs API client
      const elevenLabsAPI = new ElevenLabsAPI(apiKey);

      // Validate API key
      const isValid = await elevenLabsAPI.validateApiKey();
      if (!isValid) {
        throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
      }

      // Convert audio files to proper format for ElevenLabs
      const audioFiles: File[] = [];
      
      for (const audioFile of recordedFiles.slice(0, 3)) { // ElevenLabs recommends 1-3 high-quality samples
        // Determine the best file type for ElevenLabs
        let fileName = audioFile.name;
        let mimeType = 'audio/wav'; // Default to WAV for best quality
        
        // If it's already a supported format, keep it
        if (audioFile.blob.type.includes('wav') || audioFile.blob.type.includes('mp3') || audioFile.blob.type.includes('flac')) {
          mimeType = audioFile.blob.type;
        }
        
        // Ensure proper file extension
        if (!fileName.match(/\.(wav|mp3|flac|m4a)$/i)) {
          fileName += '.wav';
        }

        const file = new File([audioFile.blob], fileName, { type: mimeType });
        audioFiles.push(file);
      }

      // Update integration status to in_progress
      if (memoriaProfileId) {
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'elevenlabs', {
          status: 'in_progress'
        }, memoriaProfileId);
      } else {
        await MemoirIntegrations.updateIntegrationStatus(user.id, 'elevenlabs', {
          status: 'in_progress'
        });
      }

      // Clone the voice using the API client
      const cloneRequest = {
        name: `MEMOIR Voice - ${user.email?.split('@')[0] || 'User'}`,
        description: `Voice cloned via MEMOA platform for digital legacy preservation`,
        files: audioFiles,
        labels: {
          platform: 'memoa',
          module: 'memoir',
          user_id: user.id
        }
      };

      const result = await elevenLabsAPI.cloneVoice(cloneRequest);
      const newVoiceId = result.voice_id;

      // Store voice ID in our database
      if (memoriaProfileId) {
        await MemoirIntegrations.storeElevenLabsVoiceId(user.id, newVoiceId, memoriaProfileId);
      } else {
        await MemoirIntegrations.storeElevenLabsVoiceId(user.id, newVoiceId);
      }
      
      setVoiceId(newVoiceId);
      setCurrentVoiceId(newVoiceId);
      setCloneStatus('success');
      onVoiceCloned?.(newVoiceId);

    } catch (error) {
      console.error('Error cloning voice:', error);
      setCloneStatus('error');
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          setCloneError('Invalid API key. Please check your ElevenLabs configuration.');
        } else if (error.message.includes('insufficient credits') || error.message.includes('quota')) {
          setCloneError('Insufficient ElevenLabs credits. Please upgrade your plan.');
        } else if (error.message.includes('audio quality') || error.message.includes('sample')) {
          setCloneError('Audio quality too low. Please record clearer, longer samples (at least 30 seconds each).');
        } else {
          setCloneError(error.message);
        }
      } else {
        setCloneError('An unexpected error occurred. Please try again.');
      }

      // Update integration status to error
      if (user && memoriaProfileId) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'elevenlabs', {
            status: 'error'
          }, memoriaProfileId);
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      } else if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'elevenlabs', {
            status: 'error'
          });
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-70 p-4"
    >
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">
            {memoriaProfileId ? "Voice Recreation Studio" : "Voice Recording Studio"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Current Voice ID Display */}
        {currentVoiceId && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Voice ID Connected:</span>
            </div>
            <p className="text-white/70 text-sm mt-1 font-mono">
              {currentVoiceId}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'record' ? 'bg-blue-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('record')}
          >
            {memoriaProfileId ? "Upload & Clone" : "Record & Clone"}
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'voice-id' ? 'bg-blue-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('voice-id')}
          >
            Enter Voice ID
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'record' && (
            <>
              {/* Recording Controls */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {memoriaProfileId ? "Upload Voice Recordings" : "Record Your Voice"}
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </button>
                  
                  <label className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                    Upload Audio
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {isRecording && (
                  <div className="mt-4 flex items-center gap-2 text-red-400">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Recording in progress...</span>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Recording Tips:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    {memoriaProfileId ? (
                      <>
                        <li>• Use existing voice messages or recordings</li>
                        <li>• Clear audio without background noise works best</li>
                        <li>• Aim for 30+ seconds per recording</li>
                        <li>• Multiple samples improve voice recreation quality</li>
                      </>
                    ) : (
                      <>
                        <li>• Record in a quiet environment</li>
                        <li>• Speak clearly and naturally</li>
                        <li>• Aim for 30+ seconds per recording</li>
                        <li>• Multiple samples improve quality</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recorded Files */}
              {recordedFiles.length > 0 && (
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recorded Audio Files</h3>
                  <div className="space-y-3">
                    {recordedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => playAudio(file)}
                            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                          >
                            {currentlyPlaying === file.id ? (
                              <Pause className="w-5 h-5 text-white" />
                            ) : (
                              <Play className="w-5 h-5 text-white" />
                            )}
                          </button>
                          <div>
                            <div className="text-white font-medium">{file.name}</div>
                            <div className="text-white/60 text-sm">
                              {file.duration > 0 ? formatDuration(file.duration) : 'Unknown duration'} • {file.timestamp.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            download={file.name}
                            className="p-2 text-white/60 hover:text-white transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => deleteFile(file.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ElevenLabs Integration */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Volume2 className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    {memoriaProfileId ? "ElevenLabs Voice Recreation" : "ElevenLabs Voice Cloning"}
                  </h3>
                </div>
                
                {memoriaProfileId ? (
                  <p className="text-white/70 mb-4">
                    Recreate your loved one's voice with industry-leading AI technology. Get realistic voice synthesis for their digital memorial.
                  </p>
                ) : (
                  <p className="text-white/70 mb-4">
                    Clone your voice with industry-leading AI technology. Get realistic voice synthesis for your digital legacy.
                  </p>
                )}

                {cloneError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {cloneError}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button
                    onClick={cloneVoiceWithElevenLabs}
                    disabled={recordedFiles.length === 0 || cloneStatus === 'cloning'}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {cloneStatus === 'cloning' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cloning Voice...
                      </>
                    ) : cloneStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Voice Cloned!
                      </>
                    ) : cloneStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-5 h-5" />
                        Try Again
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" /> 
                        {memoriaProfileId ? "Recreate Voice" : "Clone Voice"}
                      </>
                    )}
                  </button>

                  <button
                    onClick={openElevenLabsAffiliate}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get ElevenLabs Pro
                  </button>
                </div>

                {cloneStatus === 'success' && voiceId && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Voice successfully cloned!</span>
                    </div>
                    <p className="text-white/70 text-sm mt-1">
                      Voice ID: {voiceId}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'voice-id' && (
            <div className="space-y-6">
              {/* Voice ID Input */}
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Link className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    {memoriaProfileId ? "Connect Existing Voice ID" : "Connect Existing Voice"}
                  </h3>
                </div>
                
                {memoriaProfileId ? (
                  <p className="text-white/70 mb-4">
                    If you already have a voice ID for your loved one in ElevenLabs, you can connect it directly by entering the Voice ID.
                  </p>
                ) : (
                  <p className="text-white/70 mb-4">
                    If you already have a cloned voice in ElevenLabs, you can connect it directly by entering your Voice ID.
                  </p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">ElevenLabs Voice ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter your ElevenLabs Voice ID (e.g., pNInz6obpgDQGcFmaJgB)"
                        value={inputVoiceId}
                        onChange={(e) => setInputVoiceId(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleVoiceIdSave();
                          }
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono text-sm"
                      />
                      <button
                        onClick={handleVoiceIdSave}
                        disabled={!inputVoiceId.trim() || voiceIdStatus === 'validating' || voiceIdStatus === 'saving'}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        {voiceIdStatus === 'validating' || voiceIdStatus === 'saving' ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {voiceIdStatus === 'validating' ? 'Validating...' : 'Saving...'}
                          </>
                        ) : voiceIdStatus === 'success' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {voiceIdError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      {voiceIdError}
                    </div>
                  )}

                  {voiceIdStatus === 'success' && (
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                      Voice ID successfully saved and connected to your profile!
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-400 font-medium mb-2">Where to find your Voice ID:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Go to <a href="https://elevenlabs.io/app/voice-lab" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">ElevenLabs Voice Lab</a></li>
                    <li>• Click on your cloned voice</li>
                    <li>• The Voice ID is displayed in the voice details</li>
                    <li>• It's a 20+ character alphanumeric string</li>
                  </ul>
                </div>

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Benefits of connecting existing voice:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Instantly connect without re-cloning</li>
                    <li>• Use voices cloned with premium settings</li>
                    <li>• Access professional voice clones</li>
                    <li>• Maintain consistency across platforms</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Affiliate Prompt Modal */}
      <AnimatePresence>
        {showAffiliatePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black flex items-center justify-center z-80"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border border-blue-500/30 rounded-xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Get ElevenLabs Pro Access</h3>
              <p className="text-white/70 mb-6">
                To use voice cloning, you'll need an ElevenLabs account. Get 3 months of Creator Tier FREE with our hackathon code!
              </p>
              
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="text-blue-400 font-medium">Hackathon Benefits:</div>
                <ul className="text-white/70 text-sm mt-2 space-y-1">
                  <li>• 100k credits per month</li>
                  <li>• Professional voice cloning</li>
                  <li>• 192 kbps audio quality</li>
                  <li>• 3 months completely FREE</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={openElevenLabsAffiliate}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors"
                >
                  Get Free Access
                </button>
                <button
                  onClick={() => setShowAffiliatePrompt(false)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}