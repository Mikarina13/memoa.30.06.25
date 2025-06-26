import { supabase } from './supabase';
import { validatePersonalPreferences, validateMediaLinks, validateNarrativesData, validateFamilyTreeData } from './data-validation';

// Environment variables for API keys (add these to your .env file)
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const TAVUS_API_KEY = import.meta.env.VITE_TAVUS_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface MemoriaProfile {
  id: string;
  user_id: string;
  name: string;
  relationship?: string;
  description?: string;
  birth_date?: string;
  death_date?: string;
  is_celebrity?: boolean;
  is_public?: boolean;
  profile_data: Record<string, unknown>;
  elevenlabs_voice_id?: string;
  tavus_avatar_id?: string;
  integration_status: MemoirIntegrationStatus;
  created_at: string;
  updated_at: string;
}

export interface MemoirIntegrationStatus {
  elevenlabs: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    voice_cloned: boolean;
    last_updated: string | null;
  };
  tavus: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    avatar_created: boolean;
    last_updated: string | null;
  };
  gemini: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    narratives_processed: boolean;
    last_updated: string | null;
  };
  avaturn?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    avatar_created: boolean;
    last_updated: string | null;
  };
  portrait_generation?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'error';
    portraits_generated: boolean;
    last_updated: string | null;
  };
}

export interface GameEntry {
  id: string;
  name: string;
  platform: string;
  invite_link?: string;
  invite_code?: string;
  notes?: string;
  favorite: boolean;
  timestamp: string;
}

export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

interface GeneratedPortrait {
  id: string;
  name: string;
  sourceImage: string;
  generatedImages: string[];
  style: string;
  timestamp: string;
}

interface PersonalPreferences {
  favorite_songs: string[];
  favorite_locations: string[];
  favorite_movies: string[];
  favorite_books: string[];
  favorite_quotes: string[];
  favorite_foods: string[];
  favorite_signature_dishes?: string[];
  digital_presence: DigitalPresenceEntry[];
  gaming_preferences: GameEntry[];
  last_updated?: string;
}

interface MemoirData {
  narratives?: {
    personal_stories?: Array<{
      title: string;
      content: string;
      timestamp: string;
      aiEnhanced?: boolean;
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
    ai_insights?: {
      personality_traits: string[];
      core_themes: string[];
      writing_style: string;
      processed_at: string;
    };
  };
  preferences?: {
    music: {
      spotify_playlist?: string;
      youtube_playlist?: string;
      deezer_playlist?: string;
    };
    places: {
      google_maps_saved_places?: any[];
      favorite_locations?: string[];
    };
    social_media: {
      facebook_data?: any;
      instagram_data?: any;
    };
    gaming?: {
      games: GameEntry[];
      favorite_genres?: string[];
      gaming_platforms?: string[];
      total_games: number;
      last_updated: string;
    };
    personal?: PersonalPreferences;
    memoria_personal?: PersonalPreferences; // Separate storage for MEMORIA personal preferences
  };
  family_tree?: {
    files: Array<{
      name: string;
      size: number;
      type: string;
      uploadDate: string;
      url: string;
    }>;
    lastUpdated: string;
  };
  portraits?: {
    generated?: GeneratedPortrait[];
    last_updated?: string;
  };
  avaturn_avatars?: {
    avatars?: Array<{
      id: string;
      sourcePhoto: string;
      avaturnUrl: string;
      createdAt: string;
      status: string;
    }>;
    last_updated?: string;
  };
  ai_generated?: {
    additional_photos?: string[];
    generated_videos?: string[];
    synthetic_voice_samples?: string[];
  };
  media_links?: Array<{
    id: string;
    title: string;
    url: string;
    type: 'video' | 'podcast' | 'article';
    source: string;
    description?: string;
    date: string;
  }>;
  space_customization?: {
    settings?: any;
    presets?: Array<{
      id: string;
      name: string;
      settings: any;
    }>;
    last_updated?: string;
  };
  tribute_images?: Array<{
    id: string;
    url: string;
    style?: string;
    prompt?: string;
    createdAt: string;
  }>;
}

export class MemoirIntegrations {
  
