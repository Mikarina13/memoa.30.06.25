import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Image as ImageIcon, Video, Upload, Play, Pause, Trash2, Download, Eye, X, Filter, AlertCircle, Save } from 'lucide-react';
import { MemoirIntegrations } from '../lib/memoir-integrations';
import { useAuth } from '../hooks/useAuth';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_url?: string;
  metadata: any;
  tags: string[];
  created_at: string;
  sort_order: number;
}

interface GalleryInterfaceProps {
  onGallerySaved?: (galleryData: any) => void;
  onClose?: () => void;
  context?: 'memoir' | 'memoria';
  memoriaProfileId?: string;
  initialData?: GalleryItem[];
}

export function GalleryInterface({ onGallerySaved, onClose, context = 'memoir', memoriaProfileId, initialData }: GalleryInterfaceProps) {
  const { user } = useAuth();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initialData || []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasReordered, setHasReordered] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    if (user) {
      if (!initialData) {
        loadGalleryItems();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, initialData]);

  const loadGalleryItems = async () => {
    try {
      setIsLoading(true);
      console.log(`Loading gallery items for ${memoriaProfileId ? 'Memoria' : 'Memoir'} profile...`);
      let items = await MemoirIntegrations.getGalleryItems(user.id, memoriaProfileId);
      setGalleryItems(items || []);
      console.log(`Loaded ${items?.length || 0} gallery items`);
    } catch (error) {
      console.error('Error loading gallery items:', error);
      setUploadError('Failed to load gallery items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      return isImage || isVideo;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only images and videos are supported.');
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      setActiveTab('upload');
    }
    event.target.value = '';
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      console.log(`Starting upload of ${selectedFiles.length} files for ${memoriaProfileId ? 'Memoria' : 'Memoir'} profile`);
      const uploadedItems: GalleryItem[] = [];

      for (const file of selectedFiles) {
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        console.log(`Uploading ${mediaType} file: ${file.name}`);
        
        // Upload file to storage
        const filePath = await MemoirIntegrations.uploadGalleryFile(user.id, file, memoriaProfileId);
        
        // Create gallery item record with the memoriaProfileId if applicable
        const galleryItem = await MemoirIntegrations.createGalleryItem({
          user_id: user.id,
          title: file.name.split('.')[0],
          media_type: mediaType,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            memoriaProfileId: memoriaProfileId || null
          },
          tags: memoriaProfileId ? [`memoria:${memoriaProfileId}`] : []
        }, memoriaProfileId);

        uploadedItems.push(galleryItem);
        console.log(`Successfully uploaded and created gallery item: ${galleryItem.id}`);
      }

      setGalleryItems(prev => [...uploadedItems, ...prev]);
      setSelectedFiles([]);
      setUploadStatus('success');
      setActiveTab('gallery');
      
      if (onGallerySaved) {
        console.log('Calling onGallerySaved with uploaded items');
        onGallerySaved(uploadedItems);
      }

      // Auto-reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await MemoirIntegrations.deleteGalleryItem(itemId);
      setGalleryItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting gallery item:', error);
    }
  };

  const handleViewItem = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowViewer(true);
  };

  const playVideo = (itemId: string) => {
    // Stop any currently playing video
    Object.values(videoRefs.current).forEach(video => video.pause());
    
    if (currentlyPlaying === itemId) {
      setCurrentlyPlaying(null);
      return;
    }

    const video = videoRefs.current[itemId];
    if (video) {
      video.play();
      setCurrentlyPlaying(itemId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleReorderEnd = () => {
    setHasReordered(true);
  };
  
  const saveNewOrder = async () => {
    if (!hasReordered) return;
    
    try {
      setIsLoading(true);
      
      // Create an array of items with their new sort order
      // We'll use their index * 100 to leave space between items for future ordering
      const updatedItems = galleryItems.map((item, index) => ({
        id: item.id,
        sort_order: index * 100
      }));
      
      // Update the items in the database
      await MemoirIntegrations.updateGalleryItemsOrder(updatedItems);
      
      // Update local state
      setGalleryItems(prev => prev.map((item, index) => ({
        ...item,
        sort_order: index * 100
      })));
      
      setHasReordered(false);
    } catch (error) {
      console.error('Error saving new order:', error);
      alert('Failed to save new order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const contextTitle = context === 'memoria' ? 'Memories Gallery' : 'Personal Gallery';
  const contextDescription = context === 'memoria' 
    ? 'Preserve and organize photos and videos of your loved one.'
    : 'Upload and organize photos and videos as part of your digital legacy.';

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
            <ImageIcon className="w-8 h-8 text-blue-400" />
            <h2 className="text-2xl font-bold text-white font-[Orbitron]">{contextTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        <p className="text-white/70 mb-6 text-center">{contextDescription}</p>

        {/* Tab Navigation */}
        <div className="flex rounded-lg overflow-hidden mb-6">
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'upload' ? 'bg-blue-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Media
          </button>
          <button
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'gallery' ? 'bg-blue-500 text-white' : 'bg-black/50 text-white/60 hover:text-white'}`}
            onClick={() => setActiveTab('gallery')}
          >
            Gallery ({galleryItems.length})
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* File Upload */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Upload Photos & Videos</h3>
                
                <div 
                  className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFiles.length > 0 ? (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-white/40 mx-auto" />
                      <div>
                        <p className="text-white text-lg mb-2">{selectedFiles.length} files selected</p>
                        <p className="text-white/60 text-sm">Click to add more files</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-white/40 mx-auto" />
                      <div>
                        <p className="text-white text-lg mb-2">Upload your media files</p>
                        <p className="text-white/60 text-sm">Click here or drag and drop images and videos</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFiles.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-white font-medium mb-3">Selected Files ({selectedFiles.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3">
                          <div className="w-full h-20 bg-white/10 rounded mb-2 flex items-center justify-center">
                            {file.type.startsWith('image/') && <ImageIcon className="w-8 h-8 text-white/60" />}
                            {file.type.startsWith('video/') && <Video className="w-8 h-8 text-white/60" />}
                          </div>
                          <h4 className="text-white text-sm font-medium truncate">{file.name}</h4>
                          <p className="text-white/60 text-xs">{formatFileSize(file.size)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleUpload}
                      disabled={uploadStatus === 'uploading'}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {uploadStatus === 'uploading' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Files
                        </>
                      )}
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Upload Error</p>
                      <p>{uploadError}</p>
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm">
                    Files uploaded successfully!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-white/70">Loading gallery items...</p>
                </div>
              ) : galleryItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Gallery Items</h3>
                    
                    {hasReordered && (
                      <button
                        onClick={saveNewOrder}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        Save Order
                      </button>
                    )}
                  </div>
                
                  <div className="space-y-2 bg-black/20 rounded-lg p-4">
                    <p className="text-white/70 text-sm mb-4">
                      Drag and drop items to reorder them. Click an item to view it.
                    </p>
                    
                    <Reorder.Group 
                      axis="y" 
                      values={galleryItems} 
                      onReorder={setGalleryItems}
                      className="space-y-2"
                      onDragEnd={handleReorderEnd}
                    >
                      {galleryItems.map((item) => (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden cursor-move"
                        >
                          <div className="flex items-center p-3">
                            <div className="flex-shrink-0 w-20 h-20 bg-black/40 mr-4 rounded overflow-hidden">
                              {item.media_type === 'image' ? (
                                <img 
                                  src={item.file_path} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <video
                                    ref={el => { if (el) videoRefs.current[item.id] = el; }}
                                    src={item.file_path}
                                    className="w-full h-full object-cover"
                                    onEnded={() => setCurrentlyPlaying(null)}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playVideo(item.id);
                                    }}
                                    className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                                  >
                                    {currentlyPlaying === item.id ? (
                                      <Pause className="w-8 h-8 text-white" />
                                    ) : (
                                      <Play className="w-8 h-8 text-white" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white truncate">{item.title}</h4>
                              <p className="text-white/60 text-xs">
                                {formatFileSize(item.file_size)} • {item.media_type}
                              </p>
                              <p className="text-white/50 text-xs">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewItem(item);
                                }}
                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                              >
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.id);
                                }}
                                className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">No Media Yet</h4>
                  <p className="text-white/60 mb-6">Upload your first photos and videos to get started.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Upload Media
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Viewer Modal */}
      <AnimatePresence>
        {showViewer && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-80 p-4"
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setShowViewer(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {selectedItem.media_type === 'image' ? (
                <img 
                  src={selectedItem.file_path} 
                  alt={selectedItem.title}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.file_path}
                  controls
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}
              
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedItem.title}</h3>
                <p className="text-white/60">{formatFileSize(selectedItem.file_size)} • {selectedItem.mime_type}</p>
                <div className="mt-2 flex items-center justify-center">
                  <a 
                    href={selectedItem.file_path} 
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors mt-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}