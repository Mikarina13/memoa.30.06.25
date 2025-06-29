import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, testSupabaseConnection, diagnoseConnectionError, isNetworkError } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader, RefreshCw, Wifi, WifiOff, ExternalLink, AlertTriangle } from 'lucide-react';
import { ANIMATION_DURATION_INTRO, ANIMATION_DURATION_SHORT } from '../utils/constants';

interface DiagnosticInfo {
  type: string;
  message: string;
  suggestions: string[];
}

export function ConnectionTest() {
  const [testing, setTesting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [showComponent, setShowComponent] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [detailedMode, setDetailedMode] = useState(false);

  const runConnectionTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setDiagnostics(null);
      
      console.log('🔄 Starting comprehensive connection test...');
      const isConnected = await testSupabaseConnection(3); // Reduced retries for UI responsiveness
      
      setConnected(isConnected);
      
      if (!isConnected) {
        setError('Unable to establish connection to Supabase');
        
        // Try to get more specific error information
        try {
          const { error: testError } = await supabase.auth.getSession();
          if (testError) {
            const diagnosis = diagnoseConnectionError(testError);
            setDiagnostics(diagnosis);
          }
        } catch (testErr) {
          const diagnosis = diagnoseConnectionError(testErr);
          setDiagnostics(diagnosis);
        }
        
        // Fallback diagnostics if we couldn't get specific error
        if (!diagnostics) {
          setDiagnostics({
            type: 'CONNECTION_FAILED',
            message: 'Failed to connect after multiple attempts',
            suggestions: [
              'Check your internet connection',
              'Verify your Supabase project is active (not paused)',
              'Visit your Supabase dashboard to check project status',
              'Restart your development server',
              'Check browser console for detailed errors'
            ]
          });
        }
      } else {
        console.log('✅ Connection test successful');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      
      // Use the enhanced diagnosis function
      const diagnosis = diagnoseConnectionError(err);
      setDiagnostics(diagnosis);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  // Modified auto-hide logic - be more persistent for connection issues
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (connected) {
      // Hide quickly after successful connection
      timer = setTimeout(() => {
        setShowComponent(false);
      }, 3000);
    } else if (retryCount >= 3) {
      // If multiple retries failed, hide after longer time but still hide eventually
      timer = setTimeout(() => {
        setShowComponent(false);
      }, 30000); // 30 seconds for persistent issues
    }

    return () => clearTimeout(timer);
  }, [connected, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    runConnectionTest();
  };

  const handleDismiss = () => {
    setShowComponent(false);
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const openSupabaseStatus = () => {
    window.open('https://status.supabase.com/', '_blank');
  };

  return (
    <AnimatePresence>
      {showComponent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ 
            duration: ANIMATION_DURATION_SHORT / 1000,
            ease: "easeOut"
          }}
          className="fixed top-4 right-4 z-50 bg-black/95 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[320px] max-w-[400px] shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {connected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              Supabase Connection
              {testing && <Loader className="w-4 h-4 animate-spin text-blue-400" />}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDetailedMode(!detailedMode)}
                className="text-white/60 hover:text-white/80 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {detailedMode ? 'Simple' : 'Details'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white/80"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={connected ? 'text-green-400' : 'text-red-400'}>
                {connected ? 'Connected Successfully' : 'Connection Failed'}
              </span>
            </div>
            
            {error && (
              <div className="text-red-400 text-xs break-words bg-red-500/10 p-3 rounded border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <strong>Error:</strong>
                </div>
                <div className="font-mono">{error}</div>
              </div>
            )}
            
            {diagnostics && (
              <div className="text-yellow-400 text-xs bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3 h-3" />
                  <strong>Diagnosis ({diagnostics.type}):</strong>
                </div>
                <div className="mb-2 text-white/90">{diagnostics.message}</div>
                <div>
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {diagnostics.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-white/70">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {detailedMode && (
              <div className="text-white/60 text-xs space-y-1 bg-white/5 p-3 rounded">
                <div><strong>Environment:</strong></div>
                <div>URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</div>
                <div>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'}</div>
                <div>Connection attempts: {retryCount + 1}</div>
                <div>User agent: {navigator.userAgent.substring(0, 50)}...</div>
              </div>
            )}
            
            <div className="flex gap-2">
              {!connected && !testing && (
                <button
                  onClick={handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry ({retryCount}/5)
                </button>
              )}
              
              {!connected && (
                <div className="flex gap-1">
                  <button
                    onClick={openSupabaseDashboard}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-2 rounded flex items-center justify-center transition-colors"
                    title="Open Supabase Dashboard"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={openSupabaseStatus}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-2 rounded flex items-center justify-center transition-colors"
                    title="Check Supabase Status"
                  >
                    <AlertCircle className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            
            {!connected && retryCount >= 2 && (
              <div className="text-orange-400 text-xs bg-orange-500/10 p-2 rounded border border-orange-500/20">
                <strong>Persistent connection issues detected.</strong>
                <div className="mt-1">Your Supabase project may be paused or there may be network connectivity issues.</div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}