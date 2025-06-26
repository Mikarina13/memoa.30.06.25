import { useState } from 'react';
import { Users, FileText, ExternalLink, Download, Image as ImageIcon, FileVideo, File as FilePdf, File, RefreshCw, Eye } from 'lucide-react';

interface FamilyTreeDetailProps {
  data: {
    files: Array<{
      name: string;
      size: number;
      type: string;
      uploadDate: string;
      url: string;
    }>;
    lastUpdated: string;
  };
}

export function FamilyTreeDetail({ data }: FamilyTreeDetailProps) {
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const getFileIcon = (fileType: string) => {
    // This would ideally use specific icons for each file type
    if (fileType.includes('image') || fileType.endsWith('.jpg') || fileType.endsWith('.png') || fileType.endsWith('.jpeg')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />;
    } else if (fileType.includes('video') || fileType.endsWith('.mp4') || fileType.endsWith('.mov')) {
      return <FileVideo className="w-5 h-5 text-purple-400" />;
    } else if (fileType.includes('pdf') || fileType.endsWith('.pdf')) {
      return <FilePdf className="w-5 h-5 text-red-400" />;
    } else {
      return <FileText className="w-5 h-5 text-green-400" />;
    }
  };
  
  const canPreview = (file: any): boolean => {
    // Check if the file can be previewed
    return (
      file.type.includes('image') ||
      file.name.endsWith('.jpg') || 
      file.name.endsWith('.jpeg') ||
      file.name.endsWith('.png') || 
      file.name.endsWith('.gif') ||
      file.type.includes('pdf') ||
      file.name.endsWith('.pdf')
    );
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsImageLoading(false);
    setImageError(false);
  };
  
  const handleImageLoadStart = () => {
    setIsImageLoading(true);
    setImageLoaded(false);
    setImageError(false);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent">Family Tree</h2>

      <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg p-6 border border-green-500/30 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Family Files</h3>
          </div>
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
            {data.files.length} {data.files.length === 1 ? 'file' : 'files'}
          </span>
        </div>
        
        <p className="text-white/70 mb-4">
          These files contain important family documents, photos, and genealogical information. Preserve your family history for future generations.
        </p>
        
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>Last updated: {new Date(data.lastUpdated).toLocaleDateString()}</span>
          <span>{data.files.length} files</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {data.files.map((file, index) => (
          <div 
            key={`file-${index}`} 
            className={`bg-white/5 rounded-lg p-4 cursor-pointer transition-all ${
              selectedFile === file ? 'ring-2 ring-green-400' : 'hover:bg-white/10'
            }`}
            onClick={() => setSelectedFile(selectedFile === file ? null : file)}
          >
            <div className="flex items-center gap-3 mb-2">
              {getFileIcon(file.type)}
              <h4 className="font-medium text-white truncate">{file.name}</h4>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">
                {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
              </span>
              
              <div className="flex items-center gap-2">
                {canPreview(file) && (
                  <button 
                    className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(file);
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <a 
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* File Preview */}
      {selectedFile && canPreview(selectedFile) && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/20 mb-6 relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{selectedFile.name}</h3>
            <a 
              href={selectedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>
          
          <div className="bg-black/30 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center">
            {selectedFile.type.includes('image') || 
             selectedFile.name.endsWith('.jpg') || 
             selectedFile.name.endsWith('.jpeg') || 
             selectedFile.name.endsWith('.png') || 
             selectedFile.name.endsWith('.gif') ? (
              <>
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.name} 
                  className={`w-full h-auto max-h-[500px] object-contain mx-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoadStart={handleImageLoadStart}
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    console.error('Image failed to load:', selectedFile?.name);
                    setImageError(true);
                    setImageLoaded(false);
                  }}
                  style={{ display: imageError ? 'none' : 'block' }}
                />
                
                {/* Loading state */}
                {isImageLoading && !imageError && (
                  <div className="flex flex-col items-center justify-center p-8">
                    <RefreshCw className="w-8 h-8 text-white/40 animate-spin mb-2" />
                    <p className="text-white/60">Loading image...</p>
                  </div>
                )}
                
                {/* Error state */}
                {imageError && (
                  <div className="flex flex-col items-center justify-center p-8">
                    <ImageIcon className="w-16 h-16 text-red-400/50 mb-2" />
                    <p className="text-white/60 mb-2">Failed to load image</p>
                    <a 
                      href={selectedFile.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Open Image in New Tab
                    </a>
                  </div>
                )}
              </>
            ) : selectedFile.type.includes('pdf') || selectedFile.name.endsWith('.pdf') ? (
              <div className="flex flex-col items-center justify-center py-8 bg-black/50">
                <FilePdf className="w-16 h-16 text-red-400 mb-4" />
                <p className="text-white text-center">PDF Document</p>
                <a
                  href={selectedFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors inline-flex items-center gap-2 text-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-black/50">
                <File className="w-16 h-16 text-green-400 mb-4" />
                <p className="text-white text-center">{selectedFile.name}</p>
                <p className="text-white/60 text-sm">File preview not available</p>
                <a 
                  href={selectedFile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 px-6 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors inline-flex items-center gap-2 text-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* MyHeritage Link */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mt-4">
        <h3 className="text-lg font-semibold text-white mb-4">Preserve Your Family History</h3>
        
        <p className="text-white/70 mb-4">
          Your family documents and photos are preserved here for future generations. For genealogy files, 
          you can use specialized software like MyHeritage Family Tree Builder to explore your ancestry in detail.
        </p>
        
        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg mb-4">
          <p className="text-white/80 flex items-start gap-2">
            <span className="text-green-400 font-bold mt-0.5">Tip:</span>
            <span>If an image doesn't display correctly, try clicking the download button or opening it in a new tab.</span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://www.myheritage.com/family-tree-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            MyHeritage
          </a>
        </div>
      </div>
      
      {/* No files message */}
      {data.files.length === 0 && (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Users className="w-16 h-16 text-green-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Family Files</h3>
          <p className="text-white/60 mb-6">No family documents or photos have been uploaded yet.</p>
        </div>
      )}
    </div>
  );
}