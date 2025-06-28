import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, ChevronRight, ExternalLink, Save, X, Upload, FileText, Download, AlertCircle, ArrowRight, Edit, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations } from '../lib/memoir-integrations';

interface PersonalityTestInterfaceProps {
  memoriaProfileId?: string;
  onTestCompleted?: (results: any) => void;
  onClose?: () => void;
}

// Define personality types and their descriptions
const personalityTypes = {
  INTJ: {
    name: 'Architect',
    description: 'Imaginative and strategic thinkers with a plan for everything',
    color: 'from-purple-500 to-indigo-600'
  },
  INTP: {
    name: 'Logician',
    description: 'Innovative inventors with an unquenchable thirst for knowledge',
    color: 'from-purple-500 to-blue-600'
  },
  ENTJ: {
    name: 'Commander',
    description: 'Bold, imaginative and strong-willed leaders, always finding a way',
    color: 'from-blue-500 to-indigo-600'
  },
  ENTP: {
    name: 'Debater',
    description: 'Smart and curious thinkers who cannot resist an intellectual challenge',
    color: 'from-blue-500 to-teal-600'
  },
  INFJ: {
    name: 'Advocate',
    description: 'Quiet and mystical, yet very inspiring and tireless idealists',
    color: 'from-green-500 to-teal-600'
  },
  INFP: {
    name: 'Mediator',
    description: 'Poetic, kind and altruistic people, always eager to help a good cause',
    color: 'from-green-500 to-emerald-600'
  },
  ENFJ: {
    name: 'Protagonist',
    description: 'Charismatic and inspiring leaders, able to mesmerize their listeners',
    color: 'from-emerald-500 to-green-600'
  },
  ENFP: {
    name: 'Campaigner',
    description: 'Enthusiastic, creative and sociable free spirits, who can always find a reason to smile',
    color: 'from-teal-500 to-emerald-600'
  },
  ISTJ: {
    name: 'Logistician',
    description: 'Practical and fact-minded individuals, whose reliability cannot be doubted',
    color: 'from-amber-500 to-yellow-600'
  },
  ISFJ: {
    name: 'Defender',
    description: 'Very dedicated and warm protectors, always ready to defend their loved ones',
    color: 'from-yellow-500 to-amber-600'
  },
  ESTJ: {
    name: 'Executive',
    description: 'Excellent administrators, unsurpassed at managing things – or people',
    color: 'from-orange-500 to-amber-600'
  },
  ESFJ: {
    name: 'Consul',
    description: 'Extraordinarily caring, social and popular people, always eager to help',
    color: 'from-orange-500 to-red-600'
  },
  ISTP: {
    name: 'Virtuoso',
    description: 'Bold and practical experimenters, masters of all kinds of tools',
    color: 'from-red-500 to-orange-600'
  },
  ISFP: {
    name: 'Adventurer',
    description: 'Flexible and charming artists, always ready to explore and experience something new',
    color: 'from-red-500 to-pink-600'
  },
  ESTP: {
    name: 'Entrepreneur',
    description: 'Smart, energetic and very perceptive people, who truly enjoy living on the edge',
    color: 'from-pink-500 to-red-600'
  },
  ESFP: {
    name: 'Entertainer',
    description: 'Spontaneous, energetic and enthusiastic people – life is never boring around them',
    color: 'from-pink-500 to-purple-600'
  }
};

