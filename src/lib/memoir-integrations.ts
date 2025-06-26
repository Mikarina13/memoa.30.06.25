import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { 
  validateNarrativesData, 
  validatePersonalPreferences,
  validateFamilyTreeData,
  validateMediaLinks,
  validateMemoirData,
  validatePortraitsData,
  validateAvaturnAvatarsData,
  validatePersonalityTestData,
  validateIntegrationStatus,
  validateSpaceCustomizationData,
  validateTributeImagesData
} from './data-validation';

// Define interfaces for various data types
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
  profile_data?: Record<string, any>;
  elevenlabs_voice_id?: string;
  tavus_avatar_id?: string;
  integration_status?: MemoirIntegrationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface GameEntry {
  id: string;
  name: string;
  platform: string;
  invite_link: string;
  invite_code: string;
  notes: string;
  favorite: boolean;
  timestamp: string;
}

export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

interface IntegrationStatusEntry {
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  last_updated: string | null;
  [key: string]: any;
}

export interface MemoirIntegrationStatus {
  elevenlabs: IntegrationStatusEntry & { voice_cloned: boolean };
  tavus: IntegrationStatusEntry & { avatar_created: boolean };
  gemini: IntegrationStatusEntry & { narratives_processed: boolean };
  avaturn?: IntegrationStatusEntry & { avatar_created: boolean };
  portrait_generation?: IntegrationStatusEntry & { portraits_generated: boolean };
}

export interface GalleryItemCreate {
  user_id: string;
  title: string;
  media_type: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  folder?: string;
  thumbnail_url?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  sort_order?: number;
}

