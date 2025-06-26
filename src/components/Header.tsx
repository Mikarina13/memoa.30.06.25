import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Heart, Sparkles, Info, LogIn, UserPlus, LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const location = useLocation();

  return (
    <div className="fixed top-0 left-0 z-50 p-0 m-0 -mt-2">
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-0 bg-black/90 backdrop-blur-sm p-4 rounded-lg border border-white/10"
          >
            <div className="flex flex-col gap-3">
              <Link 
                to="/memoir"
                className={`flex items-center gap-2 ${
                  location.pathname.includes('/memoir') 
                    ? 'text-blue-300' 
                    : 'text-blue-400 hover:text-blue-300'
                } transition-colors`}
                onClick={() => setShowMenu(false)}
              >
                <Compass className="w-5 h-5" />
                <span className="text-blue-400/90 font-[Rajdhani]">MEMOIR</span>
              </Link>
              <Link 
                to="/memoria"
                className={`flex items-center gap-2 ${
                  location.pathname.includes('/memoria') 
                    ? 'text-purple-300' 
                    : 'text-purple-400 hover:text-purple-300'
                } transition-colors`}
                onClick={() => setShowMenu(false)}
              >
                <Heart className="w-5 h-5" />
                <span className="text-purple-400/90 font-[Rajdhani]">MEMORIA</span>
              </Link>
              <Link 
                to="/memento"
                className={`flex items-center gap-2 ${
                  location.pathname.includes('/memento') 
                    ? 'text-cyan-300' 
                    : 'text-cyan-400 hover:text-cyan-300'
                } transition-colors`}
                onClick={() => setShowMenu(false)}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-cyan-400/90 font-[Rajdhani]">MEMENTO</span>
              </Link>
              <div className="border-t border-white/10 my-2"></div>
              <Link 
                to="/info"
                className={`flex items-center gap-2 ${
                  location.pathname.includes('/info') 
                    ? 'text-emerald-300' 
                    : 'text-emerald-400 hover:text-emerald-300'
                } transition-colors`}
                onClick={() => setShowMenu(false)}
              >
                <Info className="w-5 h-5" />
                <span className="text-emerald-400/90 font-[Rajdhani]">Info</span>
              </Link>
              {!user ? (
                <>
                  <Link 
                    to="/memento"
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="text-amber-400/90 font-[Rajdhani]">Sign in</span>
                  </Link>
                  <Link 
                    to="/memento"
                    className="flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="text-rose-400/90 font-[Rajdhani]">Sign up</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-indigo-400/90 font-[Rajdhani]">Profile</span>
                  </Link>
                  <button 
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-red-400/90 font-[Rajdhani]">Logout</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div 
        className={`flex items-center gap-1 cursor-pointer transition-opacity p-0 m-0 ${
          showMenu ? 'opacity-100' : 'opacity-70 hover:opacity-100'
        }`}
        onClick={() => setShowMenu(!showMenu)}
      >
        <Menu className={`w-5 h-5 transition-colors ${
          showMenu ? 'text-white' : 'text-white/70 hover:text-white'
        }`} />
        <img 
          src="/20250601_1008_Neon Logo Design_remix_01jwn8g35desmb88t2c88mh7t0.png"
          alt="MEMOĀ"
          className="w-24 transition-opacity"
        />
      </div>
    </div>
  );
}