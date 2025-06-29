import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader, RefreshCw, Wifi, WifiOff } from 'lucide-react';
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

  const runConnectionTest = async () => {
    try {
      setTesting(true);
      setError(null);
      setDiagnostics(null);
      
      console.log('🔄 Starting connection test...');
      const isConnected = await testSupabaseConnection(2); // Reduced retries for UI responsiveness
      
      setConnected(isConnected);
      
      if (!isConnected) {
        setError('Unable to establish connection to Supabase');
        setDiagnostics({
          type: 'CONNECTION_FAILED',
          message: 'Failed to connect after multiple attempts',
          suggestions: [
            'Check your internet connection',
            'Verify Supabase project is active',
            'Try refreshing the page',
            'Check browser console for detailed errors'
          ]
        });
      } else {
        console.log('✅ Connection test successful');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setConnected(false);
      
      // Provide specific diagnostics based on error type
      if (errorMessage.includes('Failed to fetch')) {
        setDiagnostics({
          type: 'NETWORK_ERROR',
          message: 'Network connectivity issue',
          suggestions: [
            'Check your internet connection',
            'Restart your development server',
            'Verify Supabase URL is correct',
            'Check if behind firewall/proxy'
          ]
        });
      } else if (errorMessage.includes('timeout')) {
        setDiagnostics({
          type: 'TIMEOUT_ERROR',
          message: 'Connection timeout',
          suggestions: [
            'Slow network connection detected',
            'Try again in a moment',
            'Check Supabase service status'
          ]
        });
      }
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runConnectionTest();
  }, []);

  // Auto-hide the component after successful connection or extended time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (connected) {
      // Hide quickly after successful connection
      timer = setTimeout(() => {
        setShowComponent(false);
      }, 2000);
    } else {
      // Keep showing if there are connection issues, but hide after longer time
      timer = setTimeout(() => {
        setShowComponent(false);
      }, ANIMATION_DURATION_INTRO * 2);
    }

    return () => clearTimeout(timer);
  }, [connected]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    runConnectionTest();
  };

  const handleDismiss = () => {
    setShowComponent(false);
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
          className="fixed top-4 right-4 z-50 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[320px] max-w-[400px]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {connected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
              Supabase Connection
              {testing && <Loader className="w-4 h-4 animate-spin" />}
            </h3>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white/80 text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
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
              <div className="text-red-400 text-xs break-words bg-red-500/10 p-2 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {diagnostics && (
              <div className="text-yellow-400 text-xs bg-yellow-500/10 p-2 rounded">
                <strong>Diagnosis:</strong> {diagnostics.message}
                <div className="mt-1">
                  <strong>Suggestions:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {diagnostics.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-white/70">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="text-white/60 text-xs space-y-1">
              <div>URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</div>
              <div>Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</div>
              {retryCount > 0 && <div>Retries: {retryCount}</div>}
            </div>
            
            {!connected && !testing && (
              <button
                onClick={handleRetry}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Connection
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}