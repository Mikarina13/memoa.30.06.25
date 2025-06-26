import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ANIMATION_DURATION_INTRO, ANIMATION_DURATION_SHORT } from '../utils/constants';

export function ConnectionTest() {
  const [testing, setTesting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComponent, setShowComponent] = useState(true);

  useEffect(() => {
    const runTest = async () => {
      try {
        setTesting(true);
        setError(null);
        
        // Test basic connection
        const isConnected = await testSupabaseConnection();
        setConnected(isConnected);
        
        if (!isConnected) {
          setError('Failed to connect to Supabase');
        }
      } catch (err) {
        console.error('Connection test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setConnected(false);
      } finally {
        setTesting(false);
      }
    };

    runTest();
  }, []);

  // Auto-hide the component after ANIMATION_DURATION_INTRO
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowComponent(false);
    }, ANIMATION_DURATION_INTRO);

    return () => clearTimeout(timer);
  }, []);

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
          className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[300px]"
        >
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            Supabase Connection Test
            {testing && <Loader className="w-4 h-4 animate-spin" />}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={connected ? 'text-green-400' : 'text-red-400'}>
                {connected ? 'Connected' : 'Connection Failed'}
              </span>
            </div>
            
            {error && (
              <div className="text-red-400 text-xs break-words">
                Error: {error}
              </div>
            )}
            
            <div className="text-white/60 text-xs">
              URL: {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}
            </div>
            <div className="text-white/60 text-xs">
              Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}