import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileVideo, 
  Mic, 
  Newspaper, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Upload
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations } from '../lib/memoir-integrations';

interface MediaLinksInterfaceProps {
  memoriaProfileId?: string;
  onMediaLinksSaved?: (data: any) => void;
  onClose?: () => void;
}

interface MediaLink {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'podcast' | 'article';
  source: string;
  description?: string;
  date: string;
}

export function MediaLinksInterface({ memoriaProfileId, onClose, onMediaLinksSaved }: MediaLinksInterfaceProps) {
  const { user } = useAuth();
  const [mediaLinks, setMediaLinks] = useState<MediaLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<Partial<MediaLink>>({
    title: '',
    url: '',
    type: 'video',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Determine the context label (Memoria vs Memoir)
  const context = memoriaProfileId ? "Memoria" : "MEMOIR";

  useEffect(() => {
    if (user) {
      loadMediaLinks();
    }
  }, [user, memoriaProfileId]);

  const loadMediaLinks = async () => {
    try {
      setIsLoading(true);
      
      // Use the appropriate method based on context
      const mediaData = await MemoirIntegrations.getMediaLinks(user.id, memoriaProfileId);
      
      console.log('Loaded media links:', mediaData.length);
      setMediaLinks(mediaData || []);
    } catch (error) {
      console.error('Error loading media links:', error);
      
      // Try to recover data
      console.log('Attempting to recover media links data...');
      const recoveredData = await MemoirIntegrations.recoverData(user.id, 'media_links', memoriaProfileId);
      if (recoveredData && Array.isArray(recoveredData)) {
        setMediaLinks(recoveredData);
        console.log('Successfully recovered media links:', recoveredData.length);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink.title || !newLink.url || !newLink.source) {
      alert('Please fill in all required fields (Title, URL, and Source)');
      return;
    }

    // Validate URL
    try {
      new URL(newLink.url);
    } catch (e) {
      alert('Please enter a valid URL (including http:// or https://)');
      return;
    }

    const link: MediaLink = {
      id: `media-${Date.now()}`,
      title: newLink.title,
      url: newLink.url,
      type: newLink.type as 'video' | 'podcast' | 'article',
      source: newLink.source,
      description: newLink.description || '',
      date: newLink.date || new Date().toISOString().split('T')[0]
    };

    // Add the new link to the existing links array
    setMediaLinks(prev => [...prev, link]);
    
    // Reset form
    setNewLink({
      title: '',
      url: '',
      type: 'video',
      source: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteLink = (id: string) => {
    setMediaLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleSaveLinks = async () => {
    if (!user) return;
    
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      console.log(`Saving media links${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      console.log('Media links to save:', mediaLinks);
      
      // Use the specific storeMediaLinks method
      await MemoirIntegrations.storeMediaLinks(user.id, mediaLinks, memoriaProfileId);
      
      setSaveStatus('success');
      
      if (onMediaLinksSaved) {
        onMediaLinksSaved(mediaLinks);
      }
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving media links:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const exportLinks = () => {
    const data = {
      media_links: mediaLinks,
      exported_at: new Date().toISOString(),
      profile_type: memoriaProfileId ? 'memoria' : 'memoir'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-links-${memoriaProfileId ? 'memoria' : 'memoir'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLinks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.media_links && Array.isArray(data.media_links)) {
          setMediaLinks(prev => [...prev, ...data.media_links]);
        } else {
          alert('Invalid file format. Could not find media links data.');
        }
      } catch (error) {
        alert('Error parsing file. Please make sure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const getTypeIcon = (type: string) => {
    // This would ideally use specific icons for each type
    switch (type) {
      case 'video':
        return <FileVideo className="w-5 h-5 text-red-400" />;
      case 'podcast':
        return <Mic className="w-5 h-5 text-purple-400" />;
      case 'article':
        return <Newspaper className="w-5 h-5 text-blue-400" />;
      default:
        return <FileVideo className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-500/20 text-red-400';
      case 'podcast':
        return 'bg-purple-500/20 text-purple-400';
      case 'article':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-70 p-4"
    >
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FileVideo className="w-8 h-8 text-amber-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Media Links - Memoria" : "Media Links - Personal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-white/70 mb-6">
          {memoriaProfileId 
            ? "Add links to videos, podcasts, or articles featuring your loved one. Preserve their media appearances and mentions."
            : "Add links to videos, podcasts, or articles featuring you. Preserve your media appearances and mentions."}
        </p>

        {/* Add New Link Form */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Media Link</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Title *</label>
              <input
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter media title"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">URL *</label>
              <input
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Type *</label>
              <select
                value={newLink.type}
                onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="video" className="bg-black">Video</option>
                <option value="podcast" className="bg-black">Podcast</option>
                <option value="article" className="bg-black">Article</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Source *</label>
              <input
                type="text"
                value={newLink.source}
                onChange={(e) => setNewLink(prev => ({ ...prev, source: e.target.value }))}
                placeholder="YouTube, Spotify, New York Times, etc."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Date</label>
              <input
                type="date"
                value={newLink.date}
                onChange={(e) => setNewLink(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/60 mb-2">Description</label>
              <input
                type="text"
                value={newLink.description}
                onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the content"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          
          <button
            onClick={handleAddLink}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>

        {/* Media Links List */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Media Links ({mediaLinks.length})</h3>
            
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-colors text-sm">
                <Upload className="w-4 h-4" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importLinks}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={exportLinks}
                disabled={mediaLinks.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-white/70">Loading media links...</p>
            </div>
          ) : mediaLinks.length > 0 ? (
            <div className="space-y-4">
              {mediaLinks.map((link) => (
                <div key={link.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(link.type)}
                        <h4 className="font-medium text-white">{link.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(link.type)}`}>
                          {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-white/60">Source: {link.source}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60">
                          {new Date(link.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {link.description && (
                        <p className="text-white/70 text-sm mb-3">{link.description}</p>
                      )}
                      
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit Link
                      </a>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileVideo className="w-12 h-12 text-white/30 mx-auto mb-3" />
              <p className="text-white/60">No media links added yet. Add your first link above.</p>
            </div>
          )}
        </div>

        {/* Save Section */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-6 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Save Media Links</h3>
              <p className="text-white/70">
                {memoriaProfileId 
                  ? "Preserve links to media featuring your loved one as part of their digital memorial."
                  : "Preserve links to media featuring you as part of your digital legacy."}
              </p>
            </div>
            
            <button
              onClick={handleSaveLinks}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Links
                </>
              )}
            </button>
          </div>

          {saveError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <h4 className="text-amber-400 font-medium mb-2">Why Save Media Links?</h4>
            <ul className="text-white/70 text-sm space-y-1">
              {memoriaProfileId ? (
                <>
                  <li>• Preserve interviews, features, and mentions of your loved one</li>
                  <li>• Document their public appearances and media coverage</li>
                  <li>• Create a comprehensive archive of their media presence</li>
                  <li>• Share their voice and image with future generations</li>
                </>
              ) : (
                <>
                  <li>• Preserve interviews, features, and mentions of you</li>
                  <li>• Document your public appearances and media coverage</li>
                  <li>• Create a comprehensive archive of your media presence</li>
                  <li>• Share your voice and image with future generations</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}