export function PersonalityTestInterface({ memoriaProfileId, onTestCompleted, onClose }: PersonalityTestInterfaceProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [typeName, setTypeName] = useState<string>('');
  const [existingResults, setExistingResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadExistingResults();
    }
  }, [user, memoriaProfileId]);

  const loadExistingResults = async () => {
    try {
      setIsLoading(true);
      
      if (memoriaProfileId) {
        // Load personality test results for Memoria profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        
        if (profile?.profile_data?.personality_test) {
          setExistingResults(profile.profile_data.personality_test);
          setSelectedType(profile.profile_data.personality_test.type);
          setTypeName(profile.profile_data.personality_test.name);
          setPdfUrl(profile.profile_data.personality_test.pdfUrl || null);
          setPdfName(profile.profile_data.personality_test.pdfName || null);
        }
      } else {
        // Load personality test results for user profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        
        if (profile?.memoir_data?.personality_test) {
          setExistingResults(profile.memoir_data.personality_test);
          setSelectedType(profile.memoir_data.personality_test.type);
          setTypeName(profile.memoir_data.personality_test.name);
          setPdfUrl(profile.memoir_data.personality_test.pdfUrl || null);
          setPdfName(profile.memoir_data.personality_test.pdfName || null);
        }
      }
    } catch (error) {
      console.error('Error loading existing results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResults = async () => {
    if (!user || !selectedType) {
      setSaveError("Please select a personality type");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const testResults = {
        type: selectedType,
        name: personalityTypes[selectedType as keyof typeof personalityTypes]?.name || 'Unknown',
        description: personalityTypes[selectedType as keyof typeof personalityTypes]?.description || '',
        completedAt: new Date().toISOString(),
        pdfUrl: pdfUrl,
        pdfName: pdfName
      };
      
      // Store personality test results
      await MemoirIntegrations.storePersonalityTestResults(user.id, testResults, memoriaProfileId);
      
      setExistingResults(testResults);
      setIsEditingType(false);
      
      if (onTestCompleted) {
        onTestCompleted(testResults);
      }
      
      // Auto-close after successful save
      setTimeout(() => {
        onClose?.();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving personality test results:', error);
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setPdfFile(file);
      setPdfUploadError(null);
      
      try {
        setUploadingPdf(true);
        
        // Upload the PDF to storage
        const fileUrl = await MemoirIntegrations.uploadDocumentFile(user.id, file, memoriaProfileId);
        
        // Update the personality test data with the PDF info
        const updatedTestResults = {
          ...(existingResults || {}),
          type: selectedType || existingResults?.type || 'INFJ',
          name: typeName || existingResults?.name || personalityTypes['INFJ'].name,
          description: personalityTypes[selectedType as keyof typeof personalityTypes]?.description || personalityTypes['INFJ'].description,
          pdfUrl: fileUrl,
          pdfName: file.name,
          pdfUploadedAt: new Date().toISOString()
        };
        
        // Store the updated test results
        await MemoirIntegrations.storePersonalityTestResults(user.id, updatedTestResults, memoriaProfileId);
        
        setPdfUrl(fileUrl);
        setPdfName(file.name);
        setPdfUploadSuccess(true);
        
        if (onTestCompleted) {
          onTestCompleted(updatedTestResults);
        }
      } catch (error) {
        console.error('Error uploading PDF:', error);
        setPdfUploadError(error instanceof Error ? error.message : 'Failed to upload PDF');
      } finally {
        setUploadingPdf(false);
      }
    } else if (file.type.startsWith('image/')) {
      setPdfFile(file);
      setPdfUploadError(null);
      
      try {
        setUploadingPdf(true);
        
        // Upload the image to documents storage
        const fileUrl = await MemoirIntegrations.uploadDocumentFile(user.id, file, memoriaProfileId);
        
        // Update the personality test data with the image info
        const updatedTestResults = {
          ...(existingResults || {}),
          type: selectedType || existingResults?.type || 'INFJ',
          name: typeName || existingResults?.name || personalityTypes['INFJ'].name,
          description: personalityTypes[selectedType as keyof typeof personalityTypes]?.description || personalityTypes['INFJ'].description,
          pdfUrl: fileUrl,
          pdfName: file.name,
          pdfUploadedAt: new Date().toISOString()
        };
        
        // Store the updated test results
        await MemoirIntegrations.storePersonalityTestResults(user.id, updatedTestResults, memoriaProfileId);
        
        setPdfUrl(fileUrl);
        setPdfName(file.name);
        setPdfUploadSuccess(true);
        
        if (onTestCompleted) {
          onTestCompleted(updatedTestResults);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        setPdfUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      } finally {
        setUploadingPdf(false);
      }
    } else {
      setPdfUploadError('Please select a PDF file or image file (JPG, PNG, etc.)');
    }
    
    event.target.value = '';
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
            <Brain className="w-8 h-8 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Memorial Personality Profile" : "Personality Profile"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-white/70">Loading personality data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Introduction */}
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-500/30">
              <h3 className="text-xl font-semibold text-white mb-4">About Personality Tests</h3>
              <p className="text-white/70 mb-4">
                Preserving your personality type adds depth to your digital legacy. Take the free 16Personalities test and upload your results to enhance your profile.
              </p>
              
              <a 
                href="https://www.16personalities.com/free-personality-test" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors w-fit"
              >
                <ExternalLink className="w-5 h-5" />
                Take the Free Test
              </a>
            </div>

            {/* Upload Results */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-indigo-400" />
                Upload Test Results
              </h3>
              
              <div className="mb-8">
                <p className="text-white/70 mb-6">
                  After completing the personality test, you can select your personality type and upload your results as a PDF or screenshot.
                </p>
                
                {/* Personality Type Selection */}
                {(!existingResults || !existingResults.type || isEditingType) ? (
                  <div className="mb-6">
                    <label className="block text-sm text-white/70 mb-2">Your Personality Type</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(personalityTypes).map(([type, info]) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedType(type);
                            setTypeName(info.name);
                          }}
                          className={`px-3 py-2 rounded-lg text-center transition-colors ${
                            selectedType === type 
                              ? `bg-gradient-to-r ${info.color} text-white` 
                              : 'bg-white/5 hover:bg-white/10 text-white/70'
                          }`}
                        >
                          <div className="font-bold">{type}</div>
                          <div className="text-xs">{info.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-white/70">Your Personality Type</label>
                      <button
                        onClick={() => setIsEditingType(true)}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full hover:bg-indigo-500/30 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Change Type
                      </button>
                    </div>
                    <div className={`bg-gradient-to-r ${personalityTypes[existingResults.type as keyof typeof personalityTypes]?.color || 'from-indigo-500 to-purple-500'} p-4 rounded-lg text-white`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold">{existingResults.type}</div>
                        <div className="font-medium">{existingResults.name}</div>
                      </div>
                      <p className="text-white/90">{existingResults.description}</p>
                    </div>
                  </div>
                )}
              
                {/* File Upload */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Upload PDF or Image of Test Results</label>
                  
                  {pdfUrl ? (
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-400" />
                          <div>
                            <p className="text-white font-medium">{pdfName || 'Personality Test Results'}</p>
                            {existingResults?.pdfUploadedAt && (
                              <p className="text-white/60 text-sm">Uploaded on {new Date(existingResults.pdfUploadedAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View
                          </a>
                          <a 
                            href={pdfUrl} 
                            download
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                          <button
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.click();
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Replace
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <input 
                        type="file"
                        accept=".pdf,image/*,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        ref={fileInputRef}
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-indigo-500/30 rounded-lg p-6 text-center cursor-pointer hover:bg-indigo-500/5 transition-colors"
                      >
                        <FileText className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
                        <p className="text-white mb-2">Click to upload your test results</p>
                        <p className="text-white/50 text-sm">PDF file or image (screenshot)</p>
                      </div>
                    </div>
                  )}
                  
                  {uploadingPdf && (
                    <div className="mt-4 flex items-center justify-center gap-3 text-white/70">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading file...</span>
                    </div>
                  )}
                  
                  {pdfUploadError && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{pdfUploadError}</span>
                      </div>
                    </div>
                  )}
                  
                  {pdfUploadSuccess && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>File uploaded successfully!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Save Button */}
              {((!existingResults || !existingResults.type) || isEditingType) && (
                <div className="flex gap-3">
                  <button
                    onClick={saveResults}
                    disabled={!selectedType || isSaving}
                    className="flex-1 items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors inline-flex justify-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Personality Type
                      </>
                    )}
                  </button>
                  
                  {isEditingType && (
                    <button
                      onClick={() => {
                        setIsEditingType(false);
                        setSelectedType(existingResults?.type || null);
                        setTypeName(existingResults?.name || '');
                      }}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  )}
                </div>
              )}
              
              {/* Reset / Change Personality Type (for when it's not in edit mode but has existing results) */}
              {existingResults && existingResults.type && !isEditingType && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to change your personality type? Your current selection will be replaced.')) {
                      setIsEditingType(true);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Change Personality Type
                </button>
              )}
              
              {saveError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{saveError}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Why This Matters */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Why This Matters for Your Digital Legacy</h3>
              <p className="text-white/70 mb-4">
                Your personality type provides insights into your preferences, decision-making style, and how you interact with the world. By preserving this information:
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-white/70">
                  <ChevronRight className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>Future generations can gain a deeper understanding of your character</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <ChevronRight className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>AI systems can more accurately represent your authentic voice and perspectives</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <ChevronRight className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>Your loved ones can discover aspects of your personality they might not have fully appreciated</span>
                </li>
                <li className="flex items-start gap-2 text-white/70">
                  <ChevronRight className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>It adds psychological depth to your digital legacy</span>
                </li>
              </ul>
            </div>
            
            {/* More Information */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Personality Type Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://www.16personalities.com/free-personality-test" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <Brain className="w-6 h-6 text-indigo-400" />
                  <div>
                    <h4 className="font-semibold text-white">Free Personality Test</h4>
                    <p className="text-white/60 text-sm">Take the official 16Personalities test</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 ml-auto" />
                </a>
                
                <a 
                  href="https://www.16personalities.com/personality-types" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <FileText className="w-6 h-6 text-purple-400" />
                  <div>
                    <h4 className="font-semibold text-white">Type Descriptions</h4>
                    <p className="text-white/60 text-sm">Learn about all 16 personality types</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/40 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}