import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Upload, 
  FileText, 
  ExternalLink, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { MemoirIntegrations } from '../lib/memoir-integrations';

interface FamilyTreeInterfaceProps {
  memoriaProfileId?: string;
  onFamilyTreeSaved?: (data: any) => void;
  onClose?: () => void;
}

interface FamilyTreeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadDate: Date;
}

export function FamilyTreeInterface({ memoriaProfileId, onFamilyTreeSaved, onClose }: FamilyTreeInterfaceProps) {
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<FamilyTreeFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only process the first file
    
    // Create a URL for the file
    const url = URL.createObjectURL(file);
    
    console.log(`File selected: ${file.name}, type: ${file.type}, size: ${formatFileSize(file.size)}`);
    
    // Add to uploaded files
    const newFile: FamilyTreeFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || MemoirIntegrations.getMimeTypeFromFile(file),
      url,
      uploadDate: new Date()
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    event.target.value = '';
    
    // Upload the file
    handleUpload(file, newFile);
  };

  const handleUpload = async (file: File, fileInfo: FamilyTreeFile) => {
    if (!user) return;
    
    console.log('Uploading file:', file.name, file.type, file.size);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false); 
    
    console.log(`Starting upload for file: ${file.name}, type: ${file.type}, size: ${formatFileSize(file.size)}`);
    
    try {
      // Upload the file directly using MemoirIntegrations
      const fileUrl = await MemoirIntegrations.uploadDocumentFile(user.id, file, memoriaProfileId);
      
      console.log('File uploaded successfully:', fileUrl);
      
      // Update the file info with the actual URL
      fileInfo.url = fileUrl;
      
      // Store the family tree data in the user's profile
      const familyTreeData = {
        files: [...(uploadedFiles || []), fileInfo].map(f => ({
          name: f.name,
          size: f.size,
          type: f.type, 
          uploadDate: f.uploadDate.toISOString(),
          url: f.url // Include the actual file URL
        })),
        lastUpdated: new Date().toISOString()
      };
      
      if (memoriaProfileId) {
        // Store in Memoria profile
        console.log(`Storing family tree data for Memoria profile: ${memoriaProfileId}`);
        await MemoirIntegrations.updateMemoirData(user.id, {
          family_tree: familyTreeData
        }, memoriaProfileId);
      } else {
        // Store in user profile
        console.log(`Storing family tree data for user profile: ${user.id}`);
        await MemoirIntegrations.updateMemoirData(user.id, {
          family_tree: familyTreeData
        });
      }
      
      setUploadSuccess(true);
      onFamilyTreeSaved?.(familyTreeData);
      
      console.log(`File uploaded successfully: ${fileUrl}`);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error uploading family tree:', error);
      setUploadError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error details:', error.stack);
        
        // Check for specific error types
        if (error.message.includes('row-level security')) {
          console.error('RLS policy violation. Check bucket permissions.');
        } else if (error.message.includes('mime type')) {
          console.error('MIME type not allowed. Check bucket allowed_mime_types.');
        } else if (error.message.includes('size limit')) {
          console.error('File size exceeds limit. Check bucket file_size_limit.');
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const deleteFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openMyHeritage = () => {
    window.open('https://www.myheritage.com/family-tree-builder', '_blank');
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
            <Users className="w-8 h-8 text-green-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">
              {memoriaProfileId ? "Family Tree - Memoria" : "Family Tree - Personal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Family Tree File</h3>
            
            <div 
              className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Upload your files</p>
              <p className="text-white/60 text-sm">Click here or drag and drop any file type</p>
              <p className="text-white/40 text-xs mt-2">Supported formats: Images (PNG, JPG), PDF, Word, Excel, and more</p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>File uploaded successfully!</span>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Uploaded Files</h3>
              
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-white/60 text-sm">
                          {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-2 text-white/60 hover:text-white transition-colors" 
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MyHeritage Integration */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Preserve Your Family History</h3>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            
            <p className="text-white/70 mb-4">
              Upload and preserve important family documents, photos, videos, and genealogy files. Create a comprehensive archive of your family history for future generations.
            </p>

            <div className="flex items-center gap-4">
              <a
                onClick={openMyHeritage}
                href="https://www.myheritage.com/family-tree-builder" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Explore MyHeritage
              </a>
            </div>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <h4 className="text-green-400 font-medium mb-2">Preservation Features:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Upload images, documents, and family tree files</li>
                <li>• Preserve important family records and memories</li>
                <li>• Create a digital archive for future generations</li>
                <li>• Share your family legacy with loved ones</li> 
                <li className="text-green-400 font-medium mt-2">• Images and documents can be viewed directly in the 3D space</li>
                <li className="text-green-400 font-medium">• Click the <ExternalLink className="w-3 h-3 inline mx-1" /> icon to open files in a new tab</li>
              </ul>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Why Preserve Your Family Tree?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <h4 className="font-medium text-white">Connect Generations</h4>
                </div>
                <p className="text-white/70 text-sm">
                  {memoriaProfileId 
                    ? "Place your loved one in the context of your family's larger story and history."
                    : "Help future generations understand their place in your family's larger story and history."}
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-white">Preserve Heritage</h4>
                </div>
                <p className="text-white/70 text-sm">
                  Document family connections, cultural backgrounds, and ancestral origins before they're lost to time.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">Medical History</h4>
                </div>
                <p className="text-white/70 text-sm">
                  Provide valuable health information by documenting family medical history across generations.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-5 h-5 text-amber-400" />
                  <h4 className="font-medium text-white">Find Relatives</h4>
                </div>
                <p className="text-white/70 text-sm">
                  Connect with distant relatives and expand your family network through shared ancestry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}