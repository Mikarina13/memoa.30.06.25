import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Link, ExternalLink, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations'; 
import { TavusAPI } from '../lib/tavus-api';
import { useAuth } from '../hooks/useAuth';

interface TavusAvatarInterfaceProps {
  onAvatarCreated?: (avatarId: string) => void;
  onClose?: () => void;
}

export function TavusAvatarInterface({ onAvatarCreated, onClose }: TavusAvatarInterfaceProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'replica-id'>('replica-id');
  
  // Conversation link input states
  const [conversationLink, setConversationLink] = useState('');
  const [replicaIdStatus, setReplicaIdStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');
  const [replicaIdError, setReplicaIdError] = useState<string | null>(null);
  const [currentReplicaId, setCurrentReplicaId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCurrentReplicaId();
    }
  }, [user]);

  const loadCurrentReplicaId = async () => {
    try {
      const profile = await MemoirIntegrations.getMemoirProfile(user.id);
      if (profile?.tavus_avatar_id) {
        setCurrentReplicaId(profile.tavus_avatar_id);
      }
    } catch (error) {
      console.error('Error loading current replica ID:', error);
    }
  };

  const extractReplicaIdFromLink = (link: string): string | null => {
    // Extract replica ID from conversation link
    // Example: https://tavus.io/conversation/abc123
    try {
      const url = new URL(link);
      if (url.hostname.includes('tavus.io') && url.pathname.includes('/conversation/')) {
        const pathParts = url.pathname.split('/');
        const replicaId = pathParts[pathParts.length - 1];
        return replicaId || null;
      }
    } catch (e) {
      // Invalid URL format
      return null;
    }
    return null;
  };

  const handleConversationLinkSave = async () => {
    if (!user || !conversationLink.trim()) return;

    const trimmedLink = conversationLink.trim();
    const extractedId = extractReplicaIdFromLink(trimmedLink);
    
    if (!extractedId) {
      setReplicaIdError('Invalid conversation link format. Please enter a valid Tavus conversation link.');
      return;
    }

    setReplicaIdStatus('saving');
    setReplicaIdError(null);

    try {
      // Save the replica ID to the profile
      await MemoirIntegrations.storeTavusAvatarId(user.id, extractedId);
      
      // Update integration status to mark avatar as created
      const integrationStatus = {
        status: 'completed',
        avatar_created: true,
        last_updated: new Date().toISOString()
      };
      
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'tavus', integrationStatus);
      
      setCurrentReplicaId(extractedId);
      setConversationLink('');
      setReplicaIdStatus('success');
      onAvatarCreated?.(extractedId);

      // Auto-reset status after 3 seconds
      setTimeout(() => {
        setReplicaIdStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error saving replica ID:', error);
      setReplicaIdStatus('error');
      setReplicaIdError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const openTavusAffiliate = () => {
    const affiliateLink = TavusAPI.getAffiliateLink('memoa');
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
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Avatar Creation Studio</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Current Replica ID Display */}
        {currentReplicaId && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Replica ID Connected:</span>
            </div>
            <p className="text-white/70 text-sm mt-1 font-mono">{currentReplicaId}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Main Content - Tavus Video Avatar */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Tavus Video Avatar</h3>
            </div>
            
            <p className="text-white/70 mb-4">
              Create a lifelike digital avatar using Tavus. Upload videos to Tavus and get a replica ID to connect to your MEMOĀ account.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={openTavusAffiliate}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Create Avatar with Tavus
              </button>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">How to create your avatar:</h4>
              <ol className="text-white/70 text-sm space-y-2 list-decimal pl-5">
                <li>Click the button above to visit Tavus</li>
                <li>Sign up for an account with $150 in free credits</li>
                <li>Upload videos of yourself speaking (or your loved one)</li>
                <li>Create your replica and copy your Conversation Link</li>
                <li>Paste the link below to connect it to your MEMOĀ account</li>
              </ol>
            </div>
          </div>

          {/* Replica ID Input */}
          <div className="bg-white/5 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Link className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Connect Existing Conversation</h3>
            </div>
            
            <p className="text-white/70 mb-4">
              If you already have a Tavus conversation, you can connect it directly by entering your conversation link.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tavus Conversation Link</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://tavus.io/conversation/your-conversation-id"
                    value={conversationLink}
                    onChange={(e) => setConversationLink(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleConversationLinkSave();
                      }
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm"
                  />
                  <button
                    onClick={handleConversationLinkSave}
                    disabled={!conversationLink.trim() || replicaIdStatus === 'validating' || replicaIdStatus === 'saving'}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {replicaIdStatus === 'validating' || replicaIdStatus === 'saving' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {replicaIdStatus === 'validating' ? 'Validating...' : 'Saving...'}
                      </>
                    ) : replicaIdStatus === 'success' ? (
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

              {replicaIdError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {replicaIdError}
                </div>
              )}

              {replicaIdStatus === 'success' && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  Replica ID successfully saved and connected to your profile!
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="text-purple-400 font-medium mb-2">Where to find your Conversation Link:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Go to <a href="https://tavus.io/dashboard" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Tavus Dashboard</a></li>
                <li>• Navigate to your Conversations section</li>
                <li>• Click on the conversation you want to use</li>
                <li>• Copy the URL from your browser's address bar</li>
                <li>• It should look like: https://tavus.io/conversation/abc123</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Benefits of connecting your Tavus avatar:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Create realistic video messages for future viewers</li>
                <li>• Preserve your visual presence and expressions</li>
                <li>• Enable interactive video conversations</li>
                <li>• Add a personal touch to your digital legacy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}