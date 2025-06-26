import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="max-w-md w-full mx-4 bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">Reset Password</h1>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Email Sent</h2>
              <p className="text-white/70 mb-4">
                If an account exists with this email, you'll receive a password reset link shortly.
                Please check your inbox and follow the instructions.
              </p>
              <button
                onClick={() => navigate('/memento')}
                className="w-full bg-[#00008B] hover:bg-blue-900 text-white py-3 rounded-lg transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <>
              <p className="text-white/70 mb-8 text-center">
                Enter your email address below and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  required
                />
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#00008B] hover:bg-blue-900 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/memento')}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    Return to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}