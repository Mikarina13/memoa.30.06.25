import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Link, ExternalLink, CheckCircle, AlertCircle, Save, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations'; 
import { TavusAPI } from '../lib/tavus-api';
import { useAuth } from '../hooks/useAuth';

interface TavusAvatarInterfaceProps {
  memoriaProfileId?: string;
  onAvatarCreated?: (avatarId: string) => void;
  onClose?: () => void;
}

export function TavusAvatarInterface({ memoriaProfileId, onAvatarCreated, onClose }: TavusAvatarInterfaceProps) {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(1); // Step 1: API Key, Step 2: IDs
  const [apiKey, setApiKey] = useState('');
  const [replicaId, setReplicaId] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [conversationLink, setConversationLink] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentReplicaId, setCurrentReplicaId] = useState<string | null>(null);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);
  const [testMessageResponse, setTestMessageResponse] = useState<string | null>(null);
  const [testMessageStatus, setTestMessageStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadCurrentCredentials();
    }
  }, [user]);

  const loadCurrentCredentials = async () => {
    try {
      const credentials = await MemoirIntegrations.getTavusCredentials(user.id, memoriaProfileId);
      
      if (credentials) {
        setCurrentReplicaId(credentials.tavus_avatar_id);
        setReplicaId(credentials.tavus_avatar_id);
        
        if (credentials.tavus_persona_id) {
          setPersonaId(credentials.tavus_persona_id);
        }
        
        if (credentials.tavus_api_key) {
          setApiKey(credentials.tavus_api_key);
        }
      }
    } catch (error) {
      console.error('Error loading current Tavus credentials:', error);
    }
  };

  const extractIdsFromLink = (link: string): { replicaId: string | null, personaId: string | null } => {
    try {
      const conversationId = TavusAPI.extractConversationId(link);
      
      // For now, we don't have a way to extract persona IDs from links
      // Users will need to enter these manually from the Tavus dashboard
      return { 
        replicaId: conversationId,
        personaId: null
      };
    } catch (e) {
      return { replicaId: null, personaId: null };
    }
  };

  const validateApiKey = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!apiKey.trim()) {
      setValidationError('Please enter a Tavus API key');
      return;
    }

    setValidationStatus('validating');
    setValidationError(null);

    try {
      const tavusApi = new TavusAPI(apiKey.trim());
      await tavusApi.validateApiKey(); // This now throws errors instead of returning false
      
      setValidationStatus('success');
      setActiveStep(2); // Move to next step on success
    } catch (error) {
      console.error('Error validating API key:', error);
      setValidationStatus('error');
      
      if (error instanceof Error) {
        // Handle specific error types with appropriate messages
        if (error.message.includes('Network Error')) {
          setValidationError(error.message);
        } else if (error.message.includes('401')) {
          setValidationError('Invalid API key. Please check your Tavus API key and try again.');
        } else if (error.message.includes('403')) {
          setValidationError('Access forbidden. Please check your API key permissions.');
        } else if (error.message.includes('429')) {
          setValidationError('Rate limit exceeded. Please wait a moment and try again.');
        } else {
          setValidationError(error.message);
        }
      } else {
        setValidationError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleSaveCredentials = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    if (!replicaId.trim()) {
      setSaveError('Replica ID is required');
      return;
    }

    // Persona ID is optional but recommended
    // if (!personaId.trim()) {
    //   setSaveError('Persona ID is required');
    //   return;
    // }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      // Save Tavus credentials
      await MemoirIntegrations.storeTavusCredentials(
        user.id, 
        {
          tavus_avatar_id: replicaId.trim(),
          tavus_persona_id: personaId.trim() || undefined,
          tavus_api_key: apiKey.trim()
        }, 
        memoriaProfileId
      );
      
      // Update current replica ID
      setCurrentReplicaId(replicaId);
      
      // Reset form and show success
      setSaveStatus('success');
      
      // Notify parent component
      if (onAvatarCreated) {
        onAvatarCreated(replicaId);
      }

      // Auto-reset success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving Tavus credentials:', error);
      setSaveStatus('error');
      
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleConversationLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const link = e.target.value;
    setConversationLink(link);
    
    // Try to extract replica ID and persona ID from the link
    const { replicaId: extractedReplicaId } = extractIdsFromLink(link);
    if (extractedReplicaId) {
      setReplicaId(extractedReplicaId);
    }
  };

  const sendTestMessage = async () => {
    if (!apiKey || !replicaId) {
      setTestMessageStatus('error');
      setTestMessageResponse('API Key and Replica ID are required for testing');
      return;
    }
    
    setTestMessageStatus('sending');
    setTestMessageResponse(null);
    
    try {
      const tavusApi = new TavusAPI(apiKey);
      
      // Send a simple test message to verify credentials
      const response = await tavusApi.sendMessage({
        replica_id: replicaId,
        persona_id: personaId || undefined,
        message: "Hello, this is a test message to verify the Tavus integration."
      });
      
      if (response && response.id) {
        setTestMessageStatus('success');
        setTestMessageResponse(`Test successful! Video ID: ${response.id}`);
      } else {
        throw new Error('No response from Tavus API');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setTestMessageStatus('error');
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          setTestMessageResponse(error.message);
        } else {
          setTestMessageResponse(`Error: ${error.message}`);
        }
      } else {
        setTestMessageResponse('An unexpected error occurred during testing');
      }
    }
  };
  
  const goBack = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      setValidationStatus('idle');
      setValidationError(null);
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
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-purple-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Memorial Avatar Studio" : "Avatar Creation Studio"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="w-full">
            <div className="relative">
              <div className="flex justify-between mb-2">
                <div className={`text-sm ${activeStep >= 1 ? 'text-purple-400' : 'text-white/40'}`}>API Key</div>
                <div className={`text-sm ${activeStep >= 2 ? 'text-purple-400' : 'text-white/40'}`}>Avatar Details</div>
              </div>
              <div className="h-2 flex rounded-full overflow-hidden bg-white/10">
                <div 
                  className="bg-purple-600 transition-all duration-300 ease-out" 
                  style={{ width: `${(activeStep / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Avatar ID Display */}
        {currentReplicaId && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Tavus Avatar Connected</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="bg-black/30 p-2 rounded text-sm">
                <span className="text-white/60">Replica ID:</span>
                <span className="ml-2 text-white font-mono">{currentReplicaId}</span>
              </div>
              {personaId && (
                <div className="bg-black/30 p-2 rounded text-sm">
                  <span className="text-white/60">Persona ID:</span>
                  <span className="ml-2 text-white font-mono">{personaId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <form onSubmit={validateApiKey} className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Tavus API Integration</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                {memoriaProfileId 
                  ? "Connect your loved one's Tavus account to create interactive videos using their likeness and voice." 
                  : "Connect your Tavus account to create interactive videos using your likeness and voice."}
              </p>

              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={openTavusAffiliate}
                  type="button"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Go to Tavus
                </button>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-purple-400 font-medium">Getting Started:</h4>
                  <button 
                    type="button"
                    onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
                    className="text-xs px-2 py-1 bg-white/10 rounded text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    {showApiKeyInfo ? 'Hide Info' : 'Show Info'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showApiKeyInfo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ol className="text-white/70 text-sm space-y-3 list-decimal pl-5 mb-4">
                        <li>Sign up for a Tavus account at <a href="https://tavus.io/?ref=memoa" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">tavus.io</a></li>
                        <li>Create a replica of yourself by recording videos</li>
                        <li>Go to your <a href="https://tavus.io/settings/developer" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">Developer Settings</a> and generate an API key</li>
                        <li>Copy your API key and paste it below</li>
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <h4 className="text-purple-400 font-medium mt-4 mb-2">Required Information:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Tavus API Key (from Developer Settings)</li>
                  <li>• Replica ID (shown on your Tavus dashboard)</li>
                  <li>• Persona ID (optional, for better personality matching)</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Tavus API Key</label>
                <div className="flex gap-2">
                  <input
                    ref={apiKeyInputRef}
                    type="password" 
                    placeholder="Enter your Tavus API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!apiKey.trim() || validationStatus === 'validating' || validationStatus === 'success'}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {validationStatus === 'validating' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Validating...
                      </>
                    ) : validationStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Validated!
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Next
                      </>
                    )}
                  </button>
                </div>
              </div>

              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {validationError}
                </div>
              )}

              {validationStatus === 'success' && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  API key validated successfully! Now let's set up your Tavus avatar details.
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Where to find your Tavus API Key:</h4>
              <ol className="text-white/70 text-sm space-y-1 list-decimal pl-5">
                <li>Log in to your <a href="https://tavus.io/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Tavus Dashboard</a></li>
                <li>Go to Settings > Developer</li>
                <li>Create a new API Key or copy your existing one</li>
                <li>Paste it into the field above</li>
              </ol>
            </div>
          </form>
        )}

        {activeStep === 2 && (
          <form onSubmit={handleSaveCredentials} className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Camera className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Tavus Avatar Details</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                Enter the Replica ID and Persona ID for your Tavus avatar. You can find these in your Tavus dashboard.
              </p>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                <h4 className="text-purple-400 font-medium mb-2">Finding Your IDs:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Replica ID is shown in your avatar settings in the Tavus dashboard</li>
                  <li>• Persona ID defines the personality of your avatar</li>
                  <li>• Both can be found in the Tavus dashboard under your avatar details</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Option to enter from conversation link */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Tavus Conversation Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://tavus.io/conversation/your-conversation-id"
                  value={conversationLink}
                  onChange={handleConversationLinkChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm"
                />
                <p className="text-white/50 text-xs mt-1">
                  If you have a Tavus conversation link, enter it here to automatically extract the Replica ID
                </p>
              </div>

              {/* Manual entry of IDs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Replica ID <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    placeholder="r0123a4b5c6"
                    value={replicaId}
                    onChange={(e) => setReplicaId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Persona ID</label>
                  <input
                    type="text"
                    placeholder="p0123a4b5c6"
                    value={personaId}
                    onChange={(e) => setPersonaId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 font-mono text-sm"
                  />
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {saveError}
                </div>
              )}

              {testMessageStatus === 'success' && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  {testMessageResponse}
                </div>
              )}

              {testMessageStatus === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {testMessageResponse}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={!replicaId.trim() || saveStatus === 'saving' || saveStatus === 'success'}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Avatar
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  disabled={!replicaId.trim() || !apiKey.trim() || testMessageStatus === 'sending'}
                  onClick={sendTestMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testMessageStatus === 'sending' ? (
                    <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Test
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Where to find your Tavus IDs:</h4>
              <ol className="text-white/70 text-sm space-y-1 list-decimal pl-5">
                <li>Log in to your <a href="https://tavus.io/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Tavus Dashboard</a></li>
                <li>Click on your avatar</li>
                <li>The Replica ID will be displayed in the details (looks like r0123...)</li>
                <li>For Persona ID, check the persona section (looks like p0123...)</li>
              </ol>
              <p className="text-amber-400 text-sm mt-2">Tip: You can use a conversation link to automatically extract the Replica ID.</p>
            </div>
          </form>
        )}
      </div>
    </motion.div>
  );
}