import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, ChevronRight, ExternalLink, Save, X, Upload, FileText, Download, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useNavigate, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { EnhancedDatePicker } from './EnhancedDatePicker';

interface PersonalityTestProps {
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

// Sample questions from the 16Personalities test
const sampleQuestions = [
  {
    id: 1,
    text: "You regularly make new friends.",
    category: "Extraversion"
  },
  {
    id: 2,
    text: "You spend a lot of your free time exploring various random topics that pique your interest.",
    category: "Intuition"
  },
  {
    id: 3,
    text: "Seeing other people cry can easily make you feel like you want to cry too.",
    category: "Feeling"
  },
  {
    id: 4,
    text: "You usually stay calm, even under a lot of pressure.",
    category: "Judging"
  },
  {
    id: 5,
    text: "At social events, you rarely try to introduce yourself to new people and mostly talk to the ones you already know.",
    category: "Introversion"
  },
  {
    id: 6,
    text: "You prefer to completely finish one project before starting another.",
    category: "Judging"
  },
  {
    id: 7,
    text: "You are more of a natural improviser than a careful planner.",
    category: "Perceiving"
  },
  {
    id: 8,
    text: "Your emotions control you more than you control them.",
    category: "Feeling"
  },
  {
    id: 9,
    text: "You enjoy going to social events that involve dress-up or role-play activities.",
    category: "Extraversion"
  },
  {
    id: 10,
    text: "You often spend time exploring unrealistic yet intriguing ideas.",
    category: "Intuition"
  }
];

export function PersonalityTest({ memoriaProfileId: propMemoriaProfileId, onTestCompleted, onClose }: PersonalityTestProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [personalityType, setPersonalityType] = useState<string | null>(null);
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
  const [personName, setPersonName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get memoriaProfileId from either props or location state
  const memoriaProfileId = propMemoriaProfileId || location.state?.memoriaProfileId;
  const returnPath = location.state?.returnPath || '/';

  useEffect(() => {
    document.title = 'Personality Test';
    
    // Redirect if user is not authenticated
    if (!loading && !user) {
      navigate('/memento');
    }
    
    // Load personality test data
    if (user) {
      loadPersonalityData();
    }
  }, [navigate, user, loading, memoriaProfileId]);

  useEffect(() => {
    if (user && memoriaProfileId) {
      // Load profile info to get the person's name
      loadProfileInfo();
      // Load any previously saved generated images
      loadSavedImages();
    }
  }, [user, memoriaProfileId]);

  const loadProfileInfo = async () => {
    try {
      const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
      if (profile) {
        setPersonName(profile.name || '');
      }
    } catch (error) {
      console.error('Error loading profile info:', error);
    }
  };

  const loadSavedImages = async () => {
    try {
      if (!user || !memoriaProfileId) return;
      
      // Do whatever loading is needed for saved images
      // This is just a placeholder function that matches the component structure
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  const loadPersonalityData = async () => {
    try {
      setIsLoading(true);
      
      if (memoriaProfileId) {
        // Load personality test results for Memoria profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id, memoriaProfileId);
        
        if (profile?.profile_data?.personality_test) {
          setExistingResults(profile.profile_data.personality_test);
          setPersonalityType(profile.profile_data.personality_test.type);
          setPdfUrl(profile.profile_data.personality_test.pdfUrl || null);
          setPdfName(profile.profile_data.personality_test.pdfName || null);
        }
      } else {
        // Load personality test results for user profile
        const profile = await MemoirIntegrations.getMemoirProfile(user.id);
        
        if (profile?.memoir_data?.personality_test) {
          setExistingResults(profile.memoir_data.personality_test);
          setPersonalityType(profile.memoir_data.personality_test.type);
          setPdfUrl(profile.memoir_data.personality_test.pdfUrl || null);
          setPdfName(profile.memoir_data.personality_test.pdfName || null);
        }
      }
    } catch (error) {
      console.error('Error loading personality data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));

    // Move to next question or complete test
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = () => {
    // Calculate personality type based on answers
    // This is a simplified version - the real test has many more questions and complex scoring
    
    // Count traits based on answers
    let e = 0, i = 0, s = 0, n = 0, t = 0, f = 0, j = 0, p = 0;
    
    Object.entries(answers).forEach(([questionId, value]) => {
      const question = sampleQuestions.find(q => q.id === parseInt(questionId));
      if (!question) return;
      
      switch (question.category) {
        case "Extraversion":
          value > 3 ? e++ : i++;
          break;
        case "Introversion":
          value > 3 ? i++ : e++;
          break;
        case "Sensing":
          value > 3 ? s++ : n++;
          break;
        case "Intuition":
          value > 3 ? n++ : s++;
          break;
        case "Thinking":
          value > 3 ? t++ : f++;
          break;
        case "Feeling":
          value > 3 ? f++ : t++;
          break;
        case "Judging":
          value > 3 ? j++ : p++;
          break;
        case "Perceiving":
          value > 3 ? p++ : j++;
          break;
      }
    });
    
    // Determine type based on highest scores
    const type = `${e > i ? 'E' : 'I'}${n > s ? 'N' : 'S'}${f > t ? 'F' : 'T'}${j > p ? 'J' : 'P'}`;
    setPersonalityType(type);
    setTestCompleted(true);
    
    // Save results
    saveResults(type);
  };

  const saveResults = async (type: string) => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const testResults = {
        type,
        name: personalityTypes[type as keyof typeof personalityTypes]?.name || 'Unknown',
        description: personalityTypes[type as keyof typeof personalityTypes]?.description || '',
        answers,
        completedAt: new Date().toISOString(),
        pdfUrl: pdfUrl
      };
      
      // Store personality test results
      await MemoirIntegrations.storePersonalityTestResults(user.id, testResults, memoriaProfileId);
      
      setExistingResults(testResults);
      
      if (onTestCompleted) {
        onTestCompleted(testResults);
      }
    } catch (error) {
      console.error('Error saving personality test results:', error);
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const restartTest = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTestCompleted(false);
    setPersonalityType(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingPdf(true);
      setPdfUploadError(null);
      
      // Upload the PDF to storage using improved method
      const fileUrl = await MemoirIntegrations.uploadDocumentFile(user.id, file, memoriaProfileId);
      
      // Update the personality test data with the PDF info
      const updatedTestResults = {
        ...existingResults,
        pdfUrl: fileUrl,
        pdfName: file.name,
        pdfUploadedAt: new Date().toISOString()
      };
      
      // Store the updated test results
      await MemoirIntegrations.storePersonalityTestResults(user.id, updatedTestResults, memoriaProfileId);
      
      setPdfUrl(fileUrl);
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
    
    event.target.value = '';
  };

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(returnPath);
    }
  };

  const currentQuestion = sampleQuestions[currentQuestionIndex];

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
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white p-8 font-[Orbitron]">
      <div className="fixed top-8 left-8 z-40">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          Return
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Personality Profile
        </h1>

        <p className="text-lg text-white/70 leading-relaxed font-[Rajdhani] text-center mb-12 max-w-3xl mx-auto">
          Capture your psychological profile to enhance your digital legacy
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-white/70">Loading personality data...</p>
          </div>
        ) : existingResults && !testCompleted ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-500/30">
              <h3 className="text-xl font-semibold text-white mb-4">You've already taken this test</h3>
              <p className="text-white/70 mb-4">
                You completed the personality test on {new Date(existingResults.completedAt).toLocaleDateString()}. 
                Your personality type is:
              </p>
              
              <div className={`bg-gradient-to-r ${personalityTypes[existingResults.type as keyof typeof personalityTypes]?.color || 'from-blue-500 to-purple-600'} p-6 rounded-lg text-white mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-2xl font-bold">{existingResults.type}</h4>
                  <span className="text-lg font-medium">{existingResults.name}</span>
                </div>
                <p>{existingResults.description}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={restartTest}
                  className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 py-3 rounded-lg transition-colors"
                >
                  Retake Test
                </button>
                <a
                  href={`https://www.16personalities.com/${existingResults.type.toLowerCase()}-personality`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </a>
              </div>
            </div>
            
            {/* PDF Upload Section */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">Upload Test Results (PDF)</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                If you've taken a more comprehensive personality test elsewhere, you can upload the PDF results here to enhance your digital legacy.
              </p>
              
              {pdfUrl ? (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-rose-400" />
                      <div>
                        <p className="text-white font-medium">{existingResults?.pdfName || 'Personality Test Results.pdf'}</p>
                        <p className="text-white/60 text-sm">Uploaded on {new Date(existingResults?.pdfUploadedAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                      <a 
                        href={pdfUrl} 
                        download
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? (
                      <>
                        <div className="w-5 h-5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Select PDF File
                      </>
                    )}
                  </button>
                </>
              )}
              
              {pdfUploadSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>PDF uploaded successfully!</span>
                  </div>
                </div>
              )}
              
              {pdfUploadError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{pdfUploadError}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : testCompleted ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-500/30 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">Test Completed!</h3>
                </div>
              
                {personalityType && (
                  <div className={`bg-gradient-to-r ${personalityTypes[personalityType as keyof typeof personalityTypes]?.color || 'from-blue-500 to-purple-600'} p-6 rounded-lg text-white mb-6 shadow-lg`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-full">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-3xl font-bold">{personalityType}</h4>
                      </div>
                      <span className="text-xl font-medium bg-white/10 px-4 py-2 rounded-full">{personalityTypes[personalityType as keyof typeof personalityTypes]?.name || 'Unknown'}</span>
                    </div>
                    <p className="text-white/90 text-lg leading-relaxed">{personalityTypes[personalityType as keyof typeof personalityTypes]?.description || 'No description available.'}</p>
                    
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {typeComponents.map((component, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold mb-1">{component.letter}</div>
                          <div className="text-white/80 text-sm">{component.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-3 mt-4">
                  <button
                    onClick={restartTest}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Retake Test
                  </button>
                  {personalityType && (
                    <a
                      href={`https://www.16personalities.com/${personalityType.toLowerCase()}-personality`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Learn More
                    </a>
                  )}
                </div>
              </div>
              
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 z-0"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 z-0"></div>
              
              {saveError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {saveError}
                </div>
              )}
            </div>
            
            {/* PDF Upload Section */}
            <div className="bg-white/5 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">Upload Test Results (PDF)</h3>
              </div>
              
              <p className="text-white/70 mb-4">
                If you've taken a more comprehensive personality test elsewhere, you can upload the PDF results here to enhance your digital legacy.
              </p>
              
              {pdfUrl ? (
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-rose-400" />
                      <div>
                        <p className="text-white font-medium">{existingResults?.pdfName || 'Personality Test Results.pdf'}</p>
                        <p className="text-white/60 text-sm">Uploaded on {new Date(existingResults?.pdfUploadedAt || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                      <a 
                        href={pdfUrl} 
                        download
                        className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    disabled={uploadingPdf}
                  >
                    {uploadingPdf ? (
                      <>
                        <div className="w-5 h-5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Select PDF File
                      </>
                    )}
                  </button>
                </>
              )}
              
              {pdfUploadSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>PDF uploaded successfully!</span>
                  </div>
                </div>
              )}
              
              {pdfUploadError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{pdfUploadError}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Why This Matters for Your Digital Legacy</h3>
              <p className="text-white/70 mb-4">
                Your personality type is a fundamental aspect of who you are. By preserving this information:
              </p>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Future generations can gain deeper insights into your character and decision-making style</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>AI systems can better represent your authentic self in digital interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Your loved ones can understand aspects of your personality they might not have fully appreciated</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Your digital legacy becomes more nuanced and three-dimensional</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">About This Test</h3>
              <p className="text-white/70 mb-4">
                This is a simplified version of the 16Personalities test, based on the Myers-Briggs Type Indicator (MBTI). 
                The test will help identify your personality type, which is an important aspect of your digital legacy.
              </p>
              <div className="flex justify-between items-center">
                <div className="text-white/60 text-sm">
                  Question {currentQuestionIndex + 1} of {sampleQuestions.length}
                </div>
                <a
                  href="https://www.16personalities.com/free-personality-test"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Take full test
                </a>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-6 border border-indigo-500/30">
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-white mb-2">{currentQuestion.text}</h4>
                <p className="text-white/60 text-sm">Category: {currentQuestion.category}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 1)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors text-left px-4"
                >
                  Strongly Disagree
                </button>
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 2)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors text-left px-4"
                >
                  Disagree
                </button>
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 3)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors text-left px-4"
                >
                  Neutral
                </button>
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 4)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors text-left px-4"
                >
                  Agree
                </button>
                <button
                  onClick={() => handleAnswer(currentQuestion.id, 5)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg transition-colors text-left px-4"
                >
                  Strongly Agree
                </button>
              </div>
              
              <div className="mt-4 bg-black/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60 text-sm">Progress</span>
                  <span className="text-white/60 text-sm">{Math.round(((currentQuestionIndex + 1) / sampleQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full" 
                    style={{ width: `${((currentQuestionIndex + 1) / sampleQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Why Take This Test?</h3>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Gain insights into your personality traits, strengths, and potential areas for growth</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Preserve an important aspect of your identity as part of your digital legacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                  <span>Help AI systems better understand and represent your authentic self</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

// Type components for personality type display
const typeComponents = [
  { letter: "E/I", description: "Extraversion vs. Introversion" },
  { letter: "S/N", description: "Sensing vs. Intuition" },
  { letter: "T/F", description: "Thinking vs. Feeling" },
  { letter: "J/P", description: "Judging vs. Perceiving" }
];