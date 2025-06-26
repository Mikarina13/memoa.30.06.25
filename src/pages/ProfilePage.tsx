import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, LogOut, CheckCircle, AlertCircle, Lock, Save, Shield, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'personal' | 'account' | 'privacy'>('personal');

  // Ensure user has accepted terms
  useRequireTermsAcceptance();

  useEffect(() => {
    document.title = 'Profile';
    
    if (!loading && !user) {
      navigate('/memoir');
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error.message);
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setLocation(data.location || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setPhone(data.phone || '');
        setBirthDate(data.birth_date || '');
        setShowEmail(data.show_email || false);
        setShowPhone(data.show_phone || false);
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setSaveError(null);

    try {
      // Format birth date properly - if it's empty, set it to null
      const formattedBirthDate = birthDate ? birthDate : null;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          location: location,
          bio: bio,
          website: website,
          phone: phone,
          birth_date: formattedBirthDate,
          show_email: showEmail,
          show_phone: showPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setSaveStatus('success');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'An error occurred saving your profile');
    }
  };

  const handlePasswordChange = () => {
    navigate('/update-password');
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Implement account deletion logic
      alert("Account deletion is not yet implemented. This is a placeholder for the actual functionality.");
      console.log("Account deletion requested");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
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
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return Home
          </button>
          
          <button 
            onClick={logout}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-6 h-6" />
            Logout
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Profile Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-6 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border-2 border-blue-500/50">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl}
                    alt={fullName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white/50" />
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-1">{fullName || 'User'}</h2>
            <p className="text-white/60 mb-6">{user.email}</p>

            <div className="w-full">
              <nav className="space-y-1 w-full">
                <button 
                  onClick={() => setActiveSection('overview')}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    activeSection === 'overview' 
                      ? 'bg-white/5 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } transition-colors w-full`}
                >
                  <User className="w-5 h-5" />
                  Overview
                </button>
                <button 
                  onClick={() => setActiveSection('personal')}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    activeSection === 'personal' 
                      ? 'bg-white/5 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } transition-colors w-full`}
                >
                  <User className="w-5 h-5" />
                  Personal Info
                </button>
                <button 
                  onClick={() => setActiveSection('account')}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    activeSection === 'account' 
                      ? 'bg-white/5 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } transition-colors w-full`}
                >
                  <Settings className="w-5 h-5" />
                  Account
                </button>
                <button 
                  onClick={() => setActiveSection('privacy')}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    activeSection === 'privacy' 
                      ? 'bg-white/5 text-white' 
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  } transition-colors w-full`}
                >
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6">
                {/* Overview Section */}
                {activeSection === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Overview</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <h3 className="font-semibold">Profile Status</h3>
                            <p className="text-white/70 text-sm">Your profile is complete and up to date</p>
                          </div>
                          <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            Active
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h3 className="font-semibold mb-2">Personal Information</h3>
                          <ul className="space-y-1 text-white/70 text-sm">
                            <li><span className="text-white/50">Name:</span> {fullName || 'Not provided'}</li>
                            <li><span className="text-white/50">Email:</span> {user.email}</li>
                            <li><span className="text-white/50">Location:</span> {location || 'Not provided'}</li>
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h3 className="font-semibold mb-2">Account Activity</h3>
                          <p className="text-white/70 text-sm">
                            Last login: {new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg">
                        <h3 className="font-semibold mb-2">Quick Actions</h3>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setActiveSection('personal')}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                          >
                            Edit Profile
                          </button>
                          <button 
                            onClick={handlePasswordChange}
                            className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                          >
                            Change Password
                          </button>
                          <button 
                            onClick={() => setActiveSection('privacy')}
                            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm"
                          >
                            Privacy Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Personal Info Section */}
                {activeSection === 'personal' && (
                  <form onSubmit={saveProfile} className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Birth Date</label>
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Location</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm text-white/60 mb-2">Website</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          placeholder="https://"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm text-white/60 mb-2">Bio</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={saveStatus === 'saving'}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {saveStatus === 'saving' ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Status Messages */}
                    {saveStatus === 'success' && (
                      <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-400">Profile updated successfully!</span>
                      </div>
                    )}
                    
                    {saveStatus === 'error' && (
                      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-400">{saveError || 'An error occurred while saving your profile'}</span>
                      </div>
                    )}
                  </form>
                )}
                
                {/* Account Section - Simplified with only working features */}
                {activeSection === 'account' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                    
                    <div className="space-y-6">
                      {/* Password - This feature works */}
                      <div className="bg-black/50 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <h3 className="font-semibold">Password</h3>
                            <p className="text-white/70">Update your account password</p>
                          </div>
                          <button
                            onClick={handlePasswordChange}
                            className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                      
                      {/* Delete Account */}
                      <div className="bg-black/50 rounded-lg p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <h3 className="font-semibold text-red-400">Delete Account</h3>
                            <p className="text-white/70">Permanently delete your account and all data</p>
                          </div>
                          <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Privacy & Security Section */}
                {activeSection === 'privacy' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>
                    
                    <form onSubmit={saveProfile} className="space-y-6">
                      {/* Privacy Settings */}
                      <div className="bg-white/5 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Privacy Settings</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Show Email Address</h4>
                              <p className="text-sm text-white/60">Allow other users to see your email address</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={showEmail}
                                onChange={(e) => setShowEmail(e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Show Phone Number</h4>
                              <p className="text-sm text-white/60">Allow other users to see your phone number</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={showPhone}
                                onChange={(e) => setShowPhone(e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Privacy Policy Agreement */}
                      <div className="bg-white/5 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Privacy Policy</h3>
                        <p className="text-white/70 text-sm mb-4">
                          You've agreed to our Privacy Policy which details how we collect, use, and protect your personal information.
                        </p>
                        <a 
                          href="/privacy-policy" 
                          target="_blank"
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Privacy Policy
                        </a>
                      </div>
                      
                      {/* Data Management */}
                      <div className="bg-white/5 rounded-lg p-6">
                        <h3 className="font-semibold mb-4">Data Management</h3>
                        <div className="flex flex-col md:flex-row gap-4">
                          <button
                            type="button"
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            onClick={() => alert("Data export feature is not yet implemented. This feature will be available soon.")}
                          >
                            Export Data
                          </button>
                          
                          <button
                            type="button"
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
                                alert("Data deletion feature is not yet implemented. This feature will be available soon.");
                              }
                            }}
                          >
                            Delete All Data
                          </button>
                        </div>
                      </div>
                      
                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <button
                          type="submit"
                          disabled={saveStatus === 'saving'}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          {saveStatus === 'saving' ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Status Messages */}
                      {saveStatus === 'success' && (
                        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-400">Privacy settings updated successfully!</span>
                        </div>
                      )}
                      
                      {saveStatus === 'error' && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                          <span className="text-red-400">{saveError || 'An error occurred while saving your settings'}</span>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}