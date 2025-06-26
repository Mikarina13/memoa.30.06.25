import { supabase } from './supabase';
import { 
  validatePersonalPreferences, 
  validateNarrativesData, 
  validateFamilyTreeData, 
  validateMediaLinks,
  validatePortraitsData,
  validateAvaturnAvatarsData,
  validatePersonalityTestData,
  validateMemoirData,
  validateSpaceCustomizationData
} from './data-validation';

// Define the MemoriaProfile interface
export interface MemoriaProfile {
  id: string;
  user_id: string;
  name: string;
  relationship?: string;
  description?: string;
  birth_date?: string;
  death_date?: string;
  is_celebrity: boolean;
  profile_data?: any;
  elevenlabs_voice_id?: string;
  tavus_avatar_id?: string;
  integration_status: MemoirIntegrationStatus;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

// Define the integration status interface
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

// Define the interface for digital presence entries
export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

// Define the interface for gaming preferences entries
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

// Helper function to get the MIME type of a file
export function getMimeTypeFromFile(file: File): string {
  return file.type || 'application/octet-stream';
}

export class MemoirIntegrations {
  // Get user's memoir profile
  static async getMemoirProfile(userId: string, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Get a specific Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('*')
          .eq('id', memoriaProfileId)
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Get the user's main profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  // Get all Memoria profiles for a user
  static async getMemoriaProfiles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting Memoria profiles:', error);
      throw error;
    }
  }
  