export class MemoirIntegrations {
  /**
   * Get a user's MEMOIR profile
   */
  static async getMemoirProfile(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get a specific MEMORIA profile
        const { data: memoriaProfile, error } = await supabase
          .from('memoria_profiles')
          .select('*')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return memoriaProfile;
      } else {
        // Get the user's MEMOIR profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return profile;
      }
    } catch (error) {
      console.error('Error getting memoir profile:', error);
      throw error;
    }
  }

  /**
   * Get a list of Memoria profiles belonging to a user
   */
  static async getMemoriaProfiles(userId: string): Promise<MemoriaProfile[]> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting memoria profiles:', error);
      throw error;
    }
  }

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
      const { data, error } = await supabase
        .from('memoria_profiles')
        .insert({
          user_id: userId,
          name,
          relationship,
          description,
          birth_date: birthDate,
          death_date: deathDate,
          is_celebrity: isCelebrity,
          profile_data: {},
          integration_status: {
            elevenlabs: {
              status: 'not_started',
              voice_cloned: false,
              last_updated: null
            },
            tavus: {
              status: 'not_started',
              avatar_created: false,
              last_updated: null
            },
            gemini: {
              status: 'not_started',
              narratives_processed: false,
              last_updated: null
            },
            avaturn: {
              status: 'not_started',
              avatar_created: false,
              last_updated: null
            },
            portrait_generation: {
              status: 'not_started',
              portraits_generated: false,
              last_updated: null
            }
          }
        })
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating memoria profile:', error);
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
      const { data, error } = await supabase
        .from('memoria_profiles')
        .update(updates)
        .eq('id', profileId)
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating memoria profile:', error);
      throw error;
    }
  }

  /**
   * Delete a Memoria profile
   */
  static async deleteMemoriaProfile(profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memoria_profiles')
        .delete()
        .eq('id', profileId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting memoria profile:', error);
      throw error;
    }
  }

  /**
   * Update the memoir data for a user
   */
  static async updateMemoirData(userId: string, data: Record<string, any>, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate the data
      const validatedData = validateMemoirData(data);
      
      if (memoriaProfileId) {
        // Update a specific MEMORIA profile
        const { data: profile, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          profile_data: {
            ...profile.profile_data,
            ...validatedData
          }
        };
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('memoria_profiles')
          .update(updatedData)
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return updatedProfile;
      } else {
        // Update the user's MEMOIR profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          memoir_data: {
            ...profile.memoir_data,
            ...validatedData
          }
        };
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updatedData)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return updatedProfile;
      }
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }

  /**
   * Store personal preferences
   */
  static async storePersonalPreferences(userId: string, preferences: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate the preferences data
      const validatedPreferences = validatePersonalPreferences(preferences);
      
      // Get the right path for storing preferences
      const path = memoriaProfileId 
        ? 'profile_data.preferences.personal' 
        : 'memoir_data.preferences.personal';
      
      const dataToUpdate = memoriaProfileId
        ? { profile_data: { preferences: { personal: validatedPreferences } } }
        : { memoir_data: { preferences: { personal: validatedPreferences } } };
      
      if (memoriaProfileId) {
        // Update a MEMORIA profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update(dataToUpdate)
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return validatedPreferences;
      } else {
        // Update a MEMOIR profile
        const { data, error } = await supabase
          .from('profiles')
          .update(dataToUpdate)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return validatedPreferences;
      }
    } catch (error) {
      console.error('Error storing personal preferences:', error);
      throw error;
    }
  }

  /**
   * Get a user's personal preferences
   */
  static async getPersonalPreferences(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get from MEMORIA profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return data?.profile_data?.preferences?.personal || null;
      } else {
        // Get from MEMOIR profile
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return data?.memoir_data?.preferences?.personal || null;
      }
    } catch (error) {
      console.error('Error getting personal preferences:', error);
      throw error;
    }
  }

  /**
   * Store gaming preferences
   */
  static async storeGamingPreferences(userId: string, games: GameEntry[], memoriaProfileId?: string): Promise<any> {
    try {
      // Create preferences object with gaming data
      const preferences = {
        gaming_preferences: games,
        last_updated: new Date().toISOString()
      };
      
      // Use the personal preferences storage function
      return await this.storePersonalPreferences(userId, preferences, memoriaProfileId);
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Get a user's gaming preferences
   */
  static async getGamingPreferences(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      const personalPrefs = await this.getPersonalPreferences(userId, memoriaProfileId);
      return {
        games: personalPrefs?.gaming_preferences || [],
        last_updated: personalPrefs?.last_updated || null
      };
    } catch (error) {
      console.error('Error getting gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Store an ElevenLabs voice ID
   */
  static async storeElevenLabsVoiceId(userId: string, voiceId: string, memoriaProfileId?: string): Promise<any> {
    try {
      // Update integration status to mark voice as cloned
      const integrationStatus = {
        status: 'completed',
        voice_cloned: true,
        last_updated: new Date().toISOString()
      };
      
      await this.updateIntegrationStatus(userId, 'elevenlabs', integrationStatus, memoriaProfileId);
      
      // Update the profile with the voice ID
      if (memoriaProfileId) {
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update({ elevenlabs_voice_id: voiceId })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .update({ elevenlabs_voice_id: voiceId })
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      throw error;
    }
  }

  /**
   * Store a Tavus avatar ID
   */
  static async storeTavusAvatarId(userId: string, avatarId: string): Promise<any> {
    try {
      // Update integration status to mark avatar as created
      const integrationStatus = {
        status: 'completed',
        avatar_created: true,
        last_updated: new Date().toISOString()
      };
      
      await this.updateIntegrationStatus(userId, 'tavus', integrationStatus);
      
      // Update the profile with the avatar ID
      const { data, error } = await supabase
        .from('profiles')
        .update({ tavus_avatar_id: avatarId })
        .eq('user_id', userId)
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }

  /**
   * Update the integration status for a specific integration
   */
  static async updateIntegrationStatus(
    userId: string, 
    integration: string, 
    status: Partial<IntegrationStatusEntry>, 
    memoriaProfileId?: string
  ): Promise<any> {
    try {
      // Add last_updated if not provided
      const updatedStatus = {
        ...status,
        last_updated: status.last_updated || new Date().toISOString()
      };
      
      // Update in the appropriate profile
      if (memoriaProfileId) {
        // Get current integration status
        const { data: profile, error } = await supabase
          .from('memoria_profiles')
          .select('integration_status')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const currentStatus = profile.integration_status || {};
        
        // Update the specific integration's status
        const newIntegrationStatus = {
          ...currentStatus,
          [integration]: {
            ...(currentStatus[integration] || {}),
            ...updatedStatus
          }
        };
        
        // Save the updated status
        const { data, error: updateError } = await supabase
          .from('memoria_profiles')
          .update({ integration_status: newIntegrationStatus })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return data;
      } else {
        // Get current integration status
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('integration_status')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const currentStatus = profile.integration_status || {};
        
        // Update the specific integration's status
        const newIntegrationStatus = {
          ...currentStatus,
          [integration]: {
            ...(currentStatus[integration] || {}),
            ...updatedStatus
          }
        };
        
        // Save the updated status
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({ integration_status: newIntegrationStatus })
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return data;
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }

  /**
   * Upload a gallery file (image or video)
   */
  static async uploadGalleryFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      // Determine file path including memoria profile ID if applicable
      const folderPath = memoriaProfileId 
        ? `${userId}/memoria/${memoriaProfileId}`
        : `${userId}/memoir`;
      
      const filePath = `${folderPath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to the 'gallery' bucket
      const { data, error } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading gallery file:', error);
      throw error;
    }
  }

  /**
   * Create a gallery item
   */
  static async createGalleryItem(item: GalleryItemCreate, memoriaProfileId?: string): Promise<any> {
    try {
      // Add a sort_order based on a timestamp (negative for reverse chronological)
      // This uses the current Unix timestamp in seconds as a negative number
      // so newer items will have a lower (more negative) number and appear first
      const timestamp = Math.floor(Date.now() / 1000);
      const itemWithOrder = {
        ...item,
        sort_order: item.sort_order ?? -timestamp
      };
      
      // Add metadata for memoria profile if applicable
      if (memoriaProfileId) {
        itemWithOrder.metadata = {
          ...itemWithOrder.metadata,
          memoriaProfileId
        };
        
        // Also add to tags if not already there
        if (!itemWithOrder.tags) itemWithOrder.tags = [];
        if (!itemWithOrder.tags.includes(`memoria:${memoriaProfileId}`)) {
          itemWithOrder.tags.push(`memoria:${memoriaProfileId}`);
        }
      }
      
      // Add to the database
      const { data, error } = await supabase
        .from('gallery_items')
        .insert(itemWithOrder)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }
  }

  /**
   * Update a gallery item's order
   */
  static async updateGalleryItemOrder(itemId: string, sortOrder: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .update({ sort_order: sortOrder })
        .eq('id', itemId)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating gallery item order:', error);
      throw error;
    }
  }

  /**
   * Update multiple gallery items' order at once
   */
  static async updateGalleryItemsOrder(items: { id: string, sort_order: number }[]): Promise<any> {
    try {
      // Use upsert for batch updating
      const { data, error } = await supabase
        .from('gallery_items')
        .upsert(items, { onConflict: 'id' })
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating gallery items order:', error);
      throw error;
    }
  }

  /**
   * Get gallery items for a user
   */
  static async getGalleryItems(userId: string, memoriaProfileId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('gallery_items')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });
      
      // Filter by memoria profile ID if provided
      if (memoriaProfileId) {
        query = query.filter('metadata->memoriaProfileId', 'eq', memoriaProfileId);
      } else {
        // For memoir, only get items without a memoriaProfileId
        query = query.or('metadata->memoriaProfileId.is.null,metadata->>memoriaProfileId.eq.');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting gallery items:', error);
      throw error;
    }
  }

  /**
   * Delete a gallery item
   */
  static async deleteGalleryItem(itemId: string): Promise<void> {
    try {
      // First get the item to get the file path
      const { data: item, error: getError } = await supabase
        .from('gallery_items')
        .select('file_path')
        .eq('id', itemId)
        .single();
      
      if (getError) throw getError;
      
      // Delete from the database
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Try to delete the file from storage but don't throw an error if it fails
      // This is because the file might be referenced by other items
      try {
        // Extract path from URL
        const url = new URL(item.file_path);
        const path = url.pathname.replace(/^\/storage\/v1\/object\/public\/gallery\//, '');
        
        await supabase.storage
          .from('gallery')
          .remove([path]);
      } catch (storageError) {
        console.warn('Error removing file from storage:', storageError);
        // Don't throw, as the database entry is already deleted
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  /**
   * Upload a document file
   */
  static async uploadDocumentFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      // Determine file path including memoria profile ID if applicable
      const folderPath = memoriaProfileId 
        ? `${userId}/memoria/${memoriaProfileId}`
        : `${userId}/memoir`;
      
      const filePath = `${folderPath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to the 'documents' bucket
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading document file:', error);
      throw error;
    }
  }

  /**
   * Upload a 3D model file
   */
  static async upload3DModelFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      // Determine file path including memoria profile ID if applicable
      const folderPath = memoriaProfileId 
        ? `${userId}/memoria/${memoriaProfileId}`
        : `${userId}/memoir`;
      
      const filePath = `${folderPath}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload the file to the 'models' bucket
      const { data, error } = await supabase.storage
        .from('models')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('models')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
      throw error;
    }
  }

  /**
   * Set profile visibility for public discovery
   */
  static async setProfileVisibility(userId: string, isPublic: boolean, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Update MEMORIA profile visibility
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update({ is_public: isPublic })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Update MEMOIR profile visibility
        const { data, error } = await supabase
          .from('profiles')
          .update({ is_public: isPublic })
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error setting profile visibility:', error);
      throw error;
    }
  }
  
  /**
   * Get public MEMOIR profiles
   */
  static async getPublicMemoirProfiles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .limit(20); // Limit to 20 results for performance
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting public MEMOIR profiles:', error);
      throw error;
    }
  }
  
  /**
   * Get public MEMORIA profiles
   */
  static async getPublicMemoriaProfiles(): Promise<MemoriaProfile[]> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('is_public', true)
        .limit(20); // Limit to 20 results for performance
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting public MEMORIA profiles:', error);
      throw error;
    }
  }
  
  /**
   * Add a profile to favorites
   */
  static async addProfileToFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('profile_favorites')
        .insert({
          user_id: userId,
          profile_id: profileId,
          profile_type: profileType
        })
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding profile to favorites:', error);
      throw error;
    }
  }
  
  /**
   * Remove a profile from favorites
   */
  static async removeProfileFromFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<void> {
    try {
      const { error } = await supabase
        .from('profile_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .eq('profile_type', profileType);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error removing profile from favorites:', error);
      throw error;
    }
  }
  
  /**
   * Get a user's favorite profiles
   */
  static async getFavoriteProfiles(userId: string): Promise<{memoir: any[], memoria: MemoriaProfile[]}> {
    try {
      // Get favorite profile IDs
      const { data: favorites, error } = await supabase
        .from('profile_favorites')
        .select('profile_id, profile_type')
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Separate IDs by profile type
      const memoirIds = favorites
        .filter(fav => fav.profile_type === 'memoir')
        .map(fav => fav.profile_id);
        
      const memoriaIds = favorites
        .filter(fav => fav.profile_type === 'memoria')
        .map(fav => fav.profile_id);
      
      // Get MEMOIR profiles
      const { data: memoirProfiles, error: memoirError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', memoirIds.length > 0 ? memoirIds : ['00000000-0000-0000-0000-000000000000']);
        
      if (memoirError && memoirIds.length > 0) throw memoirError;
      
      // Get MEMORIA profiles
      const { data: memoriaProfiles, error: memoriaError } = await supabase
        .from('memoria_profiles')
        .select('*')
        .in('id', memoriaIds.length > 0 ? memoriaIds : ['00000000-0000-0000-0000-000000000000']);
        
      if (memoriaError && memoriaIds.length > 0) throw memoriaError;
      
      return {
        memoir: memoirProfiles || [],
        memoria: memoriaProfiles || []
      };
    } catch (error) {
      console.error('Error getting favorite profiles:', error);
      throw error;
    }
  }
  
  /**
   * Store media links
   */
  static async storeMediaLinks(userId: string, mediaLinks: any[], memoriaProfileId?: string): Promise<any> {
    try {
      // Validate media links
      const validatedMediaLinks = validateMediaLinks(mediaLinks);
      
      // Store in the appropriate profile
      const dataPath = memoriaProfileId ? 'profile_data' : 'memoir_data';
      const dataToUpdate = {
        [dataPath]: {
          media_links: validatedMediaLinks,
          last_updated: new Date().toISOString()
        }
      };
      
      if (memoriaProfileId) {
        // Update a specific MEMORIA profile
        const { data: profile, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          profile_data: {
            ...profile.profile_data,
            media_links: validatedMediaLinks
          }
        };
        
        const { data, error: updateError } = await supabase
          .from('memoria_profiles')
          .update(updatedData)
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return validatedMediaLinks;
      } else {
        // Update the user's MEMOIR profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          memoir_data: {
            ...profile.memoir_data,
            media_links: validatedMediaLinks
          }
        };
        
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update(updatedData)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return validatedMediaLinks;
      }
    } catch (error) {
      console.error('Error storing media links:', error);
      throw error;
    }
  }
  
  /**
   * Get media links
   */
  static async getMediaLinks(userId: string, memoriaProfileId?: string): Promise<any[]> {
    try {
      if (memoriaProfileId) {
        // Get from MEMORIA profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return data?.profile_data?.media_links || [];
      } else {
        // Get from MEMOIR profile
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        return data?.memoir_data?.media_links || [];
      }
    } catch (error) {
      console.error('Error getting media links:', error);
      throw error;
    }
  }
  
  /**
   * Store personality test results
   */
  static async storePersonalityTestResults(userId: string, testResults: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate the test results
      const validatedResults = validatePersonalityTestData(testResults);
      
      // Create the data to update based on profile type
      const dataToUpdate = memoriaProfileId
        ? { profile_data: { personality_test: validatedResults } }
        : { memoir_data: { personality_test: validatedResults } };
      
      if (memoriaProfileId) {
        // Update a specific MEMORIA profile
        const { data: profile, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          profile_data: {
            ...profile.profile_data,
            personality_test: validatedResults
          }
        };
        
        const { data, error: updateError } = await supabase
          .from('memoria_profiles')
          .update(updatedData)
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return validatedResults;
      } else {
        // Update the user's MEMOIR profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        const updatedData = {
          memoir_data: {
            ...profile.memoir_data,
            personality_test: validatedResults
          }
        };
        
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update(updatedData)
          .eq('user_id', userId)
          .select('*')
          .single();
          
        if (updateError) throw updateError;
        return validatedResults;
      }
    } catch (error) {
      console.error('Error storing personality test results:', error);
      throw error;
    }
  }
  
  /**
   * Attempt to recover specific data from a profile if it's missing
   */
  static async recoverData(userId: string, dataPath: string, memoriaProfileId?: string): Promise<any> {
    try {
      // Split the data path into parts
      const pathParts = dataPath.split('.');
      
      // Get the profile
      let profile;
      if (memoriaProfileId) {
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('*')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        profile = data;
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        profile = data;
      }
      
      // Navigate through the data path
      let currentData = memoriaProfileId ? profile.profile_data : profile.memoir_data;
      if (!currentData) return null;
      
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (currentData && typeof currentData === 'object' && part in currentData) {
          currentData = currentData[part];
        } else {
          return null; // Data path doesn't exist
        }
      }
      
      return currentData;
    } catch (error) {
      console.error('Error recovering data:', error);
      return null;
    }
  }
  
  /**
   * Get MIME type from file extension if type is not available
   */
  static getMimeTypeFromFile(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      rtf: 'application/rtf',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm',
      glb: 'model/gltf-binary',
      gltf: 'model/gltf+json',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed'
    };
    
    return extension && extension in mimeTypes 
      ? mimeTypes[extension] 
      : 'application/octet-stream';
  }
}