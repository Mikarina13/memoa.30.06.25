import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ExternalLink, CheckCircle, AlertCircle, Link, Save } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { ElevenLabsAPI } from '../lib/elevenlabs-api';
import { useAuth } from '../hooks/useAuth';

interface VoiceRecordingInterfaceProps {
  memoriaProfileId?: string;
  onVoiceCloned?: (voiceId: string) => void;
  onClose?: () => void;
}

export function VoiceRecordingInterface({ memoriaProfileId, onVoiceCloned, onClose }: VoiceRecordingInterfaceProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'voice-id'>('voice-id');
  
  // Voice ID input states
  const [inputVoiceId, setInputVoiceId] = useState('');
  const [voiceIdStatus, setVoiceIdStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');
  const [voiceIdError, setVoiceIdError] = useState<string | null>(null);
  const [currentVoiceId, setCurrentVoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCurrentVoiceId();
    }
  }, [user]);

  const loadCurrentVoiceId = async () => {
    try {
      if (memoriaProfileId) {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        if (profile?.elevenlabs_voice_id) {
          setCurrentVoiceId(profile.elevenlabs_voice_id);
        }
      } else {
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        if (profile?.elevenlabs_voice_id) {
          setCurrentVoiceId(profile.elevenlabs_voice_id);
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
      setVoiceIdStatus('saving');

      // Save the voice ID to the profile
      if (memoriaProfileId) {
        await MemoirIntegrations.storeElevenLabsVoiceId(user.id, trimmedId, memoriaProfileId);
      } else {
        await MemoirIntegrations.storeElevenLabsVoiceId(user.id, trimmedId);
      }
      
      // Update integration status to completed
      const integrationStatus = {
        status: 'completed',
        voice_cloned: true,
        last_updated: new Date().toISOString()
      };
      
      await MemoirIntegrations.updateIntegrationStatus(
        user.id, 
        'elevenlabs', 
        integrationStatus, 
        memoriaProfileId
      );
      
      setCurrentVoiceId(trimmedId);
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

  const openElevenLabsAffiliate = () => {
    const affiliateLink = "https://try.elevenlabs.io/e7shgcs7r0ae";
    window.open(affiliateLink, '_blank');
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

        <div className="space-y-6">
          {/* Main Content - ElevenLabs Voice Studio */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-6 border border-blue-500/30 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Volume2 className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                {memoriaProfileId ? "ElevenLabs Voice Recreation" : "ElevenLabs Voice Cloning"}
              </h3>
            </div>
            
            {memoriaProfileId ? (
              <p className="text-white/70 mb-4">
                Use ElevenLabs to recreate your loved one's voice. You can use their audio recordings to create a realistic voice clone.
              </p>
            ) : (
              <p className="text-white/70 mb-4">
                Use ElevenLabs to create a clone of your voice. Upload audio recordings to ElevenLabs and get a Voice ID to use in your digital legacy.
              </p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={openElevenLabsAffiliate}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                {memoriaProfileId ? "Create Voice in ElevenLabs" : "Clone Your Voice with ElevenLabs"}
              </button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Voice Creation Guide:</h4>
              <ol className="text-white/70 text-sm space-y-2 list-decimal pl-5">
                <li>Click the button above to visit ElevenLabs</li>
                <li>Sign up for an account</li>
                <li>Use Voice Lab to record or upload audio samples (30+ seconds recommended)</li>
                <li>Create your voice clone and copy your Voice ID</li>
                <li>Paste the Voice ID below to connect it to your MEMOĀ account</li>
              </ol>
            </div>
          </div>

          {/* Voice ID Input */}
          <div className="bg-white/5 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Link className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Enter ElevenLabs Voice ID
              </h3>
            </div>
            
            <p className="text-white/70 mb-4">
              After creating a voice in ElevenLabs, enter the Voice ID below to connect it to your {memoriaProfileId ? "memorial" : "personal"} profile.
            </p>

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
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                  <button
                    onClick={handleVoiceIdSave}
                    disabled={!inputVoiceId.trim() || voiceIdStatus === 'validating' || voiceIdStatus === 'saving'}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Where to find your Voice ID:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Go to <a href="https://elevenlabs.io/app/voice-lab" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">ElevenLabs Voice Lab</a></li>
                <li>• Click on your cloned voice</li>
                <li>• The Voice ID is displayed in the voice details</li>
                <li>• It's a 20+ character alphanumeric string</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">Benefits of voice cloning with ElevenLabs:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Professional-quality voice synthesis</li>
                <li>• High-definition audio</li>
                <li>• Premium voice cloning technology</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}