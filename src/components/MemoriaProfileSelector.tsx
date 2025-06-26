import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Heart, 
  Star, 
  X, 
  Check, 
  Info, 
  AlertCircle,
  Globe,
  EyeOff 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations, MemoriaProfile } from '../lib/memoir-integrations';

interface MemoriaProfileSelectorProps {
  onSelectProfile: (profile: MemoriaProfile) => void;
  onCreateProfile: (profile: MemoriaProfile) => void;
}

export function MemoriaProfileSelector({ onSelectProfile, onCreateProfile }: MemoriaProfileSelectorProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<MemoriaProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MemoriaProfile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    description: '',
    birthDate: '',
    deathDate: '',
    isCelebrity: false,
    isPublic: false
  });

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const memoriaProfiles = await MemoirIntegrations.getMemoriaProfiles(user.id);
      setProfiles(memoriaProfiles);
    } catch (error) {
      console.error('Error loading Memoria profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      setFormError(null);
      
      if (!formData.name.trim()) {
        setFormError('Name is required');
        return;
      }

      // Validate dates if provided
      const birthDateValue = formData.birthDate?.trim() || null;
      const deathDateValue = formData.deathDate?.trim() || null;
      
      if (birthDateValue && deathDateValue) {
        const birthDate = new Date(birthDateValue);
        const deathDate = new Date(deathDateValue);
        
        if (birthDate > deathDate) {
          setFormError('Birth date cannot be after death date');
          return;
        }
      }

      const newProfile = await MemoirIntegrations.createMemoriaProfile(
        user.id,
        formData.name.trim(),
        formData.relationship.trim() || undefined,
        formData.description.trim() || undefined,
        birthDateValue,
        deathDateValue,
        formData.isCelebrity
      );
      
      // Update public status if needed
      if (formData.isPublic) {
        await MemoirIntegrations.setProfileVisibility(user.id, true, newProfile.id);
        newProfile.is_public = true;
      }

      setProfiles(prev => [newProfile, ...prev]);
      setShowCreateForm(false);
      resetForm();
      
      // Notify parent component
      onCreateProfile(newProfile);
      
      // Auto-select the newly created profile
      onSelectProfile(newProfile);
    } catch (error) {
      console.error('Error creating profile:', error);
      setFormError('Failed to create profile. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;
    
    try {
      setFormError(null);
      
      if (!formData.name.trim()) {
        setFormError('Name is required');
        return;
      }

      // Validate dates if provided
      const birthDateValue = formData.birthDate?.trim() || null;
      const deathDateValue = formData.deathDate?.trim() || null;
      
      if (birthDateValue && deathDateValue) {
        const birthDate = new Date(birthDateValue);
        const deathDate = new Date(deathDateValue);
        
        if (birthDate > deathDate) {
          setFormError('Birth date cannot be after death date');
          return;
        }
      }

      const updatedProfile = await MemoirIntegrations.updateMemoriaProfile(
        editingProfile.id,
        {
          name: formData.name.trim(),
          relationship: formData.relationship.trim() || null,
          description: formData.description.trim() || null,
          birth_date: birthDateValue,
          death_date: deathDateValue,
          is_celebrity: formData.isCelebrity,
          is_public: formData.isPublic
        }
      );

      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
      setShowEditForm(false);
      setEditingProfile(null);
      resetForm();
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError('Failed to update profile. Please try again.');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    try {
      await MemoirIntegrations.deleteMemoriaProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const startEditProfile = (profile: MemoriaProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      relationship: profile.relationship || '',
      description: profile.description || '',
      birthDate: profile.birth_date || '',
      deathDate: profile.death_date || '',
      isCelebrity: profile.is_celebrity || false,
      isPublic: profile.is_public || false
    });
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      description: '',
      birthDate: '',
      deathDate: '',
      isCelebrity: false,
      isPublic: false
    });
    setFormError(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-purple-300 border-t-transparent rounded-full animate-spin mr-3"></div>
        <p className="text-white/70">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Memoria Profiles</h2>
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Profiles Yet</h3>
          <p className="text-white/60 mb-6">Create your first Memoria profile to begin preserving memories of your loved one.</p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Create Your First Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div 
              key={profile.id}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="h-24 bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white/60" />
                  </div>
                </div>
                
                <div className="absolute top-3 right-3 flex gap-2">
                  {profile.is_public && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>Public</span>
                    </div>
                  )}
                  
                  {profile.is_celebrity && (
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                      <span>Celebrity</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                  {profile.name}
                </h3>
                
                {profile.relationship && (
                  <p className="text-white/70 text-sm mb-3">
                    {profile.relationship}
                  </p>
                )}

                {profile.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {profile.description}
                  </p>
                )}

                {(profile.birth_date || profile.death_date) && (
                  <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {profile.birth_date ? formatDate(profile.birth_date) : '?'} - {profile.death_date ? formatDate(profile.death_date) : 'Present'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditProfile(profile)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteConfirm(profile.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectProfile(profile)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Select
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Profile Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-purple-500/30 rounded-xl p-6 max-w-md mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Create New Profile</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name of your loved one"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Mother, Father, Grandparent, Friend"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief description or memory"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 h-24 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Death Date</label>
                    <input
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isCelebrity"
                      checked={formData.isCelebrity}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCelebrity: e.target.checked }))}
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-purple-500 text-purple-500"
                    />
                    <span className="text-white">Celebrity tribute</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-green-500 text-green-500"
                    />
                    <span className="text-white">Make public</span>
                  </label>
                </div>
                
                {formData.isPublic && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400">This profile will be visible to others in the Explorer</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateProfile}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors"
                  >
                    Create Profile
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Form */}
      <AnimatePresence>
        {showEditForm && editingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-blue-500/30 rounded-xl p-6 max-w-md mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProfile(null);
                  }}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name of your loved one"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    placeholder="e.g., Mother, Father, Grandparent, Friend"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-white/60 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief description or memory"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-500 h-24 resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Death Date</label>
                    <input
                      type="date"
                      value={formData.deathDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, deathDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCelebrity"
                      checked={formData.isCelebrity}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCelebrity: e.target.checked }))}
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-blue-500 text-blue-500"
                    />
                    <span className="text-white">Celebrity tribute</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-green-500 text-green-500"
                    />
                    <span className="text-white">Make public</span>
                  </label>
                </div>
                
                {formData.isPublic && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-green-400">This profile will be visible to others in the Explorer</span>
                    </div>
                  </div>
                )}
                
                {!formData.isPublic && editingProfile?.is_public && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-400">This profile will be made private and removed from the Explorer</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors"
                  >
                    Update Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingProfile(null);
                    }}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/90 border border-red-500/30 rounded-xl p-6 max-w-md mx-4 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Delete Profile</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this profile? This action cannot be undone, and all associated data will be permanently lost.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteProfile(showDeleteConfirm)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="bg-white/5 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">About Memoria Profiles</h3>
            <p className="text-white/70 text-sm mb-4">
              Create separate profiles for each loved one you want to remember. Each profile stores its own set of memories, 
              voice recordings, photos, and personal preferences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-white font-medium">Family Members</span>
                </div>
                <p className="text-white/60">Create profiles for parents, grandparents, siblings, or other family members who have passed away.</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">Friends</span>
                </div>
                <p className="text-white/60">Preserve memories of close friends who have had a significant impact on your life.</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-medium">Celebrity Tributes</span>
                </div>
                <p className="text-white/60">Create memorial profiles for public figures, artists, or celebrities who inspired you.</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-medium">Historical Figures</span>
                </div>
                <p className="text-white/60">Document the lives and contributions of historical figures you admire.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}