  /**
   * Create a new Memoria profile
   */
  static async createMemoriaProfile(
    userId: string,
    name: string,
    relationship?: string,
    description?: string,
    birthDate?: string,
    deathDate?: string,
    isCelebrity: boolean = false
  ): Promise<MemoriaProfile> {
    try {
      console.log(`Creating Memoria profile: ${name} for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .insert([{
          user_id: userId,
          name,
          relationship,
          description,
          birth_date: birthDate,
          death_date: deathDate,
          is_celebrity: isCelebrity,
          profile_data: {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating Memoria profile:', error);
        throw error;
      }
      
      console.log('Successfully created Memoria profile:', data);
      return data;
    } catch (error) {
      console.error('Error creating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Get all Memoria profiles for a user
   */
  static async getMemoriaProfiles(userId: string): Promise<MemoriaProfile[]> {
    try {
      console.log(`Fetching Memoria profiles for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Memoria profiles:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} Memoria profiles`);
      return data || [];
    } catch (error) {
      console.error('Error fetching Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Get a specific Memoria profile
   */
  static async getMemoirProfile(userId: string, profileId?: string): Promise<any> {
    try {
      if (profileId) {
        console.log(`Fetching Memoria profile: ${profileId}`);
        
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('*')
          .eq('id', profileId)
          .single();
  
        if (error) {
          console.error('Error fetching Memoria profile:', error);
          throw error;
        }
        
        console.log('Successfully fetched Memoria profile');
        return data;
      } else {
        // Get user's profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
  
        if (error) {
          console.error(`Failed to fetch user profile ${userId}:`, error);
          throw error;
        }
        
        console.log('Successfully fetched user profile');
        return data;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Update a Memoria profile
   */
  static async updateMemoriaProfile(
    profileId: string,
    updates: Partial<MemoriaProfile>
  ): Promise<MemoriaProfile> {
    try {
      console.log(`Updating Memoria profile: ${profileId}`);
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) {
        console.error('Error updating Memoria profile:', error);
        throw error;
      }
      
      console.log('Successfully updated Memoria profile');
      return data;
    } catch (error) {
      console.error('Error updating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Delete a Memoria profile
   */
  static async deleteMemoriaProfile(profileId: string): Promise<void> {
    try {
      console.log(`Deleting Memoria profile: ${profileId}`);
      
      const { error } = await supabase
        .from('memoria_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('Error deleting Memoria profile:', error);
        throw error;
      }
      
      console.log('Successfully deleted Memoria profile');
    } catch (error) {
      console.error('Error deleting Memoria profile:', error);
      throw error;
    }
  }
  
  /**
   * Set profile visibility (public/private)
   */
  static async setProfileVisibility(userId: string, isPublic: boolean, memoriaProfileId?: string): Promise<void> {
    try {
      if (memoriaProfileId) {
        console.log(`Setting Memoria profile visibility to ${isPublic ? 'public' : 'private'}`);
        
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ is_public: isPublic })
          .eq('id', memoriaProfileId);
        
        if (error) {
          console.error('Error updating Memoria profile visibility:', error);
          throw error;
        }
        
        console.log(`Successfully set Memoria profile visibility to ${isPublic ? 'public' : 'private'}`);
      } else {
        console.log(`Setting Memoir profile visibility to ${isPublic ? 'public' : 'private'}`);
        
        const { error } = await supabase
          .from('profiles')
          .update({ is_public: isPublic })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error updating Memoir profile visibility:', error);
          throw error;
        }
        
        console.log(`Successfully set Memoir profile visibility to ${isPublic ? 'public' : 'private'}`);
      }
    } catch (error) {
      console.error('Error setting profile visibility:', error);
      throw error;
    }
  }

  /**
   * Get public Memoir profiles
   */
  static async getPublicMemoirProfiles(): Promise<any[]> {
    try {
      console.log('Fetching public Memoir profiles');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching public Memoir profiles:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} public Memoir profiles`);
      return data || [];
    } catch (error) {
      console.error('Error fetching public Memoir profiles:', error);
      throw error;
    }
  }

