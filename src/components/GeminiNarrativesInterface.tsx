import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Save, Sparkles, CheckCircle, AlertCircle, PenTool, FileText, Trash2, Download, Upload, Database, FileUp, File as FilePdf, BookOpen } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';
import { OnlineDataImportInterface } from './OnlineDataImportInterface';

interface NarrativeSection {
  id: string;
  title: string;
  content: string | null;
  type: 'personal_story' | 'memory' | 'value' | 'wisdom' | 'reflection' | 'document';
  timestamp: Date;
  aiEnhanced?: boolean;
  documentUrl?: string;
  documentType?: string;
  documentName?: string;
}

interface GeminiNarrativesInterfaceProps {
  memoriaProfileId?: string;
  onNarrativesProcessed?: (narrativeData: any) => void;
  onClose?: () => void;
}

export function GeminiNarrativesInterface({ memoriaProfileId, onNarrativesProcessed, onClose }: GeminiNarrativesInterfaceProps) {
  const { user } = useAuth();
  const [narratives, setNarratives] = useState<NarrativeSection[]>([]);
  const [currentNarrative, setCurrentNarrative] = useState<NarrativeSection>({
    id: '',
    title: '',
    content: '',
    type: 'personal_story',
    timestamp: new Date()
  });
  const [processStatus, setProcessStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processError, setProcessError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'manage'>('write');
  const [showOnlineDataImport, setShowOnlineDataImport] = useState(false);
  const [selectedType, setSelectedType] = useState<NarrativeSection['type']>('personal_story');

  // Ref for document file input
  const documentInputRef = useRef<HTMLInputElement>(null);

  const narrativeTypes = [
    { id: 'personal_story', label: 'Personal Story', icon: FileText, description: 'Share meaningful life experiences' },
    { id: 'memory', label: 'Memory', icon: Brain, description: 'Capture special moments and recollections' },
    { id: 'value', label: 'Core Value', icon: Sparkles, description: 'Express your fundamental beliefs' },
    { id: 'wisdom', label: 'Wisdom', icon: PenTool, description: 'Share lessons learned and advice' },
    { id: 'reflection', label: 'Reflection', icon: CheckCircle, description: 'Thoughtful contemplations on life' },
    { id: 'document', label: 'Upload Document', icon: BookOpen, description: 'Share books, cookbooks, PDFs, and documents' }
  ] as const;

  useEffect(() => {
    if (user) {
      loadExistingNarratives();
    }
  }, [user]);

  const loadExistingNarratives = async () => {
    try {
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
      if (profile?.memoir_data?.narratives || profile?.profile_data?.narratives) {
        const narrativesData = profile?.memoir_data?.narratives || profile?.profile_data?.narratives;
        const loadedNarratives = Object.entries(narrativesData).flatMap(([type, stories]: [string, any]) => {
          if (Array.isArray(stories)) {
            return stories.map((story, index) => ({
              id: `${type}-${index}`,
              title: story.title || story.documentName || `${type.replace('_', ' ')} ${index + 1}`,
              content: story.content || (typeof story === 'string' ? story : null),
              type: type as NarrativeSection['type'],
              timestamp: new Date(story.timestamp || Date.now()),
              aiEnhanced: story.aiEnhanced || false,
              documentUrl: story.documentUrl || null,
              documentType: story.documentType || null,
              documentName: story.documentName || null
            }));
          }
          return [];
        });
        setNarratives(loadedNarratives);
      }
    } catch (error) {
      console.error('Error loading narratives:', error);
    }
  };

  const handleSaveNarrative = async () => {
    if (!currentNarrative.title.trim() || !currentNarrative.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    const newNarrative: NarrativeSection = {
      ...currentNarrative,
      id: `narrative-${Date.now()}`,
      type: selectedType,
      timestamp: new Date()
    };

    setNarratives(prev => [...prev, newNarrative]);

    if (user) {
      try {
        // Get current memoir data to preserve existing narratives
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        const currentNarratives = memoriaProfileId 
          ? profile?.profile_data?.narratives || {}
          : profile?.memoir_data?.narratives || {};
        
        // Organize narratives by type
        const typeKey = selectedType === 'personal_story' ? 'personal_stories' : 
                       selectedType === 'memory' ? 'memories' :
                       selectedType === 'value' ? 'values' :
                       selectedType === 'wisdom' ? 'wisdom' : 
                       selectedType === 'document' ? 'documents' : 'reflections';
        
        const updatedNarratives = {
          ...currentNarratives,
          [typeKey]: [
            ...(currentNarratives[typeKey] || []),
            {
              title: newNarrative.title,
              content: newNarrative.content,
              timestamp: newNarrative.timestamp.toISOString(),
              aiEnhanced: false
            }
          ]
        };
        
        // Update memoir data with the new narrative structure
        await MemoirIntegrations.updateMemoirData(user.id, { narratives: updatedNarratives }, memoriaProfileId);
      } catch (error) {
        console.error('Error saving narrative:', error);
      }
    }
    setCurrentNarrative({
      id: '',
      title: '',
      content: '',
      type: selectedType,
      timestamp: new Date()
    });
  };
  
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (user) {
      try {
        // Upload the document directly using the improved MemoirIntegrations method
        const documentUrl = await MemoirIntegrations.uploadDocumentFile(user.id, file, memoriaProfileId);
        
        // Create a new narrative for the document
        const documentNarrative: NarrativeSection = {
          id: `document-${Date.now()}`,
          title: file.name.split('.')[0] || 'Uploaded Document',
          content: null, // No text content for documents
          type: 'document',
          timestamp: new Date(),
          documentUrl: documentUrl,
          documentType: file.type || MemoirIntegrations.getMimeTypeFromFile(file),
          documentName: file.name
        };
        
        setNarratives(prev => [...prev, documentNarrative]);
        
        // Get current memoir data to preserve existing narratives
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        const currentNarratives = memoriaProfileId
          ? profile?.profile_data?.narratives || {}
          : profile?.memoir_data?.narratives || {};
        
        // Add to documents collection
        const updatedNarratives = {
          ...currentNarratives,
          documents: [
            ...(currentNarratives.documents || []),
            {
              title: documentNarrative.title,
              documentUrl: documentUrl,
              documentType: documentNarrative.documentType,
              documentName: file.name,
              timestamp: documentNarrative.timestamp.toISOString()
            }
          ]
        };
        
        // Update memoir data with the new document
        await MemoirIntegrations.updateMemoirData(user.id, { narratives: updatedNarratives }, memoriaProfileId);
        
        // Show success message
        alert(`Document "${file.name}" uploaded successfully!`);
      } catch (error) {
        console.error('Error uploading document:', error);
        alert('Failed to upload document. Please try again.');
      }
    }
    
    // Reset the file input
    event.target.value = '';
  };
  
  const handleOnlineDataImport = (data: { content: string, source: string }) => {
    // Create a title based on the source
    let title = '';
    switch (data.source) {
      case 'social_media':
        title = 'Social Media Content';
        break;
      case 'blog':
        title = 'Blog Entry';
        break;
      case 'email':
        title = 'Email Correspondence';
        break;
      case 'messages':
        title = 'Text Messages';
        break;
      case 'reviews':
        title = 'Online Review/Comment';
        break;
      case 'journal':
        title = 'Digital Journal Entry';
        break;
      default:
        title = 'Imported Online Content';
    }
    
    // Create a new narrative with the imported content
    const newNarrative: NarrativeSection = {
      id: `narrative-${Date.now()}`,
      title: `${title} (${new Date().toLocaleDateString()})`,
      content: data.content,
      type: selectedType,
      timestamp: new Date()
    };

    setNarratives(prev => [...prev, newNarrative]);
    setShowOnlineDataImport(false);

    // Save to database if user is logged in
    if (user) {
      try {
        // Get current memoir data to preserve existing narratives
        MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId).then(profile => {
          const currentNarratives = memoriaProfileId
            ? profile?.profile_data?.narratives || {}
            : profile?.memoir_data?.narratives || {};
          
          // Organize narratives by type
          const typeKey = selectedType === 'personal_story' ? 'personal_stories' : 
                         selectedType === 'memory' ? 'memories' :
                         selectedType === 'value' ? 'values' :
                         selectedType === 'wisdom' ? 'wisdom' : 'reflections';
          
          const updatedNarratives = {
            ...currentNarratives,
            [typeKey]: [
              ...(currentNarratives[typeKey] || []),
              {
                title: newNarrative.title,
                content: newNarrative.content,
                timestamp: newNarrative.timestamp.toISOString(),
                aiEnhanced: false,
                source: data.source
              }
            ]
          };
          
          // Update memoir data with the new narrative structure
          MemoirIntegrations.updateMemoirData(user.id, { narratives: updatedNarratives }, memoriaProfileId);
        });
      } catch (error) {
        console.error('Error saving imported narrative:', error);
      }
    }
  };

  const handleDeleteNarrative = (narrativeId: string) => {
    setNarratives(prev => prev.filter(n => n.id !== narrativeId));
  };

  const handleImportText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCurrentNarrative(prev => ({
          ...prev,
          content: prev.content + '\n\n' + content
        }));
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const exportNarratives = () => {
    const data = {
      narratives: narratives,
      exportDate: new Date().toISOString(),
      user: user.email
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoir-narratives-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processWithGeminiAI = async () => {
    if (!user || narratives.length === 0) return;

    setProcessStatus('processing');
    setProcessError(null);

    try {
      // Update integration status to in_progress
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
        status: 'in_progress'
      }, memoriaProfileId);

      // Organize narratives by type
      const organizedNarratives = narratives.reduce((acc, narrative) => {
        if (!acc[narrative.type]) {
          acc[narrative.type] = [];
        }
        acc[narrative.type].push({
          title: narrative.title,
          content: narrative.content,
          timestamp: narrative.timestamp.toISOString(),
          aiEnhanced: narrative.aiEnhanced
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Mock Gemini AI processing (in real implementation, this would call Gemini API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate AI enhancement
      const enhancedNarratives = {
        ...organizedNarratives,
        ai_insights: {
          personality_traits: ['thoughtful', 'reflective', 'empathetic'],
          core_themes: ['family', 'growth', 'resilience'],
          writing_style: 'contemplative and heartfelt',
          processed_at: new Date().toISOString()
        }
      };

      // Store processed narratives in memoir_data
      await MemoirIntegrations.updateMemoirData(user.id, {
        narratives: enhancedNarratives
      }, memoriaProfileId);

      // Update integration status to completed
      await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
        status: 'completed',
        narratives_processed: true
      }, memoriaProfileId);

      setProcessStatus('success');
      onNarrativesProcessed?.(enhancedNarratives);

    } catch (error) {
      console.error('Error processing with Gemini:', error);
      setProcessStatus('error');
      
      // Set user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          setProcessError('Invalid Gemini API key. Please check your configuration.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          setProcessError('Gemini API quota exceeded. Please try again later.');
        } else {
          setProcessError(error.message);
        }
      } else {
        setProcessError('An unexpected error occurred. Please try again.');
      }

      // Update integration status to error
      if (user) {
        try {
          await MemoirIntegrations.updateIntegrationStatus(user.id, 'gemini', {
            status: 'error'
          }, memoriaProfileId);
        } catch (statusError) {
          console.error('Error updating integration status:', statusError);
        }
      }
    }
  };

  const selectedTypeInfo = narrativeTypes.find(t => t.id === selectedType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-70 p-4"
    >
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white font-[Orbitron]">Narrative Studio</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-8">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'write' ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('write')}
          >
            Write & Create
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'manage' ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('manage')}
          >
            Manage & Process
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="space-y-6">
            {/* Narrative Type Selection */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Content Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {narrativeTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg transition-all text-left ${
                        selectedType === type.id
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium text-white">{type.label}</span>
                      </div>
                      <p className="text-sm text-white/60">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Upload Interface */}
            {selectedType === 'document' ? (
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Upload Document</h3>
                </div>
                
                <div 
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                  onClick={() => documentInputRef.current?.click()}
                >
                  <FilePdf className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white text-lg mb-2">Upload your document</p>
                  <p className="text-white/60 text-sm">Click here or drag and drop a PDF, Word document, or text file</p>
                  <p className="text-white/40 text-xs mt-2">Supported formats: PDF, DOC, DOCX, TXT</p>
                </div>
                
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDocumentUpload}
                  className="hidden"
                />

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">Document Features:</h4>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Upload cookbooks, memoirs, or any important documents</li>
                    <li>• Documents will be accessible directly from your memorial space</li>
                    <li>• Share your written works with future generations</li>
                    <li>• Preserve important texts as part of your digital legacy</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Writing Interface for other narrative types */
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  {selectedTypeInfo && <selectedTypeInfo.icon className="w-6 h-6 text-emerald-400" />}
                  <h3 className="text-lg font-semibold text-white">Write Your {selectedTypeInfo?.label}</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder={`Enter a title for your ${selectedTypeInfo?.label.toLowerCase()}`}
                      value={currentNarrative.title}
                      onChange={(e) => setCurrentNarrative(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Content</label>
                    <textarea
                      placeholder={`Share your ${selectedTypeInfo?.label.toLowerCase()}... Write freely and authentically.`}
                      value={currentNarrative.content || ''}
                      onChange={(e) => setCurrentNarrative(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 h-48 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSaveNarrative}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-5 h-5" />
                      Save Narrative
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOnlineDataImport(true);
                      }}
                      className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      Import Online Data
                    </button>
                    
                    <label className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Import Text
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleImportText}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">Writing Tips:</h4>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Write in your authentic voice</li>
                      <li>• Include specific details and emotions</li>
                      <li>• Consider what you want others to remember</li>
                      <li>• Don't worry about perfect grammar - focus on meaning</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Saved Narratives */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Saved Narratives ({narratives.length})</h3>
                <button
                  onClick={exportNarratives}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              
              {narratives.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {narratives.map((narrative) => {
                    const typeInfo = narrativeTypes.find(t => t.id === narrative.type);
                    const Icon = typeInfo?.icon || FileText;
                    
                    return (
                      <div key={narrative.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-emerald-400" />
                              <span className="font-medium text-white">{narrative.title}</span>
                              <div className="flex items-center gap-1">
                                {narrative.type === 'document' ? (
                                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                                    Document
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                                    {typeInfo?.label}
                                  </span>
                                )}
                                {narrative.aiEnhanced && (
                                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                                    AI Enhanced
                                  </span>
                                )}
                              </div>
                            </div>
                            {narrative.type === 'document' ? (
                              <div className="flex items-center gap-2 text-white/70 text-sm">
                                <FilePdf className="w-4 h-4 text-blue-400" />
                                <a 
                                  href={narrative.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {narrative.documentName} <span className="inline-block ml-1">↗</span>
                                </a>
                              </div>
                            ) : (
                              narrative.content && (
                                <p className="text-white/70 text-sm line-clamp-2">
                                  {narrative.content.substring(0, 120)}...
                                </p>
                              )
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteNarrative(narrative.id)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No narratives saved yet. Switch to "Write & Create" to get started.</p>
                </div>
              )}
            </div>

            {/* Gemini AI Processing */}
            <div className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded-lg p-6 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Gemini AI Processing</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                Enhance your narratives with Google Gemini AI. Get insights, personality analysis, and thematic organization of your stories.
              </p>

              {processError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {processError}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={processWithGeminiAI}
                  disabled={narratives.length === 0 || processStatus === 'processing'}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {processStatus === 'processing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : processStatus === 'success' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Processed!
                    </>
                  ) : processStatus === 'error' ? (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Try Again
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Process with AI
                    </>
                  )}
                </button>
              </div>

              {processStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Narratives successfully processed!</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">
                    Your stories have been analyzed and enhanced with AI insights.
                  </p>
                </div>
              )}

              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h4 className="text-purple-400 font-medium mb-2">AI Processing Includes:</h4>
                <ul className="text-white/70 text-sm space-y-1">
                  <li>• Personality trait analysis</li>
                  <li>• Core theme identification</li>
                  <li>• Writing style assessment</li>
                  <li>• Narrative organization and enhancement</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Online Data Import Modal */}
      <AnimatePresence>
        {showOnlineDataImport && (
          <OnlineDataImportInterface
            onDataImported={handleOnlineDataImport}
            onClose={() => setShowOnlineDataImport(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
}