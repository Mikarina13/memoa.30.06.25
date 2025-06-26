import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, Lock, Bell, Shield, Trash2, Download, Key, Globe, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useRequireTermsAcceptance } from '../hooks/useRequireTermsAcceptance';
import { MemoirIntegrations, MemoriaProfile } from '../lib/memoir-integrations';
import { Footer } from '../components/Footer';

export function MemoriaSettings() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [memoriaProfiles, setMemoriaProfiles] = useState<MemoriaProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Ensure user has accepted terms
  useRequireTermsAcceptance();

  useEffect(() => {
    document.title = 'MEMORIA Settings';
    
    if (!loading && !user) {
      navigate('/memoria');
    }
  }, [navigate, user, loading]);

  useEffect(() => {
    if (user) {
      loadMemoriaProfiles();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProfile) {
      loadProfileData();
    }
  }, [selectedProfile]);

  const loadMemoriaProfiles = async () => {
    try {
      setIsLoading(true);
      const profiles = await MemoirIntegrations.getMemoriaProfiles(user.id);
      setMemoriaProfiles(profiles);
      
      // Select the first profile by default if available
      if (profiles.length > 0) {
        setSelectedProfile(profiles[0].id);
        setIsPublic(profiles[0].is_public || false);
      }
    } catch (error) {
      console.error('Error loading Memoria profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfileData = async () => {
    try {
      if (!selectedProfile) return;
      
      setIsLoading(true);
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, selectedProfile);
      setIsPublic(profile?.is_public || false);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      if (!selectedProfile) return;
      
      setIsSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      // Update the profile visibility
      await MemoirIntegrations.setProfileVisibility(user.id, !isPublic, selectedProfile);
      
      // Update local state
      setIsPublic(!isPublic);
      setSaveSuccess(true);
      
      // Update the profiles array with the new visibility
      setMemoriaProfiles(prev => 
        prev.map(profile => 
          profile.id === selectedProfile 
            ? { ...profile, is_public: !isPublic } 
            : profile
        )
      );

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile visibility:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update profile visibility');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileChange = (profileId: string) => {
    setSelectedProfile(profileId);
    
    // Find the profile and update the isPublic state
    const profile = memoriaProfiles.find(p => p.id === profileId);
    if (profile) {
      setIsPublic(profile.is_public || false);
    }
  };

  const handlePasswordChange = () => {
    navigate('/update-password');
  };

  if (loading || isLoading) {
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
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/memoria/dashboard')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            Return
          </button>
          
          <button 
            onClick={logout}
            className="text-white/80 hover:text-white transition-colors"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-400 bg-clip-text text-transparent">
          Settings
        </h1>

        {/* Profile Selector */}
        {memoriaProfiles.length > 0 && (
          <div className="mb-8">
            <label className="block text-white/70 mb-2">Select Profile</label>
            <select
              value={selectedProfile || ''}
              onChange={(e) => handleProfileChange(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white"
            >
              {memoriaProfiles.map(profile => (
                <option key={profile.id} value={profile.id} className="bg-black">
                  {profile.name} {profile.is_celebrity ? '(Celebrity)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-8">
          {/* Profile Visibility Section */}
          {selectedProfile && (
            <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Profile Visibility</h2>
              
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    {isPublic ? (
                      <Globe className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{isPublic ? "Public Profile" : "Private Profile"}</h3>
                    <p className="text-sm text-white/60">
                      {isPublic 
                        ? "This memorial profile is visible to everyone in the Explorer" 
                        : "This memorial profile is only visible to you"}
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isPublic}
                    onChange={handleToggleVisibility}
                    disabled={isSaving}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
              
              {/* Status Messages */}
              {saveSuccess && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Profile visibility updated successfully!</span>
                  </div>
                </div>
              )}
              
              {saveError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{saveError}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-400 font-medium mb-2">About Profile Visibility:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• <strong>Public profiles</strong> are discoverable in the Memento Explorer</li>
                  <li>• Other users can view and add this memorial to their favorites</li>
                  <li>• <strong>Private profiles</strong> are only visible to you</li>
                  <li>• You can change this setting at any time</li>
                </ul>
              </div>
            </div>
          )}

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6">Account Security</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Key className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Change Password</h3>
                    <p className="text-sm text-white/60">Update your account password</p>
                  </div>
                </div>
                <button 
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-white/60">Receive updates and alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Security Alerts</h3>
                  <p className="text-sm text-white/60">Get notified about important security events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Memory Updates</h3>
                  <p className="text-sm text-white/60">Notifications about preserved memories</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm p-8 rounded-xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6">Data Management</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Download className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Export Data</h3>
                    <p className="text-sm text-white/60">Download a copy of your data</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/20 rounded-lg">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-white/60">Permanently delete your account</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </motion.div>
  );
}