  /**
   * Get public Memoria profiles
   */
  static async getPublicMemoriaProfiles(): Promise<MemoriaProfile[]> {
    try {
      console.log('Fetching public Memoria profiles');
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching public Memoria profiles:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} public Memoria profiles`);
      return data || [];
    } catch (error) {
      console.error('Error fetching public Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Add profile to favorites
   */
  static async addProfileToFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<void> {
    try {
      console.log(`Adding ${profileType} profile ${profileId} to favorites for user ${userId}`);
      
      const { error } = await supabase
        .from('profile_favorites')
        .insert({
          user_id: userId,
          profile_id: profileId,
          profile_type: profileType
        });
      
      if (error) {
        console.error('Error adding profile to favorites:', error);
        throw error;
      }
      
      console.log('Successfully added profile to favorites');
    } catch (error) {
      console.error('Error adding profile to favorites:', error);
      throw error;
    }
  }

  /**
   * Remove profile from favorites
   */
  static async removeProfileFromFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<void> {
    try {
      console.log(`Removing ${profileType} profile ${profileId} from favorites for user ${userId}`);
      
      const { error } = await supabase
        .from('profile_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .eq('profile_type', profileType);
      
      if (error) {
        console.error('Error removing profile from favorites:', error);
        throw error;
      }
      
      console.log('Successfully removed profile from favorites');
    } catch (error) {
      console.error('Error removing profile from favorites:', error);
      throw error;
    }
  }

  /**
   * Get favorite profiles
   */
  static async getFavoriteProfiles(userId: string): Promise<{memoir: any[], memoria: MemoriaProfile[]}> {
    try {
      console.log(`Fetching favorite profiles for user ${userId}`);
      
      // Get favorite profile IDs
      const { data: favorites, error } = await supabase
        .from('profile_favorites')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching favorite profiles:', error);
        throw error;
      }
      
      // Group by profile type
      const memoirIds = favorites?.filter(f => f.profile_type === 'memoir').map(f => f.profile_id) || [];
      const memoriaIds = favorites?.filter(f => f.profile_type === 'memoria').map(f => f.profile_id) || [];
      
      // Fetch the actual profiles
      let memoirProfiles: any[] = [];
      if (memoirIds.length > 0) {
        const { data: memoirData, error: memoirError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', memoirIds);
        
        if (memoirError) {
          console.error('Error fetching memoir profiles:', memoirError);
        } else {
          memoirProfiles = memoirData || [];
        }
      }
        
      let memoriaProfiles: MemoriaProfile[] = [];
      if (memoriaIds.length > 0) {
        const { data: memoriaData, error: memoriaError } = await supabase
          .from('memoria_profiles')
          .select('*')
          .in('id', memoriaIds);
        
        if (memoriaError) {
          console.error('Error fetching memoria profiles:', memoriaError);
        } else {
          memoriaProfiles = memoriaData || [];
        }
      }
      
      console.log(`Fetched ${memoirProfiles.length} memoir and ${memoriaProfiles.length} memoria favorites`);
      
      return {
        memoir: memoirProfiles,
        memoria: memoriaProfiles
      };
    } catch (error) {
      console.error('Error fetching favorite profiles:', error);
      throw error;
    }
  }

  /**
   * Update user's memoir integration status
   */
  static async updateIntegrationStatus(
    userId: string, 
    integration: keyof MemoirIntegrationStatus, 
    updates: Partial<MemoirIntegrationStatus[keyof MemoirIntegrationStatus]>,
    memoriaProfileId?: string
  ) {
    try {
      console.log(`Updating integration status for ${integration}${memoriaProfileId ? ` (Memoria: ${memoriaProfileId})` : ''}`);
      
      if (memoriaProfileId) {
        // Update integration status for a Memoria profile
        const { data: profile, error: fetchError } = await supabase
          .from('memoria_profiles')
          .select('integration_status')
          .eq('id', memoriaProfileId)
          .single();

        if (fetchError) {
          console.error('Error fetching integration status for Memoria profile:', fetchError);
          throw fetchError;
        }

        const currentStatus = profile.integration_status as MemoirIntegrationStatus;
        const updatedStatus = {
          ...currentStatus,
          [integration]: {
            ...currentStatus[integration],
            ...updates,
            last_updated: new Date().toISOString()
          }
        };

        const { error } = await supabase
          .from('memoria_profiles')
          .update({ integration_status: updatedStatus })
          .eq('id', memoriaProfileId);

        if (error) {
          console.error('Error updating integration status for Memoria profile:', error);
          throw error;
        }
        
        console.log('Successfully updated integration status for Memoria profile');
        return updatedStatus;
      } else {
        // Update integration status for the user's profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('integration_status')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching integration status for user profile:', fetchError);
          throw fetchError;
        }

        const currentStatus = profile.integration_status as MemoirIntegrationStatus;
        const updatedStatus = {
          ...currentStatus,
          [integration]: {
            ...currentStatus[integration],
            ...updates,
            last_updated: new Date().toISOString()
          }
        };

        const { error } = await supabase
          .from('profiles')
          .update({ integration_status: updatedStatus })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating integration status for user profile:', error);
          throw error;
        }
        
        console.log('Successfully updated integration status for user profile');
        return updatedStatus;
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }

  /**
   * Update user's memoir data
   */
  static async updateMemoirData(userId: string, data: Partial<MemoirData>, memoriaProfileId?: string) {
    try {
      console.log(`Updating memoir data${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        // Update memoir data for a Memoria profile
        const { data: profile, error: fetchError } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .single();

        if (fetchError) {
          console.error('Error fetching profile_data for Memoria profile:', fetchError);
          throw fetchError;
        }

        const currentData = (profile.profile_data as MemoirData) || {};
        
        // Deep merge the data, especially for nested objects like preferences
        const updatedData = {
          ...currentData,
          ...data,
          preferences: {
            ...currentData.preferences,
            ...data.preferences
          }
        };

        const { error } = await supabase
          .from('memoria_profiles')
          .update({ profile_data: updatedData })
          .eq('id', memoriaProfileId);

        if (error) {
          console.error('Error updating profile_data for Memoria profile:', error);
          throw error;
        }
        
        console.log(`Successfully updated profile_data for Memoria profile ${memoriaProfileId}`);
        return updatedData;
      } else {
        // Update memoir data for the user's profile
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          console.error('Error fetching memoir_data for user profile:', fetchError);
          throw fetchError;
        }

        const currentData = (profile.memoir_data as MemoirData) || {};
        
        // Deep merge the data, especially for nested objects like preferences
        const updatedData = {
          ...currentData,
          ...data,
          preferences: {
            ...currentData.preferences,
            ...data.preferences
          }
        };

        const { error } = await supabase
          .from('profiles')
          .update({ memoir_data: updatedData })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating memoir_data for user profile:', error);
          throw error;
        }
        
