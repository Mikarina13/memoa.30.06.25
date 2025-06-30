import { useState, useEffect } from 'react';
import { FileText, Brain, Heart, PenTool, CheckCircle, ExternalLink, FileVideo, Newspaper, FileText as FilePdf } from 'lucide-react';

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

  // Reset state when switching avatars
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [initialTab]);

  const getNarrativeTypeIcon = (type: string) => {
    switch (type) {
      case 'personal_stories':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'memories':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'values':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'wisdom':
        return <Brain className="w-4 h-4 text-emerald-400" />;
      case 'reflections':
        return <Brain className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">Narratives</h2>
      
      {/* AI Insights */}
      {data.ai_insights && (
        <div className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-lg p-6 border border-purple-500/30 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">AI Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
          
          <div>
            <h4 className="text-blue-400 text-sm font-medium mb-2">Writing Style</h4>
            <p className="text-white/80 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              {data.ai_insights.writing_style}
            </p>
          </div>
        </div>
      )}
      
      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto pb-2 space-x-2">
        {['personal_stories', 'memories', 'values', 'wisdom', 'reflections', 'documents'].map((tab) => {
          // Skip tabs with no content
          if (
            (tab === 'personal_stories' && !data.personal_stories?.length) ||
            (tab === 'memories' && !data.memories?.length) ||
            (tab === 'values' && !data.values?.length) ||
            (tab === 'wisdom' && !data.wisdom?.length) ||
            (tab === 'reflections' && !data.reflections?.length) ||
            (tab === 'documents' && !data.documents?.length)
          ) {
            return null;
          }

          let tabLabel = '';
          let tabIcon = null;
          let itemCount = 0;

          switch (tab) {
            case 'personal_stories':
              tabLabel = 'Personal Stories';
              tabIcon = <FileText className="w-4 h-4" />;
              itemCount = data.personal_stories?.length || 0;
              break;
            case 'memories':
              tabLabel = 'Memories';
              tabIcon = <Brain className="w-4 h-4" />;
              itemCount = data.memories?.length || 0;
              break;
            case 'values':
              tabLabel = 'Core Values';
              tabIcon = <Heart className="w-4 h-4" />;
              itemCount = data.values?.length || 0;
              break;
            case 'wisdom':
              tabLabel = 'Wisdom';
              tabIcon = <PenTool className="w-4 h-4" />;
              itemCount = data.wisdom?.length || 0;
              break;
            case 'reflections':
              tabLabel = 'Reflections';
              tabIcon = <CheckCircle className="w-4 h-4" />;
              itemCount = data.reflections?.length || 0;
              break;
            case 'documents':
              tabLabel = 'Documents';
              tabIcon = <FilePdf className="w-4 h-4" />;
              itemCount = data.documents?.length || 0;
              break;
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? `bg-white/10 ${tab === 'personal_stories' ? 'text-blue-400' : 
                      tab === 'memories' ? 'text-purple-400' : 
                      tab === 'values' ? 'text-pink-400' : 
                      tab === 'wisdom' ? 'text-emerald-400' : 
                      tab === 'reflections' ? 'text-amber-400' : 
                      tab === 'documents' ? 'text-blue-400' : 'text-white'}`
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {tabIcon}
              <span>{tabLabel}</span>
              <span className="px-1.5 py-0.5 bg-white/10 rounded-full text-xs">
                {itemCount}
              </span>
            </button>
          );
        })}
      </div>
      
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
                      <FileText className="w-4 h-4" />
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
      {activeTab !== 'documents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(() => {
            let narrativeItems;
            switch(activeTab) {
              case 'personal_stories':
                narrativeItems = data.personal_stories || [];
                break;
              case 'memories':
                narrativeItems = data.memories || [];
                break;
              case 'values':
                narrativeItems = data.values || [];
                break;
              case 'wisdom':
                narrativeItems = data.wisdom || [];
                break;
              case 'reflections':
                narrativeItems = data.reflections || [];
                break;
              default:
                narrativeItems = [];
            }
            
            return narrativeItems.map((narrative, index) => {
              const typeInfo = {
                personal_stories: { icon: FileText, color: 'text-blue-400', label: 'Personal Story' },
                memories: { icon: Brain, color: 'text-purple-400', label: 'Memory' },
                values: { icon: Heart, color: 'text-pink-400', label: 'Core Value' },
                wisdom: { icon: PenTool, color: 'text-emerald-400', label: 'Wisdom' },
                reflections: { icon: CheckCircle, color: 'text-amber-400', label: 'Reflection' }
              };
              
              const Icon = typeInfo[activeTab as keyof typeof typeInfo]?.icon || FileText;
              const color = typeInfo[activeTab as keyof typeof typeInfo]?.color || 'text-gray-400';
              const label = typeInfo[activeTab as keyof typeof typeInfo]?.label || 'Item';
              
              return (
                <div 
                  key={index} 
                  className={`bg-gradient-to-r 
                    ${activeTab === 'personal_stories' ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' :
                      activeTab === 'memories' ? 'from-purple-500/20 to-purple-600/20 border-purple-500/30' :
                      activeTab === 'values' ? 'from-pink-500/20 to-pink-600/20 border-pink-500/30' :
                      activeTab === 'wisdom' ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' :
                      'from-amber-500/20 to-amber-600/20 border-amber-500/30'}
                    rounded-lg p-4 cursor-pointer hover:bg-opacity-30 transition-all border`}
                  onClick={() => setSelectedNarrative(narrative)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <h4 className="font-medium text-white">{narrative.title}</h4>
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/70">
                      {label}
                    </span>
                    {narrative.aiEnhanced && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                        AI Enhanced
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{narrative.content}</p>
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
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
      
      {/* Selected Narrative Detail */}
      {selectedNarrative && (
        <div className={`bg-gradient-to-r 
          ${activeTab === 'personal_stories' ? 'from-blue-500/20 to-blue-600/20 border-blue-500/30' :
            activeTab === 'memories' ? 'from-purple-500/20 to-purple-600/20 border-purple-500/30' :
            activeTab === 'values' ? 'from-pink-500/20 to-pink-600/20 border-pink-500/30' :
            activeTab === 'wisdom' ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' :
            'from-amber-500/20 to-amber-600/20 border-amber-500/30'}
          rounded-lg p-6 border`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getNarrativeTypeIcon(activeTab)}
              <h3 className="text-xl font-semibold text-white">{selectedNarrative.title}</h3>
            </div>
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
      {activeTab !== 'documents' && (() => {
        const narratives = activeTab === 'personal_stories' ? data.personal_stories :
                         activeTab === 'memories' ? data.memories :
                         activeTab === 'values' ? data.values :
                         activeTab === 'wisdom' ? data.wisdom :
                         activeTab === 'reflections' ? data.reflections : [];
        
        if (!narratives || narratives.length === 0) {
          return (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No {activeTab === 'personal_stories' ? 'Personal Stories' : 
                   activeTab === 'memories' ? 'Memories' : 
                   activeTab === 'values' ? 'Core Values' : 
                   activeTab === 'wisdom' ? 'Wisdom' : 
                   'Reflections'} Found
              </h3>
              <p className="text-white/60">
                {`No ${activeTab.replace('_', ' ')} have been added yet.`}
              </p>
            </div>
          );
        }
        return null;
      })()}
      
      {activeTab === 'documents' && (!data.documents || data.documents.length === 0) && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <FilePdf className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Documents Found</h3>
          <p className="text-white/60">No documents have been uploaded yet.</p>
        </div>
      )}
    </div>
  );
}