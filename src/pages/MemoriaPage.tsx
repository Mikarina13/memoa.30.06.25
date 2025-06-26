import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthForm } from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function MemoriaPage() {
  const navigate = useNavigate();
  const { user, loading, initialized } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user has accepted terms
  const checkTermsAcceptance = (userData: any) => {
    if (!userData) return false;
    const userMetadata = userData.user_metadata || {};
    return !!userMetadata.terms_accepted;
  };
  
  useEffect(() => {
    document.title = 'MEMORIA';
  }, []);

  // Only redirect if auth is initialized and user exists
  useEffect(() => {
    if (initialized && user) {
      // Check if user has accepted terms
      if (checkTermsAcceptance(user)) {
        navigate('/memoria/dashboard');
      } else {
        navigate('/terms-acceptance?redirectTo=/memoria/dashboard');
      }
    }
  }, [navigate, user, initialized]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setFormLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Don't navigate here, let the auth state change handle it
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setError('Please check your email to confirm your account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  // Show loading while checking authentication
  if (loading || !initialized) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't render if user is logged in (will be redirected)
  if (user) {
    return null;
  }

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
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <AuthForm
          isLogin={isLogin}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
          onGoogleSignIn={handleGoogleSignIn}
          loading={formLoading}
          error={error}
          onToggleLogin={setIsLogin}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onShowPasswordToggle={() => setShowPassword(!showPassword)}
          onShowConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </div>
      
      <Footer />
    </motion.div>
  );
}