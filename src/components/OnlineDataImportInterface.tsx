import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  MessageSquare, 
  FileText, 
  Book, 
  Star, 
  Upload, 
  X, 
  Info, 
  CheckCircle 
} from 'lucide-react';

interface OnlineDataImportInterfaceProps {
  onDataImported: (data: { content: string, source: string }) => void;
  onClose: () => void;
}

export function OnlineDataImportInterface({ onDataImported, onClose }: OnlineDataImportInterfaceProps) {
  const [content, setContent] = useState('');
  const [source, setSource] = useState('social_media');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('Please enter some content to import');
      return;
    }

    onDataImported({
      content: content.trim(),
      source
    });

    setShowSuccess(true);
    
    // Reset form after 1.5 seconds
    setTimeout(() => {
      setContent('');
      setShowSuccess(false);
    }, 1500);
  };

  const sourceOptions = [
    { id: 'social_media', label: 'Social Media', icon: Facebook, description: 'Posts, comments, and profiles from Facebook, Instagram, Twitter, etc.' },
    { id: 'blog', label: 'Blog/Articles', icon: FileText, description: 'Personal blog entries or published articles' },
    { id: 'email', label: 'Email', icon: Mail, description: 'Email correspondence and newsletters' },
    { id: 'messages', label: 'Text Messages', icon: MessageSquare, description: 'Text messages or digital conversations' },
    { id: 'reviews', label: 'Reviews/Comments', icon: Star, description: 'Online reviews or comments you\'ve written' },
    { id: 'journal', label: 'Digital Journal', icon: Book, description: 'Personal notes or digital journals' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-80 p-4"
    >
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-3xl w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Import Online Data</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-emerald-400 font-medium mb-1">How This Works</h3>
                <p className="text-white/70 text-sm">
                  Paste content from your online presence to help our AI understand your unique voice and expression style. 
                  This data will be used to create narratives that authentically capture your personality.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Select Content Source</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sourceOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSource(option.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        source === option.id
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium text-white text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-white/60 line-clamp-2">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">Paste Your Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Paste your ${sourceOptions.find(o => o.id === source)?.label.toLowerCase() || 'content'} here...`}
                className="w-full h-64 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-white/60 text-sm">
                {content.length} characters
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setContent('')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || showSuccess}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                    showSuccess 
                      ? 'bg-green-500 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {showSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Added!
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Add to Narratives
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Privacy & Data Usage</h3>
            <p className="text-white/70 text-sm">
              The content you paste here is used solely to analyze your writing style and personality traits. 
              It helps our AI create more authentic narratives that reflect your unique voice. 
              Your imported data is stored securely and never shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}