        console.log(`Successfully updated memoir_data for user profile ${userId}`);
        return updatedData;
      }
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }

  /**
   * Upload a file to a specified storage bucket
   */
  static async uploadFileToStorage(userId: string, file: File, bucketName: string, memoriaProfileId?: string): Promise<string> {
    try {
      console.log(`Uploading file to ${bucketName}: ${file.name} (${file.type}), ${file.size} bytes`);
      
      let fileExt = '';
      const fileNameParts = file.name.split('.');
      if (fileNameParts.length > 1) {
        fileExt = '.' + fileNameParts.pop();
      }
      
      // Keep original filename for documents and add timestamp to prevent collisions
      const fileName = bucketName === 'documents'
        ? `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-_]/g, '_')}` // Sanitize filename
        : `${Date.now()}${fileExt}`;
      
      const filePath = memoriaProfileId 
        ? `${userId}/memoria/${memoriaProfileId}/${fileName}` 
        : `${userId}/${fileName}`;
      
      console.log(`Uploading file to ${bucketName} bucket: ${filePath}`);

      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error uploading file to ${bucketName}:`, uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      } else {
        console.log(`File uploaded successfully to ${bucketName} bucket`);
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log(`Public URL generated: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        
        // Check for specific error types
        if (error.message.includes('row-level security')) {
          console.error('RLS policy violation. Check bucket permissions.');
        } else if (error.message.includes('mime type')) {
          console.error('MIME type not allowed. Check bucket allowed_mime_types.');
        } else if (error.message.includes('size limit')) {
          console.error('File size exceeds limit. Check bucket file_size_limit.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Upload a document file (PDF, etc.) to the documents storage bucket
   */
  static async uploadDocumentFile(userId: string, file: File, memoriaProfileId?: string, customContentType?: string): Promise<string> {
    try {
      console.log(`Uploading document file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      // For PDF files, ensure the content type is set correctly
      let fileToUpload = file;
      if (file.name.toLowerCase().endsWith('.pdf') && (!file.type || file.type === '')) {
        fileToUpload = new File([file], file.name, { type: 'application/pdf' });
        console.log(`Set application/pdf content type for file: ${file.name}`);
      }
      
      // Create a new File object with explicit content type if needed
      if (customContentType && file.type === '') {
        fileToUpload = new File([file], file.name, { type: customContentType }); 
        console.log(`Set custom content type: ${customContentType} for file: ${file.name}`);
      } else if (file.name.toLowerCase().endsWith('.png') && (!file.type || file.type === '')) {
        // Force PNG mime type for files with .png extension but no mime type
        fileToUpload = new File([file], file.name, { type: 'image/png' });
        console.log(`Set image/png content type for file: ${file.name}`);
      } else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        // Force JPEG mime type for files with .jpg/.jpeg extension but no mime type
        fileToUpload = new File([file], file.name, { type: 'image/jpeg' });
        console.log(`Set image/jpeg content type for file: ${file.name}`);
      }
      
      // Upload the file directly without trying to create the bucket
      const url = await this.uploadFileToStorage(userId, fileToUpload, 'documents', memoriaProfileId); 
      console.log(`Document uploaded successfully: ${url}`);
      return url;
    } catch (error) {
      console.error(`Error uploading document file:`, error);
      throw error;
    }
  }

  /**
   * Upload a 3D model file to the models storage bucket
   */
  static async upload3DModelFile(userId: string, file: File | null, memoriaProfileId?: string, externalUrl?: string): Promise<string> {
    try {
      console.log(`Uploading 3D model${file ? ` file: ${file.name}` : ' from external URL'}`);
      
      // If an external URL is provided, return it directly
      if (externalUrl) {
        console.log('Using external URL:', externalUrl);
        return externalUrl;
      }
      
      // Otherwise upload the file to storage
      if (file) {
        const url = await this.uploadFileToStorage(userId, file, 'models', memoriaProfileId);
        console.log('3D model uploaded successfully:', url);
        return url;
      }
      
      throw new Error('Either a file or external URL must be provided');
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
      throw error;
    }
  }

  /**
   * Upload a file to the gallery storage bucket
   */
  static async uploadGalleryFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      console.log(`Uploading gallery file: ${file.name} (${file.type}), ${file.size} bytes${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      // Ensure the file has a proper content type
      let fileToUpload = file;
      if (!file.type || file.type === '') {
        // Try to determine content type from extension
        if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
          fileToUpload = new File([file], file.name, { type: 'image/jpeg' });
        } else if (file.name.toLowerCase().endsWith('.png')) {
          fileToUpload = new File([file], file.name, { type: 'image/png' });
        } else if (file.name.toLowerCase().endsWith('.gif')) {
          fileToUpload = new File([file], file.name, { type: 'image/gif' });
        } else if (file.name.toLowerCase().endsWith('.webp')) {
          fileToUpload = new File([file], file.name, { type: 'image/webp' });
        } else {
          // Default to octet-stream if can't determine
          fileToUpload = new File([file], file.name, { type: 'application/octet-stream' });
        }
        console.log(`Set content type to ${fileToUpload.type} for file: ${file.name}`);
      }
      
      // Use the uploadFileToStorage method with proper parameters
      const url = await this.uploadFileToStorage(userId, fileToUpload, 'gallery', memoriaProfileId);
      console.log('Gallery file uploaded successfully:', url);
      return url;
    } catch (error) {
      console.error('Error uploading gallery file:', error);
      throw error;
    }
  }

  /**
   * Create a gallery item record
   */
  static async createGalleryItem(itemData: any, memoriaProfileId?: string) {
    try {
      console.log(`Creating gallery item${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      console.log('Gallery item data:', itemData);
      
      // Ensure folder is set
      if (!itemData.folder) {
        itemData.folder = 'Uncategorized';
      }
      
      // If this is for a Memoria profile, add a tag to identify it
      if (memoriaProfileId) {
        itemData.tags = [...(itemData.tags || []), `memoria:${memoriaProfileId}`];
        itemData.metadata = {
          ...itemData.metadata,
          memoria_profile_id: memoriaProfileId
        };
        
        console.log(`Adding memoria:${memoriaProfileId} tag to gallery item`);
      }
      
      const { data, error } = await supabase
        .from('gallery_items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        console.error('Error creating gallery item:', error);
        throw error;
      }
      
      console.log(`Gallery item created successfully:`, data);
      return data;
    } catch (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }
  }

  /**
   * Get gallery items for a user
   */
  static async getGalleryItems(userId: string, memoriaProfileId?: string, folder?: string) {
    try {
      console.log(`Fetching gallery items for user: ${userId}, memoria profile: ${memoriaProfileId || 'none'}`);
      
      let query = supabase
        .from('gallery_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (memoriaProfileId) {
        // Get gallery items for a specific Memoria profile
        query = query.contains('tags', [`memoria:${memoriaProfileId}`]);
        console.log(`Filtering by memoria tag: memoria:${memoriaProfileId}`);
      } else {
        // Get gallery items for the user's profile (excluding Memoria items)
        query = query.not('tags', 'cs', '{memoria:}');
        console.log(`Excluding items with memoria: tags`);
      }
      
      // Filter by folder if specified
      if (folder) {
        query = query.eq('folder', folder);
        console.log(`Filtering by folder: ${folder}`);
      }
      
      // Order by creation date
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching gallery items:', error);
        throw error;
      }
      
      // Filter out tribute images at the data source level
      const filteredData = data.filter(item => {
        // Skip items without metadata
        if (!item.metadata) return true;
        
        // Check for tribute indicators in metadata
        const isTribute = 
          item.metadata.tribute === true || 
          item.metadata.isTribute === true ||
          item.metadata.type === 'tribute';
          
        // Check for tribute in tags
        const hasTributeTag = item.tags && 
          (item.tags.includes('tribute') || item.tags.includes('ai-generated'));
          
        // Check folder name
        const isTributeFolder = item.folder === 'Tribute Images';
        
        // Check title
        const hasTributeTitle = item.title && 
          item.title.toLowerCase().includes('tribute');
          
        return !(isTribute || hasTributeTag || isTributeFolder || hasTributeTitle);
      });
      
      console.log(`Filtered ${data.length - filteredData.length} tribute images from gallery items`);
      
      return filteredData;
      return data || [];
    } catch (error) {
      console.error('Error fetching gallery items:', error);
      throw error;
    }
  }

  /**
   * Get media links for a user
   */
  static async getMediaLinks(userId: string, memoriaProfileId?: string) {
    try {
      console.log(`Fetching media links${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        // Get media links for a specific Memoria profile
        const profile = await this.getMemoirProfile(userId, memoriaProfileId);
        console.log('Media links in Memoria profile:', profile?.profile_data?.media_links?.length || 0);
        return profile?.profile_data?.media_links || [];
      } else {
        // Get media links for the user's profile
        const profile = await this.getMemoirProfile(userId);
        console.log('Media links in user profile:', profile?.memoir_data?.media_links?.length || 0);
        return profile?.memoir_data?.media_links || [];
      }
    } catch (error) {
      console.error('Error fetching media links:', error);
      return [];
    }
  }

  /**
   * Store media links
   */
  static async storeMediaLinks(userId: string, mediaLinks: any[], memoriaProfileId?: string) {
    try {
      console.log(`Storing ${mediaLinks.length} media links${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      // Validate and normalize media links
      const validatedLinks = validateMediaLinks(mediaLinks);
      
      if (memoriaProfileId) {
        // Store media links for Memoria profile
        await this.updateMemoirData(userId, {
          media_links: validatedLinks
        }, memoriaProfileId);
        
        console.log('Successfully stored media links for Memoria profile');
      } else {
        // Store media links for user profile
        await this.updateMemoirData(userId, {
          media_links: validatedLinks
        });
        
        console.log('Successfully stored media links for user profile');
      }

      return validatedLinks;
    } catch (error) {
      console.error('Error storing media links:', error);
      throw error;
    }
  }

  /**
   * Delete a gallery item
   */
  static async deleteGalleryItem(itemId: string) {
    try {
      console.log(`Deleting gallery item: ${itemId}`);
      
      // First get the item to check if we need to delete the file
      const { data: item, error: fetchError } = await supabase
        .from('gallery_items')
        .select('file_path')
        .eq('id', itemId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching gallery item before deletion:', fetchError);
        throw fetchError;
      }
      
      // Delete the database record
      const { error: deleteError } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        console.error('Error deleting gallery item from database:', deleteError);
        throw deleteError;
      }
      
      console.log('Gallery item deleted successfully');
      
      // Note: We don't delete the actual file from storage to prevent
      // accidental deletion of files that might be used elsewhere
      // In a production app, you might want to implement file reference counting
      
      return true;
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  /**
   * Store personality test results
   */
  static async storePersonalityTestResults(userId: string, testResults: any, memoriaProfileId?: string) {
    try {
      console.log(`Storing personality test results${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        // Store personality test results for Memoria profile
        await this.updateMemoirData(userId, {
          personality_test: testResults
        }, memoriaProfileId);
        
        console.log('Successfully stored personality test results for Memoria profile');
      } else {
        // Store personality test results for user profile
        await this.updateMemoirData(userId, {
          personality_test: testResults
        });
        
        console.log('Successfully stored personality test results for user profile');
      }

      return testResults;
    } catch (error) {
      console.error('Error storing personality test results:', error);
      throw error;
    }
  }

  /**
   * Store personal preferences with context (memoir vs memoria)
   */
  static async storePersonalPreferences(
    userId: string, 
    preferences: PersonalPreferences,
    memoriaProfileId?: string
  ) {
    try {
      const context = memoriaProfileId ? 'Memoria' : 'MEMOIR';
      console.log(`Storing personal preferences for ${context} user:`, userId, memoriaProfileId ? `(Memoria profile: ${memoriaProfileId})` : '(MEMOIR)');
      
      // Validate and normalize the personal preferences data
      const validatedPreferences = validatePersonalPreferences(preferences);
      const personalData = {
        ...validatedPreferences,
        last_updated: new Date().toISOString()
      };

      if (memoriaProfileId) {
        // Store personal preferences for Memoria profile
        const { data: currentProfile } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .single();

        const currentProfileData = currentProfile?.profile_data || {};
        const currentPreferences = currentProfileData.preferences || {};

        const updatedProfileData = {
          ...currentProfileData,
          preferences: {
            ...currentPreferences,
            personal: personalData
          }
        };

        const { error, data } = await supabase
          .from('memoria_profiles')
          .update({ profile_data: updatedProfileData })
          .eq('id', memoriaProfileId)
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log(`Successfully stored personal preferences for Memoria profile:`, data);
        return personalData;
      } else {
        // Store personal preferences for user profile
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();

        const currentMemoirData = currentProfile?.memoir_data || {};
        const currentPreferences = currentMemoirData.preferences || {};

        const updatedMemoirData = {
          ...currentMemoirData,
          preferences: {
            ...currentPreferences,
            personal: personalData
          }
        };

        const { error, data } = await supabase
          .from('profiles')
          .update({ memoir_data: updatedMemoirData })
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log(`Successfully stored personal preferences for MEMOIR:`, data);
        return personalData;
      }
    } catch (error) {
      console.error(`Error storing personal preferences:`, error);
      throw error;
    }
  }

  /**
   * Get personal preferences with context (memoir vs memoria)
   */
  static async getPersonalPreferences(userId: string, memoriaProfileId?: string) {
    try {
      console.log(`Loading personal preferences for user:`, userId, memoriaProfileId ? `(Memoria profile: ${memoriaProfileId})` : '(MEMOIR)');
      
      if (memoriaProfileId) {
        // Get personal preferences for Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .single();

        if (error) {
          console.error('Error fetching Memoria profile preferences:', error);
          throw error;
        }

        const personalData = data?.profile_data?.preferences?.personal || null;
        
        console.log(`Loaded Memoria profile preferences:`, personalData);
        return personalData;
      } else {
        // Get personal preferences for user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching preferences:', error);
          throw error;
        }

        const personalData = data?.memoir_data?.preferences?.personal || null;
        
        console.log(`Loaded MEMOIR preferences:`, personalData);
        return personalData;
      }
      
    } catch (error) {
      console.error(`Error fetching personal preferences:`, error);
      throw error;
    }
  }

  /**
   * Store gaming preferences
   */
  static async storeGamingPreferences(userId: string, games: GameEntry[], memoriaProfileId?: string) {
    try {
      console.log(`Storing gaming preferences${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      const gamingData = {
        games: games,
        favorite_genres: [...new Set(games.filter(g => g.favorite).map(g => g.platform))],
        gaming_platforms: [...new Set(games.map(g => g.platform))],
        total_games: games.length,
        last_updated: new Date().toISOString()
      };

      if (memoriaProfileId) {
        // Update memoir data with gaming preferences for Memoria profile
        await this.updateMemoirData(userId, {
          preferences: {
            gaming: gamingData
          }
        }, memoriaProfileId);
        
        console.log('Successfully stored gaming preferences for Memoria profile');
      } else {
        // Update memoir data with gaming preferences for user profile
        await this.updateMemoirData(userId, {
          preferences: {
            gaming: gamingData
          }
        });
        
        console.log('Successfully stored gaming preferences for user profile');
      }

      return gamingData;
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Get gaming preferences for a user
   */
  static async getGamingPreferences(userId: string, memoriaProfileId?: string) {
    try {
      console.log(`Getting gaming preferences${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        const profile = await this.getMemoirProfile(userId, memoriaProfileId);
        return profile?.profile_data?.preferences?.gaming || null;
      } else {
        const profile = await this.getMemoirProfile(userId);
        return profile?.memoir_data?.preferences?.gaming || null;
      }
    } catch (error) {
      console.error('Error fetching gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Store ElevenLabs voice ID with enhanced error handling
   */
  static async storeElevenLabsVoiceId(userId: string, voiceId: string, memoriaProfileId?: string) {
    try {
      console.log('Storing ElevenLabs voice ID:', { userId, voiceId, memoriaProfileId });

      // Validate voice ID format
      if (!voiceId || typeof voiceId !== 'string' || voiceId.length < 10) {
        throw new Error('Invalid voice ID format');
      }

      if (memoriaProfileId) {
        // Update integration status for Memoria profile
        await this.updateIntegrationStatus(userId, 'elevenlabs', {
          status: 'completed',
          voice_cloned: true
        }, memoriaProfileId);

        // Store the voice ID in the Memoria profile
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ 
            elevenlabs_voice_id: voiceId.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId);

        if (error) {
          console.error('Database error storing voice ID for Memoria profile:', error);
          throw error;
        }
        
        console.log('Successfully stored ElevenLabs voice ID for Memoria profile');
      } else {
        // Update integration status for user profile
        await this.updateIntegrationStatus(userId, 'elevenlabs', {
          status: 'completed',
          voice_cloned: true
        });

        // Store the voice ID in the user profile
        const { error } = await supabase
          .from('profiles')
          .update({ 
            elevenlabs_voice_id: voiceId.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Database error storing voice ID:', error);
          throw error;
        }
        
        console.log('Successfully stored ElevenLabs voice ID for user profile');
      }

      return voiceId;
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      
      if (memoriaProfileId) {
        // Update integration status to error for Memoria profile
        try {
          await this.updateIntegrationStatus(userId, 'elevenlabs', {
            status: 'error',
            voice_cloned: false
          }, memoriaProfileId);
        } catch (statusError) {
          console.error('Error updating Memoria profile integration status to error:', statusError);
        }
      } else {
        // Update integration status to error for user profile
        try {
          await this.updateIntegrationStatus(userId, 'elevenlabs', {
            status: 'error',
            voice_cloned: false
          });
        } catch (statusError) {
          console.error('Error updating integration status to error:', statusError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Store Tavus avatar ID
   */
  static async storeTavusAvatarId(userId: string, avatarId: string, memoriaProfileId?: string) {
    try {
      console.log(`Storing Tavus avatar ID: ${avatarId}${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        // Update integration status for Memoria profile
        await this.updateIntegrationStatus(userId, 'tavus', {
          status: 'completed',
          avatar_created: true
        }, memoriaProfileId);

        // Store the avatar ID in the Memoria profile
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ tavus_avatar_id: avatarId })
          .eq('id', memoriaProfileId);

        if (error) {
          console.error('Error storing Tavus avatar ID for Memoria profile:', error);
          throw error;
        }
        
        console.log('Successfully stored Tavus avatar ID for Memoria profile');
      } else {
        // Update integration status for user profile
        await this.updateIntegrationStatus(userId, 'tavus', {
          status: 'completed',
          avatar_created: true
        });

        // Store the avatar ID in the user profile
        const { error } = await supabase
          .from('profiles')
          .update({ tavus_avatar_id: avatarId })
          .eq('user_id', userId);

        if (error) {
          console.error('Error storing Tavus avatar ID for user profile:', error);
          throw error;
        }
        
        console.log('Successfully stored Tavus avatar ID for user profile');
      }
      
      return avatarId;
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }

  /**
   * Store family tree data
   */
  static async storeFamilyTreeData(userId: string, treeData: any, memoriaProfileId?: string) {
    try {
      console.log(`Storing family tree data${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      // Validate and normalize family tree data
      const validatedTreeData = validateFamilyTreeData(treeData);
      
      if (memoriaProfileId) {
        // Store family tree data for Memoria profile
        await this.updateMemoirData(userId, {
          family_tree: validatedTreeData
        }, memoriaProfileId);
        
        console.log('Successfully stored family tree data for Memoria profile');
      } else {
        // Store family tree data for user profile
        await this.updateMemoirData(userId, {
          family_tree: validatedTreeData
        });
        
        console.log('Successfully stored family tree data for user profile');
      }

      return validatedTreeData;
    } catch (error) {
      console.error('Error storing family tree data:', error);
      throw error;
    }
  }

  /**
   * Get family tree data
   */
  static async getFamilyTreeData(userId: string, memoriaProfileId?: string) {
    try {
      console.log(`Getting family tree data${memoriaProfileId ? ` for Memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        const profile = await this.getMemoirProfile(userId, memoriaProfileId);
        return profile?.profile_data?.family_tree || null;
      } else {
        const profile = await this.getMemoirProfile(userId);
        return profile?.memoir_data?.family_tree || null;
      }
    } catch (error) {
      console.error('Error fetching family tree data:', error);
      throw error;
    }
  }

  /**
   * Determine MIME type from file extension
   */
  static getMimeTypeFromFile(file: File): string {
    // First check if the file already has a valid type
    if (file.type && file.type !== 'application/octet-stream') {
      return file.type;
    }
    
    // If not, try to determine from extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      // Images
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
        
      // Documents
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'rtf':
        return 'application/rtf';
        
      // 3D Models
      case 'glb':
        return 'model/gltf-binary';
      case 'gltf':
        return 'model/gltf+json';
        
      // Audio
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
        
      // Video
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
        
      // Default
      default:
        return 'application/octet-stream';
    }
  }
  
  /**
   * Recover data for a specific path within memoir_data or profile_data
   * This is a utility method to help recover data when the main methods fail
   */
  static async recoverData(userId: string, dataPath: string, memoriaProfileId?: string): Promise<any> {
    try {
      console.log(`Attempting to recover data for path: ${dataPath}${memoriaProfileId ? `, memoria profile: ${memoriaProfileId}` : ''}`);
      
      if (memoriaProfileId) {
        // Get the full profile_data for the Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .single();
        
        if (error) {
          console.error('Error recovering data for Memoria profile:', error);
          return null;
        }
        
        // Extract the requested data using the path
        const pathParts = dataPath.split('.');
        let result = data.profile_data;
        
        for (const part of pathParts) {
          if (result && result[part] !== undefined) {
            result = result[part];
          } else {
            console.log(`Path ${dataPath} not found in profile_data`);
            return null;
          }
        }
        
        console.log(`Successfully recovered data for path: ${dataPath}`);
        return result;
      } else {
        // Get the full memoir_data for the user
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error('Error recovering data for user profile:', error);
          return null;
        }
        
        // Extract the requested data using the path
        const pathParts = dataPath.split('.');
        let result = data.memoir_data;
        
        for (const part of pathParts) {
          if (result && result[part] !== undefined) {
            result = result[part];
          } else {
            console.log(`Path ${dataPath} not found in memoir_data`);
            return null;
          }
        }
        
        console.log(`Successfully recovered data for path: ${dataPath}`);
        return result;
      }
    } catch (error) {
      console.error(`Error recovering data:`, error);
      return null;
    }
  }

  /**
   * Check if API keys are configured
   */
  static checkAPIKeys() {
    return {
      elevenlabs: !!ELEVENLABS_API_KEY,
      tavus: !!TAVUS_API_KEY,
      gemini: !!GEMINI_API_KEY
    };
  }

  /**
   * Get API configuration status
   */
  static getAPIStatus() {
    const keys = this.checkAPIKeys();
    return {
      elevenlabs: {
        configured: keys.elevenlabs,
        url: 'https://elevenlabs.io/app/subscription?ref=memoa&code=WORLDSLARGESTHACKATHON-0bb0fa21'
      },
      tavus: {
        configured: keys.tavus,
        url: 'https://tavus.io/?ref=memoa'
      },
      gemini: {
        configured: keys.gemini,
        url: 'https://makersuite.google.com/app/apikey'
      }
    };
  }
}