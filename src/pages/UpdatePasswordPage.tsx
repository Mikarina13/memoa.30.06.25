import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we arrived here via the reset password link
  useEffect(() => {
    const checkHashParams = async () => {
      // When a user clicks the reset password link, Supabase will redirect to this page
      // with hash parameters that handle the reset token
      const hashParams = window.location.hash;
      if (hashParams && (hashParams.includes('type=recovery') || hashParams.includes('type=signup'))) {
        // Supabase will automatically handle the token in the hash
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          setError('Your password reset link is invalid or has expired. Please request a new one.');
        }
      } else {
        setError('You need a valid password reset link to access this page.');
      }
    };

    checkHashParams();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]"
    >
      <Header />
      
      <div className="fixed top-8 left-24 z-40">
        <button
          onClick={() => navigate('/memento')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          Return to Login
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="max-w-md w-full mx-4 bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Update Password</h1>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Password Updated</h2>
              <p className="text-white/70 mb-4">
                Your password has been successfully updated. You can now login with your new password.
              </p>
              <button
                onClick={() => navigate('/memento')}
                className="w-full bg-[#00008B] hover:bg-blue-900 text-white py-3 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <p className="text-white/70 mb-8 text-center">
                Please enter your new password below.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#00008B] hover:bg-blue-900 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}