  // Get public Memoria profiles (for Explorer)
  static async getPublicMemoriaProfiles() {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to 20 most recent profiles
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting public Memoria profiles:', error);
      throw error;
    }
  }
  
  // Get public Memoir profiles (for Explorer)
  static async getPublicMemoirProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to 20 most recent profiles
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting public Memoir profiles:', error);
      throw error;
    }
  }

  // Create a new Memoria profile
  static async createMemoriaProfile(
    userId: string,
    name: string,
    relationship?: string,
    description?: string,
    birthDate?: string,
    deathDate?: string,
    isCelebrity?: boolean
  ) {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .insert([
          {
            user_id: userId,
            name,
            relationship,
            description,
            birth_date: birthDate,
            death_date: deathDate,
            is_celebrity: isCelebrity || false,
            profile_data: {},
            integration_status: {
              elevenlabs: { status: 'not_started', voice_cloned: false, last_updated: null },
              tavus: { status: 'not_started', avatar_created: false, last_updated: null },
              gemini: { status: 'not_started', narratives_processed: false, last_updated: null },
              avaturn: { status: 'not_started', avatar_created: false, last_updated: null },
              portrait_generation: { status: 'not_started', portraits_generated: false, last_updated: null }
            }
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Memoria profile:', error);
      throw error;
    }
  }

  // Update a Memoria profile
  static async updateMemoriaProfile(profileId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating Memoria profile:', error);
      throw error;
    }
  }

  // Delete a Memoria profile
  static async deleteMemoriaProfile(profileId: string) {
    try {
      const { error } = await supabase
        .from('memoria_profiles')
        .delete()
        .eq('id', profileId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting Memoria profile:', error);
      throw error;
    }
  }

  // Update memoir data for a user or memoria profile
  static async updateMemoirData(userId: string, data: any, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Get current profile data
        const { data: existingData, error: fetchError } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Merge new data with existing data
        const updatedData = {
          ...existingData.profile_data,
          ...data
        };
        
        // Validate the data to ensure it has the right structure
        const validatedData = validateMemoirData(updatedData);
        
        // Update profile data
        const { error: updateError } = await supabase
          .from('memoria_profiles')
          .update({ profile_data: validatedData })
          .eq('id', memoriaProfileId);
        
        if (updateError) throw updateError;
        
        return validatedData;
      } else {
        // Get current memoir data
        const { data: existingData, error: fetchError } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Merge new data with existing data
        const updatedData = {
          ...existingData?.memoir_data,
          ...data
        };
        
        // Validate the data to ensure it has the right structure
        const validatedData = validateMemoirData(updatedData);
        
        // Update memoir data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ memoir_data: validatedData })
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
        
        return validatedData;
      }
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }
  
  // Update integration status for a specific service
  static async updateIntegrationStatus(
    userId: string, 
    service: 'elevenlabs' | 'tavus' | 'gemini' | 'avaturn' | 'portrait_generation',
    status: any,
    memoriaProfileId?: string
  ) {
    try {
      const now = new Date().toISOString();
      
      if (memoriaProfileId) {
        // Get current integration status for Memoria profile
        const { data: currentData, error: fetchError } = await supabase
          .from('memoria_profiles')
          .select('integration_status')
          .eq('id', memoriaProfileId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Update specific service status
        const updatedStatus = {
          ...currentData.integration_status,
          [service]: {
            ...currentData.integration_status[service],
            ...status,
            last_updated: now
          }
        };
        
        // Update integration status
        const { error: updateError } = await supabase
          .from('memoria_profiles')
          .update({ integration_status: updatedStatus })
          .eq('id', memoriaProfileId);
        
        if (updateError) throw updateError;
        
        return updatedStatus;
      } else {
        // Get current integration status for user profile
        const { data: currentData, error: fetchError } = await supabase
          .from('profiles')
          .select('integration_status')
          .eq('user_id', userId)
          .single();
        
        if (fetchError) throw fetchError;
        
        // Update specific service status
        const updatedStatus = {
          ...currentData.integration_status,
          [service]: {
            ...currentData.integration_status[service],
            ...status,
            last_updated: now
          }
        };
        
        // Update integration status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ integration_status: updatedStatus })
          .eq('user_id', userId);
        
        if (updateError) throw updateError;
        
        return updatedStatus;
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }
  
  // Store ElevenLabs voice ID
  static async storeElevenLabsVoiceId(userId: string, voiceId: string, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ 
            elevenlabs_voice_id: voiceId,
            integration_status: supabase.rpc('jsonb_deep_set', {
              json_data: supabase.rpc('jsonb_deep_get', {
                json_data: supabase.sql`integration_status`,
                path: '{elevenlabs}'
              }),
              path: '{status}',
              value: 'completed'
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId);
        
        if (error) throw error;
      } else {
        // Update user profile
        const { error } = await supabase
          .from('profiles')
          .update({ 
            elevenlabs_voice_id: voiceId,
            integration_status: supabase.rpc('jsonb_deep_set', {
              json_data: supabase.rpc('jsonb_deep_get', {
                json_data: supabase.sql`integration_status`,
                path: '{elevenlabs}'
              }),
              path: '{status}',
              value: 'completed'
            }),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
      
      return voiceId;
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      throw error;
    }
  }
  
  // Store Tavus avatar ID
  static async storeTavusAvatarId(userId: string, avatarId: string, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ 
            tavus_avatar_id: avatarId,
            integration_status: supabase.rpc('jsonb_deep_set', {
              json_data: supabase.rpc('jsonb_deep_get', {
                json_data: supabase.sql`integration_status`,
                path: '{tavus}'
              }),
              path: '{status}',
              value: 'completed'
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId);
        
        if (error) throw error;
      } else {
        // Update user profile
        const { error } = await supabase
          .from('profiles')
          .update({ 
            tavus_avatar_id: avatarId,
            integration_status: supabase.rpc('jsonb_deep_set', {
              json_data: supabase.rpc('jsonb_deep_get', {
                json_data: supabase.sql`integration_status`,
                path: '{tavus}'
              }),
              path: '{status}',
              value: 'completed'
            }),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
      
      return avatarId;
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }
  
  // Get gallery items for a user or memoria profile
  static async getGalleryItems(userId: string, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Get gallery items for a specific Memoria profile
        // Using metadata.memoriaProfileId to filter
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('user_id', userId)
          .contains('metadata', { memoriaProfileId })
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
      } else {
        // Get gallery items for the user's main profile
        // Get items where metadata.memoriaProfileId is NULL or not set
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('user_id', userId)
          .is('metadata->memoriaProfileId', null)
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error('Error getting gallery items:', error);
      throw error;
    }
  }
  
  // Create a new gallery item
  static async createGalleryItem(item: any, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Ensure metadata includes the memoriaProfileId
        if (!item.metadata) {
          item.metadata = {};
        }
        item.metadata.memoriaProfileId = memoriaProfileId;
      }
      
      const { data, error } = await supabase
        .from('gallery_items')
        .insert([item])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }
  }
  
  // Delete a gallery item
  static async deleteGalleryItem(itemId: string) {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }
  
  // Update a gallery item's sort order
  static async updateGalleryItemOrder(itemId: string, sortOrder: number) {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .update({ sort_order: sortOrder })
        .eq('id', itemId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating gallery item sort order:', error);
      throw error;
    }
  }
  
  // Update multiple gallery items' sort orders in a batch
  static async updateGalleryItemsOrder(items: { id: string; sort_order: number }[]) {
    try {
      // Use a transaction to ensure all updates succeed or fail together
      const updates = items.map(item => 
        supabase
          .from('gallery_items')
          .update({ sort_order: item.sort_order })
          .eq('id', item.id)
      );
      
      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error updating gallery items sort order:', error);
      throw error;
    }
  }
  
  // Upload a gallery file (image or video)
  static async uploadGalleryFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${userId}${memoriaProfileId ? `/${memoriaProfileId}` : ''}/${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      // Upload to the gallery bucket
      const { data, error } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading gallery file:', error);
      throw error;
    }
  }
  
  // Upload a document file
  static async uploadDocumentFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${userId}${memoriaProfileId ? `/${memoriaProfileId}` : ''}/${Date.now()}_${encodeURIComponent(file.name)}`;
      const filePath = `${fileName}`;
      
      // Upload to the documents bucket
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading document file:', error);
      throw error;
    }
  }
  
  // Upload a 3D model file
  static async upload3DModelFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${userId}${memoriaProfileId ? `/${memoriaProfileId}` : ''}/${Date.now()}_${encodeURIComponent(file.name)}`;
      const filePath = `${fileName}`;
      
      // Upload to the models bucket
      const { data, error } = await supabase.storage
        .from('models')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('models')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
      throw error;
    }
  }
  
  // Get media links for a user or memoria profile
  static async getMediaLinks(userId: string, memoriaProfileId?: string) {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        // Return media links from the Memoria profile
        return profile?.profile_data?.media_links || [];
      } else {
        // Return media links from the user's main profile
        return profile?.memoir_data?.media_links || [];
      }
    } catch (error) {
      console.error('Error getting media links:', error);
      throw error;
    }
  }
  
  // Store media links for a user or memoria profile
  static async storeMediaLinks(userId: string, mediaLinks: any[], memoriaProfileId?: string) {
    try {
      // Validate the media links data
      const validatedMediaLinks = validateMediaLinks(mediaLinks);
      
      if (memoriaProfileId) {
        // Update the Memoria profile
        return await this.updateMemoirData(userId, { media_links: validatedMediaLinks }, memoriaProfileId);
      } else {
        // Update the user's main profile
        return await this.updateMemoirData(userId, { media_links: validatedMediaLinks });
      }
    } catch (error) {
      console.error('Error storing media links:', error);
      throw error;
    }
  }
  
  // Get personal preferences for a user or memoria profile
  static async getPersonalPreferences(userId: string, memoriaProfileId?: string) {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        // Return personal preferences from the Memoria profile
        return profile?.profile_data?.preferences?.personal || null;
      } else {
        // Return personal preferences from the user's main profile
        return profile?.memoir_data?.preferences?.personal || null;
      }
    } catch (error) {
      console.error('Error getting personal preferences:', error);
      throw error;
    }
  }
  
  // Store personal preferences for a user or memoria profile
  static async storePersonalPreferences(userId: string, preferences: any, memoriaProfileId?: string) {
    try {
      // Validate the personal preferences data
      const validatedPreferences = validatePersonalPreferences(preferences);
      
      if (memoriaProfileId) {
        // Get current preferences
        const profile = await this.getMemoirProfile(userId, memoriaProfileId);
        const currentPreferences = profile?.profile_data?.preferences || {};
        
        // Update the Memoria profile
        return await this.updateMemoirData(
          userId, 
          { 
            preferences: {
              ...currentPreferences,
              personal: validatedPreferences
            }
          }, 
          memoriaProfileId
        );
      } else {
        // Get current preferences
        const profile = await this.getMemoirProfile(userId);
        const currentPreferences = profile?.memoir_data?.preferences || {};
        
        // Update the user's main profile
        return await this.updateMemoirData(
          userId, 
          { 
            preferences: {
              ...currentPreferences,
              personal: validatedPreferences
            }
          }
        );
      }
    } catch (error) {
      console.error('Error storing personal preferences:', error);
      throw error;
    }
  }
  
  // Store gaming preferences for a user or memoria profile
  static async storeGamingPreferences(userId: string, games: any[], memoriaProfileId?: string) {
    try {
      // Get current preferences
      const currentPreferences = await this.getPersonalPreferences(userId, memoriaProfileId) || {};
      
      // Update gaming preferences
      const updatedPreferences = {
        ...currentPreferences,
        gaming_preferences: games
      };
      
      // Store the updated preferences
      return await this.storePersonalPreferences(userId, updatedPreferences, memoriaProfileId);
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }
  
  // Get gaming preferences for a user or memoria profile
  static async getGamingPreferences(userId: string, memoriaProfileId?: string) {
    try {
      const preferences = await this.getPersonalPreferences(userId, memoriaProfileId);
      return {
        games: preferences?.gaming_preferences || []
      };
    } catch (error) {
      console.error('Error getting gaming preferences:', error);
      throw error;
    }
  }
  
  // Store personality test results for a user or memoria profile
  static async storePersonalityTestResults(userId: string, results: any, memoriaProfileId?: string) {
    try {
      // Validate the personality test data
      const validatedResults = validatePersonalityTestData(results);
      
      if (memoriaProfileId) {
        // Update the Memoria profile
        return await this.updateMemoirData(userId, { personality_test: validatedResults }, memoriaProfileId);
      } else {
        // Update the user's main profile
        return await this.updateMemoirData(userId, { personality_test: validatedResults });
      }
    } catch (error) {
      console.error('Error storing personality test results:', error);
      throw error;
    }
  }
  
  // Set profile visibility (public/private)
  static async setProfileVisibility(userId: string, isPublic: boolean, memoriaProfileId?: string) {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ is_public: isPublic })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Update user profile
        const { error } = await supabase
          .from('profiles')
          .update({ is_public: isPublic })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
      
      return isPublic;
    } catch (error) {
      console.error('Error setting profile visibility:', error);
      throw error;
    }
  }
  
  // Add a profile to favorites
  static async addProfileToFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria') {
    try {
      // First check if this profile is already favorited
      const { data: existingFavorite, error: checkError } = await supabase
        .from('profile_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .eq('profile_type', profileType)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found
      
      // If there was a serious error (not just "not found"), throw it
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      // If the favorite already exists, just return success
      if (existingFavorite) {
        console.log('Profile already favorited:', existingFavorite);
        return true;
      }
      
      // Otherwise, insert the new favorite
      const { error } = await supabase
        .from('profile_favorites')
        .insert([
          {
            user_id: userId,
            profile_id: profileId,
            profile_type: profileType
          }
        ]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding profile to favorites:', error);
      throw error;
    }
  }
  
  // Remove a profile from favorites
  static async removeProfileFromFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria') {
    try {
      const { error } = await supabase
        .from('profile_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .eq('profile_type', profileType);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing profile from favorites:', error);
      throw error;
    }
  }
  
  // Get user's favorite profiles
  static async getFavoriteProfiles(userId: string) {
    try {
      // Get favorite IDs
      const { data: favoriteData, error } = await supabase
        .from('profile_favorites')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Separate memoir and memoria favorites
      const memoirFavoriteIds = favoriteData
        .filter(fav => fav.profile_type === 'memoir')
        .map(fav => fav.profile_id);
      
      const memoriaFavoriteIds = favoriteData
        .filter(fav => fav.profile_type === 'memoria')
        .map(fav => fav.profile_id);
      
      // Get favorite profiles data
      const [memoirProfiles, memoriaProfiles] = await Promise.all([
        memoirFavoriteIds.length > 0 
          ? supabase
              .from('profiles')
              .select('*')
              .in('id', memoirFavoriteIds)
          : { data: [] },
        memoriaFavoriteIds.length > 0
          ? supabase
              .from('memoria_profiles')
              .select('*')
              .in('id', memoriaFavoriteIds)
          : { data: [] }
      ]);
      
      return {
        memoir: memoirProfiles.data || [],
        memoria: memoriaProfiles.data || []
      };
    } catch (error) {
      console.error('Error getting favorite profiles:', error);
      throw error;
    }
  }
  
  // Helper function to try to recover data
  static async recoverData(userId: string, dataPath: string, memoriaProfileId?: string) {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      const pathParts = dataPath.split('.');
      let currentData;
      
      if (memoriaProfileId) {
        // Navigate the profile_data object
        currentData = profile?.profile_data;
      } else {
        // Navigate the memoir_data object
        currentData = profile?.memoir_data;
      }
      
      if (!currentData) return null;
      
      // Navigate through the data path
      for (const part of pathParts) {
        if (currentData[part] === undefined) return null;
        currentData = currentData[part];
      }
      
      return currentData;
    } catch (error) {
      console.error('Error recovering data:', error);
      return null;
    }
  }
  
  // Helper function to get MIME type from file
  static getMimeTypeFromFile(file: File): string {
    return file.type || 'application/octet-stream';
  }
}