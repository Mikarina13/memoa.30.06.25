import { FormEvent } from 'react';
import { Loader, Eye, EyeOff, Chrome } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  isLogin: boolean;
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onGoogleSignIn: () => void;
  loading: boolean;
  error: string | null;
  onToggleLogin: (value: boolean) => void;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onShowPasswordToggle: () => void;
  onShowConfirmPasswordToggle: () => void;
  className?: string;
}

export function AuthForm({
  isLogin,
  email,
  password,
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onGoogleSignIn,
  loading,
  error,
  onToggleLogin,
  showPassword,
  showConfirmPassword,
  onShowPasswordToggle,
  onShowConfirmPasswordToggle,
  className
}: AuthFormProps) {
  return (
    <div className={`max-w-md w-full mx-4 bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10 pointer-events-auto ${className || ''}`}>
      <h1 className="text-3xl font-bold text-center mb-8 text-white font-[Orbitron]">Login</h1>
      
      <div className="flex rounded-lg overflow-hidden mb-8">
        <button
          className={`flex-1 py-3 text-center transition-colors ${isLogin ? 'bg-[#00008B] text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
          onClick={() => onToggleLogin(true)}
        >
          Sign in
        </button>
        <button
          className={`flex-1 py-3 text-center transition-colors ${!isLogin ? 'bg-[#00008B] text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
          onClick={() => onToggleLogin(false)}
        >
          Sign up
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="button"
            onClick={onShowPasswordToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        {!isLogin && (
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              required
            />
            <button
              type="button"
              onClick={onShowConfirmPasswordToggle}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )}
        
        {isLogin && (
          <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors block">
            Forgot password?
          </Link>
        )}
        
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
            'Submit'
          )}
        </button>
        
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute w-full border-t border-white/10"></div>
          <div className="relative bg-black/40 px-4 text-white/60 text-sm">OR</div>
        </div>
        
        <button 
          type="button"
          onClick={onGoogleSignIn}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Chrome className="w-5 h-5 text-blue-500" />
          Sign in with Google
        </button>
      </form>
    </div>
  );
}