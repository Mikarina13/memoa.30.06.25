import { useState, useEffect } from 'react';
import { FileText, Brain, Heart, PenTool, CheckCircle, Volume2, Play, Pause, File as FilePdf, ExternalLink, Download } from 'lucide-react';

interface NarrativesDetailProps {
  data: {
    personal_stories?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
      documentUrl?: string;
      documentType?: string;
      documentName?: string;
    }>;
    memories?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    values?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    wisdom?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    reflections?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
    }>;
    documents?: Array<{
      title: string;
      documentUrl: string;
      documentType: string;
      documentName: string;
      timestamp: string;
    }>;
    ai_insights?: {
      personality_traits: string[];
      core_themes: string[];
      writing_style: string;
      key_life_events?: Array<{
        title: string;
        description: string;
      }>;
      emotional_tone?: string;
      recurring_motifs?: string[];
      most_impactful_story?: {
        title: string;
        summary: string;
      };
      processed_at: string;
    };
  };
  initialTab?: string; // Add this prop to control initial tab selection
}

export function NarrativesDetail({ data, initialTab }: NarrativesDetailProps) {
  // Initialize activeTab based on initialTab prop or use a smart default
  const getInitialTab = () => {
    if (initialTab) {
      return initialTab; // Use explicitly provided tab if available
    } else if (data.documents?.length) {
      return 'documents'; // Default to documents if available
    } else {
      return 'personal_stories'; // Otherwise default to personal stories
    }
  };
  
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [selectedNarrative, setSelectedNarrative] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const tabs = [
    { id: 'personal_stories', label: 'Personal Stories', icon: FileText, color: 'text-blue-400', count: data.personal_stories?.length || 0 },
    { id: 'memories', label: 'Memories', icon: Brain, color: 'text-purple-400', count: data.memories?.length || 0 },
    { id: 'values', label: 'Core Values', icon: Heart, color: 'text-pink-400', count: data.values?.length || 0 },
    { id: 'wisdom', label: 'Wisdom', icon: PenTool, color: 'text-emerald-400', count: data.wisdom?.length || 0 },
    { id: 'reflections', label: 'Reflections', icon: CheckCircle, color: 'text-amber-400', count: data.reflections?.length || 0 },
    { id: 'documents', label: 'Documents', icon: FilePdf, color: 'text-blue-400', count: data.documents?.length || 0 },
    { id: 'ai_insights', label: 'AI Insights', icon: Brain, color: 'text-indigo-400', count: data.ai_insights ? 1 : 0 },
  ];
  
  const getActiveTabData = () => {
    switch (activeTab) {
      case 'personal_stories': return data.personal_stories || [];
      case 'memories': return data.memories || [];
      case 'values': return data.values || [];
      case 'wisdom': return data.wisdom || [];
      case 'reflections': return data.reflections || [];
      case 'documents': return data.documents || [];
      default: return [];
    }
  };
  
  const getTabColor = (tabId: string) => {
    switch (tabId) {
      case 'personal_stories': return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      case 'memories': return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
      case 'values': return 'from-pink-500/20 to-pink-600/20 border-pink-500/30';
      case 'wisdom': return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
      case 'reflections': return 'from-amber-500/20 to-amber-600/20 border-amber-500/30';
      case 'documents': return 'from-blue-500/20 to-indigo-600/20 border-blue-500/30';
      case 'ai_insights': return 'from-indigo-500/20 to-purple-600/20 border-indigo-500/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };
  
  const getTabTextColor = (tabId: string) => {
    switch (tabId) {
      case 'personal_stories': return 'text-blue-400';
      case 'memories': return 'text-purple-400';
      case 'values': return 'text-pink-400';
      case 'wisdom': return 'text-emerald-400';
      case 'reflections': return 'text-amber-400';
      case 'documents': return 'text-blue-400';
      case 'ai_insights': return 'text-indigo-400';
      default: return 'text-gray-400';
    }
  };
  
  const getTabIcon = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    const Icon = tab?.icon || FileText;
    return <Icon className={`w-5 h-5 ${tab?.color || 'text-gray-400'}`} />;
  };
  
  const playNarrative = () => {
    if (!selectedNarrative) return;
    
    // In a real implementation, this would use the ElevenLabs API to generate speech
    // For now, we'll just toggle the play state
    setIsPlaying(!isPlaying);
    
    // Simulate ending after 5 seconds
    if (!isPlaying) {
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000);
    }
  };

  // Determine if we should show the documents tab first
  useEffect(() => {
    if (data.documents?.length && activeTab !== 'documents' && !initialTab) {
      setActiveTab('documents');
    }
  }, [data.documents, initialTab]);

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Narratives</h2>
      
      {/* AI Insights */}
      {data.ai_insights && (
        <div className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">AI Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-purple-400 text-sm font-medium mb-2">Personality Traits</h4>
              <div className="flex flex-wrap gap-2">
                {data.ai_insights.personality_traits.map((trait, index) => (
                  <span key={index} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-emerald-400 text-sm font-medium mb-2">Core Themes</h4>
              <div className="flex flex-wrap gap-2">
                {data.ai_insights.core_themes.map((theme, index) => (
                  <span key={index} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-blue-400 text-sm font-medium mb-2">Writing Style</h4>
              <p className="text-white/80 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                {data.ai_insights.writing_style}
              </p>
            </div>
            
            {data.ai_insights.emotional_tone && (
              <div>
                <h4 className="text-amber-400 text-sm font-medium mb-2">Emotional Tone</h4>
                <p className="text-white/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  {data.ai_insights.emotional_tone}
                </p>
              </div>
            )}
          </div>
          
          {data.ai_insights.key_life_events && data.ai_insights.key_life_events.length > 0 && (
            <div className="mb-6">
              <h4 className="text-indigo-400 text-sm font-medium mb-3">Key Life Events</h4>
              <div className="space-y-3">
                {data.ai_insights.key_life_events.map((event, index) => (
                  <div key={index} className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                    <h5 className="font-medium text-white">{event.title}</h5>
                    <p className="text-white/80 text-sm">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {data.ai_insights.recurring_motifs && data.ai_insights.recurring_motifs.length > 0 && (
            <div className="mb-6">
              <h4 className="text-pink-400 text-sm font-medium mb-2">Recurring Motifs</h4>
              <div className="flex flex-wrap gap-2">
                {data.ai_insights.recurring_motifs.map((motif, index) => (
                  <span key={index} className="px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-full text-sm">
                    {motif}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {data.ai_insights.most_impactful_story && (
            <div>
              <h4 className="text-orange-400 text-sm font-medium mb-2">Most Impactful Story</h4>
              <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                <h5 className="font-medium text-white mb-2">{data.ai_insights.most_impactful_story.title}</h5>
                <p className="text-white/80">{data.ai_insights.most_impactful_story.summary}</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-white/50 text-right">
            Processed on {new Date(data.ai_insights.processed_at).toLocaleDateString()} with Google Gemini AI
          </div>
        </div>
      )}
      
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 space-x-2">
        {tabs.filter(tab => tab.count > 0 || tab.id === 'ai_insights' && data.ai_insights).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? `bg-white/10 ${tab.color}`
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 bg-white/10 rounded-full text-xs">
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* AI Insights Tab */}
      {activeTab === 'ai_insights' && data.ai_insights && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">Comprehensive Narrative Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-purple-400 font-medium mb-2">Personality Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {data.ai_insights.personality_traits.map((trait, index) => (
                    <span key={index} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-emerald-400 font-medium mb-2">Core Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {data.ai_insights.core_themes.map((theme, index) => (
                    <span key={index} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2">Writing Style</h4>
                <p className="text-white/80">{data.ai_insights.writing_style}</p>
              </div>
              
              {data.ai_insights.emotional_tone && (
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="text-amber-400 font-medium mb-2">Emotional Tone</h4>
                  <p className="text-white/80">{data.ai_insights.emotional_tone}</p>
                </div>
              )}
            </div>
            
            {data.ai_insights.key_life_events && data.ai_insights.key_life_events.length > 0 && (
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <h4 className="text-indigo-400 font-medium mb-3">Key Life Events</h4>
                <div className="space-y-3">
                  {data.ai_insights.key_life_events.map((event, index) => (
                    <div key={index} className="bg-indigo-500/10 p-3 rounded-lg border border-indigo-500/20">
                      <h5 className="font-medium text-white">{event.title}</h5>
                      <p className="text-white/80 text-sm">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.ai_insights.recurring_motifs && data.ai_insights.recurring_motifs.length > 0 && (
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <h4 className="text-pink-400 font-medium mb-2">Recurring Motifs</h4>
                <div className="flex flex-wrap gap-2">
                  {data.ai_insights.recurring_motifs.map((motif, index) => (
                    <span key={index} className="px-3 py-1.5 bg-pink-500/20 text-pink-300 rounded-full text-sm">
                      {motif}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {data.ai_insights.most_impactful_story && (
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-orange-400 font-medium mb-2">Most Impactful Story</h4>
                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
                  <h5 className="font-medium text-white mb-2">{data.ai_insights.most_impactful_story.title}</h5>
                  <p className="text-white/80">{data.ai_insights.most_impactful_story.summary}</p>
                </div>
              </div>
            )}
            
            <div className="mt-6 text-xs text-white/50 text-right">
              Processed on {new Date(data.ai_insights.processed_at).toLocaleDateString()} with Google Gemini AI
            </div>
          </div>
        </div>
      )}
      
      {/* Documents Section */}
      {activeTab === 'documents' && data.documents && data.documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <FilePdf className="w-5 h-5 text-blue-400" />
            Documents & Books
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.documents.map((doc, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <FilePdf className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{doc.title || doc.documentName}</h4>
                    <p className="text-white/60 text-sm">{doc.documentType.split('/')[1]?.toUpperCase() || 'Document'}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-white/50 text-xs">
                    {new Date(doc.timestamp).toLocaleDateString()}
                  </span>
                  
                  <div className="flex gap-2">
                    <a 
                      href={doc.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                    
                    <a 
                      href={doc.documentUrl} 
                      download={doc.documentName}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Narratives List */}
      {activeTab !== 'documents' && activeTab !== 'ai_insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getActiveTabData().map((narrative, index) => {
            const typeInfo = tabs.find(t => t.id === activeTab);
            const Icon = typeInfo?.icon || FileText;
            
            return (
              <div 
                key={index} 
                className={`bg-gradient-to-r ${getTabColor(activeTab)} rounded-lg p-4 cursor-pointer transition-all ${
                  selectedNarrative === narrative ? 'ring-2 ring-white/30' : 'hover:bg-opacity-80'
                }`}
                onClick={() => setSelectedNarrative(narrative === selectedNarrative ? null : narrative)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getTabIcon(activeTab)}
                  <h3 className="font-medium text-white">{narrative.title}</h3>
                  {narrative.aiEnhanced && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      AI Enhanced
                    </span>
                  )}
                </div>
                
                {narrative.content && (
                  <p className="text-white/70 text-sm line-clamp-2">
                    {narrative.content.substring(0, 120)}...
                  </p>
                )}
                {narrative.documentUrl && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <FilePdf className="w-4 h-4 text-blue-400" />
                    <a 
                      href={narrative.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {narrative.documentName || 'View Document'} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-white/50 text-xs">
                    {new Date(narrative.timestamp).toLocaleDateString()}
                  </span>
                  
                  <button
                    className={`p-1.5 rounded-full ${getTabTextColor(activeTab)} bg-white/5 hover:bg-white/10 transition-colors`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNarrative(narrative);
                    }}
                  >
                    {getTabIcon(activeTab)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Selected Narrative Detail */}
      {selectedNarrative && (
        <div className={`bg-gradient-to-r ${getTabColor(activeTab)} rounded-lg p-6 border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getTabIcon(activeTab)}
              <h3 className="text-xl font-semibold text-white">{selectedNarrative.title}</h3>
            </div>
            
            <button
              onClick={playNarrative}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Read Aloud</span>
                </>
              )}
            </button>
          </div>
          
          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <p className="text-white/90 whitespace-pre-line">
              {selectedNarrative.content}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">
              Written on {new Date(selectedNarrative.timestamp).toLocaleDateString()}
            </span>
            
            {selectedNarrative.aiEnhanced && (
              <span className="flex items-center gap-1 text-purple-400">
                <Brain className="w-4 h-4" />
                AI Enhanced
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {getActiveTabData().length === 0 && activeTab !== 'ai_insights' && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No {tabs.find(t => t.id === activeTab)?.label} Found</h3>
          <p className="text-white/60">
            {activeTab === 'documents' 
              ? "No documents have been uploaded yet. Upload documents in the Narrative Studio."
              : `No ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} have been added yet.`}
          </p>
        </div>
      )}
      
      {/* Empty State for AI Insights */}
      {activeTab === 'ai_insights' && !data.ai_insights && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Brain className="w-16 h-16 text-indigo-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No AI Insights Available</h3>
          <p className="text-white/60 mb-4">
            Process your narratives with Gemini AI to generate insights about your personality, writing style, and key themes.
          </p>
        </div>
      )}
    </div>
  );
}