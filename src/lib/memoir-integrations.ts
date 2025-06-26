import { supabase } from './supabase';

// Define interfaces for type safety
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
  integration_status?: any;
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
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

export class MemoirIntegrations {
  /**
   * Gets Memoria profiles for a user
   * @param userId The user ID
   * @returns Array of Memoria profiles
   */
  static async getMemoriaProfiles(userId: string): Promise<MemoriaProfile[]> {
    try {
      console.log(`Getting Memoria profiles for user ${userId}`);
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error getting Memoria profiles for user ${userId}:`, error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} Memoria profiles`);
      return data || [];
    } catch (error) {
      console.error('Error getting Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Gets a memoir profile (either user profile or memoria profile)
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The profile data
   */
  static async getMemoirProfile(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get Memoria profile
        console.log(`Getting Memoria profile ${memoriaProfileId} for user ${userId}`);
        
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('*')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }

        return data;
      } else {
        // Get user profile
        console.log(`Getting user profile for user ${userId}`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error(`Error getting user profile for ${userId}:`, error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error getting memoir profile:', error);
      throw error;
    }
  }

  /**
   * Updates memoir data for a profile
   * @param userId The user ID
   * @param data The data to update
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async updateMemoirData(userId: string, data: any, memoriaProfileId?: string): Promise<void> {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile data
        console.log(`Updating Memoria profile ${memoriaProfileId} data:`, data);
        
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ 
            profile_data: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error updating Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }
      } else {
        // Update user profile data
        console.log(`Updating user profile data for ${userId}:`, data);
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            memoir_data: data,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error updating user profile for ${userId}:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }

  /**
   * Sets profile visibility (public/private)
   * @param userId The user ID
   * @param isPublic Whether the profile should be public
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async setProfileVisibility(userId: string, isPublic: boolean, memoriaProfileId?: string): Promise<void> {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile visibility
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ is_public: isPublic })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error updating Memoria profile visibility:`, error);
          throw error;
        }
      } else {
        // Update user profile visibility
        const { error } = await supabase
          .from('profiles')
          .update({ is_public: isPublic })
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error updating user profile visibility:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error setting profile visibility:', error);
      throw error;
    }
  }

  /**
   * Gets public memoir profiles
   * @returns Array of public memoir profiles
   */
  static async getPublicMemoirProfiles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting public memoir profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting public memoir profiles:', error);
      throw error;
    }
  }

  /**
   * Gets public memoria profiles
   * @returns Array of public memoria profiles
   */
  static async getPublicMemoriaProfiles(): Promise<MemoriaProfile[]> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting public memoria profiles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting public memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Gets gallery items for a user
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The gallery items
   */
  static async getGalleryItems(userId: string, memoriaProfileId?: string): Promise<any[]> {
    try {
      console.log(`Getting gallery items for user ${userId}${memoriaProfileId ? ` with Memoria profile ID ${memoriaProfileId}` : ''}`);
      
      let query = supabase
        .from('gallery_items')
        .select('*')
        .eq('user_id', userId);
      
      // If memoriaProfileId is provided, filter by it in metadata
      if (memoriaProfileId) {
        console.log(`Filtering gallery items by Memoria profile ID ${memoriaProfileId}`);
        // Fix the query formatting for proper JSON syntax - properly quote the UUID as a JSON string
        query = query.or(`metadata->memoriaProfileId.eq."${memoriaProfileId}",and(metadata->memoriaProfileId.is.null,tags.cs.'["${memoriaProfileId}"]')`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error getting gallery items for user ${userId}:`, error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} gallery items`);
      
      return data || [];
    } catch (error) {
      console.error('Error getting gallery items:', error);
      throw error;
    }
  }

  /**
   * Gets favorite profiles for a user
   * @param userId The user ID
   * @returns The favorite profiles
   */
  static async getFavoriteProfiles(userId: string): Promise<{memoir: any[], memoria: MemoriaProfile[]}> {
    try {
      console.log(`Getting favorite profiles for user ${userId}`);
      
      // First get the favorite records
      const { data: favorites, error: favoritesError } = await supabase
        .from('profile_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false });
      
      if (favoritesError) {
        console.error(`Error getting favorite profiles for user ${userId}:`, favoritesError);
        throw favoritesError;
      }

      const result: {memoir: any[], memoria: MemoriaProfile[]} = {
        memoir: [],
        memoria: []
      };

      // Now fetch the actual profile data for each favorite
      for (const favorite of favorites || []) {
        if (favorite.profile_type === 'memoria') {
          // Fetch from memoria_profiles table
          const { data: memoriaProfile, error: memoriaError } = await supabase
            .from('memoria_profiles')
            .select('*')
            .eq('id', favorite.profile_id)
            .single();
          
          if (!memoriaError && memoriaProfile) {
            result.memoria.push({
              ...memoriaProfile,
              favoriteId: favorite.id,
              added_at: favorite.added_at
            });
          }
        } else if (favorite.profile_type === 'memoir') {
          // Fetch from profiles table
          const { data: memoirProfile, error: memoirError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', favorite.profile_id)
            .single();
          
          if (!memoirError && memoirProfile) {
            result.memoir.push({
              ...memoirProfile,
              favoriteId: favorite.id,
              added_at: favorite.added_at
            });
          }
        }
      }

      console.log(`Retrieved ${result.memoir.length} memoir favorites and ${result.memoria.length} memoria favorites`);
      
      return result;
    } catch (error) {
      console.error('Error getting favorite profiles:', error);
      throw error;
    }
  }

  /**
   * Adds a profile to user's favorites
   * @param userId The user ID
   * @param profileId The profile ID to add to favorites
   * @param profileType The type of profile (default: 'memoria')
   * @returns The created favorite record
   */
  static async addProfileToFavorites(userId: string, profileId: string, profileType: string = 'memoria'): Promise<any> {
    try {
      console.log(`Adding profile ${profileId} to favorites for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profile_favorites')
        .insert({
          user_id: userId,
          profile_id: profileId,
          profile_type: profileType
        })
        .select()
        .single();
      
      if (error) {
        console.error(`Error adding profile ${profileId} to favorites for user ${userId}:`, error);
        throw error;
      }

      console.log(`Successfully added profile ${profileId} to favorites`);
      
      return data;
    } catch (error) {
      console.error('Error adding profile to favorites:', error);
      throw error;
    }
  }

  /**
   * Removes a profile from user's favorites
   * @param userId The user ID
   * @param profileId The profile ID to remove from favorites
   * @param profileType The type of profile (default: 'memoria')
   * @returns Success status
   */
  static async removeProfileFromFavorites(userId: string, profileId: string, profileType: string = 'memoria'): Promise<boolean> {
    try {
      console.log(`Removing profile ${profileId} from favorites for user ${userId}`);
      
      const { error } = await supabase
        .from('profile_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .eq('profile_type', profileType);
      
      if (error) {
        console.error(`Error removing profile ${profileId} from favorites for user ${userId}:`, error);
        throw error;
      }

      console.log(`Successfully removed profile ${profileId} from favorites`);
      
      return true;
    } catch (error) {
      console.error('Error removing profile from favorites:', error);
      throw error;
    }
  }

  /**
   * Stores ElevenLabs voice ID
   * @param userId The user ID
   * @param voiceId The voice ID
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storeElevenLabsVoiceId(userId: string, voiceId: string, memoriaProfileId?: string): Promise<void> {
    try {
      if (memoriaProfileId) {
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ elevenlabs_voice_id: voiceId })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ elevenlabs_voice_id: voiceId })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      throw error;
    }
  }

  /**
   * Stores Tavus avatar ID
   * @param userId The user ID
   * @param avatarId The avatar ID
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storeTavusAvatarId(userId: string, avatarId: string, memoriaProfileId?: string): Promise<void> {
    try {
      if (memoriaProfileId) {
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ tavus_avatar_id: avatarId })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ tavus_avatar_id: avatarId })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }

  /**
   * Updates integration status
   * @param userId The user ID
   * @param integration The integration name
   * @param status The status data
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async updateIntegrationStatus(userId: string, integration: string, status: any, memoriaProfileId?: string): Promise<void> {
    try {
      const currentProfile = await this.getMemoirProfile(userId, memoriaProfileId);
      const currentStatus = currentProfile?.integration_status || {};
      
      const updatedStatus = {
        ...currentStatus,
        [integration]: {
          ...currentStatus[integration],
          ...status,
          last_updated: new Date().toISOString()
        }
      };

      if (memoriaProfileId) {
        const { error } = await supabase
          .from('memoria_profiles')
          .update({ integration_status: updatedStatus })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ integration_status: updatedStatus })
          .eq('user_id', userId);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating integration status:', error);
      throw error;
    }
  }

  /**
   * Stores personal preferences
   * @param userId The user ID
   * @param preferences The preferences data
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storePersonalPreferences(userId: string, preferences: any, memoriaProfileId?: string): Promise<any> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        const profileData = profile?.profile_data || {};
        const updatedData = {
          ...profileData,
          preferences: {
            ...profileData.preferences,
            personal: preferences
          }
        };
        
        await this.updateMemoirData(userId, updatedData, memoriaProfileId);
      } else {
        const memoirData = profile?.memoir_data || {};
        const updatedData = {
          ...memoirData,
          preferences: {
            ...memoirData.preferences,
            personal: preferences
          }
        };
        
        await this.updateMemoirData(userId, updatedData);
      }
      
      return preferences;
    } catch (error) {
      console.error('Error storing personal preferences:', error);
      throw error;
    }
  }

  /**
   * Gets personal preferences
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async getPersonalPreferences(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        return profile?.profile_data?.preferences?.personal;
      } else {
        return profile?.memoir_data?.preferences?.personal;
      }
    } catch (error) {
      console.error('Error getting personal preferences:', error);
      throw error;
    }
  }

  /**
   * Stores gaming preferences
   * @param userId The user ID
   * @param games The games data
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storeGamingPreferences(userId: string, games: GameEntry[], memoriaProfileId?: string): Promise<any> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        const profileData = profile?.profile_data || {};
        const personalPrefs = profileData.preferences?.personal || {};
        const updatedData = {
          ...profileData,
          preferences: {
            ...profileData.preferences,
            personal: {
              ...personalPrefs,
              gaming_preferences: games
            }
          }
        };
        
        await this.updateMemoirData(userId, updatedData, memoriaProfileId);
      } else {
        const memoirData = profile?.memoir_data || {};
        const personalPrefs = memoirData.preferences?.personal || {};
        const updatedData = {
          ...memoirData,
          preferences: {
            ...memoirData.preferences,
            personal: {
              ...personalPrefs,
              gaming_preferences: games
            }
          }
        };
        
        await this.updateMemoirData(userId, updatedData);
      }
      
      return { gaming_preferences: games };
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Gets gaming preferences
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async getGamingPreferences(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      const personalPrefs = await this.getPersonalPreferences(userId, memoriaProfileId);
      return { games: personalPrefs?.gaming_preferences || [] };
    } catch (error) {
      console.error('Error getting gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Stores media links
   * @param userId The user ID
   * @param mediaLinks The media links data
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storeMediaLinks(userId: string, mediaLinks: any[], memoriaProfileId?: string): Promise<void> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        const profileData = profile?.profile_data || {};
        const updatedData = {
          ...profileData,
          media_links: mediaLinks
        };
        
        await this.updateMemoirData(userId, updatedData, memoriaProfileId);
      } else {
        const memoirData = profile?.memoir_data || {};
        const updatedData = {
          ...memoirData,
          media_links: mediaLinks
        };
        
        await this.updateMemoirData(userId, updatedData);
      }
    } catch (error) {
      console.error('Error storing media links:', error);
      throw error;
    }
  }

  /**
   * Gets media links
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async getMediaLinks(userId: string, memoriaProfileId?: string): Promise<any[]> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        return profile?.profile_data?.media_links || [];
      } else {
        return profile?.memoir_data?.media_links || [];
      }
    } catch (error) {
      console.error('Error getting media links:', error);
      throw error;
    }
  }

  /**
   * Uploads a file to storage
   * @param userId The user ID
   * @param file The file to upload
   * @param bucket The storage bucket
   * @param path The file path
   */
  static async uploadFile(userId: string, file: File, bucket: string = 'gallery', path?: string): Promise<string> {
    try {
      const filename = path || `${userId}/${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, file);
      
      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
      
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);
      
      return publicData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Uploads a gallery file
   * @param userId The user ID
   * @param file The file to upload
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async uploadGalleryFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      const folder = memoriaProfileId ? `memoria/${memoriaProfileId}` : `memoir/${userId}`;
      const filename = `${folder}/${Date.now()}-${file.name}`;
      
      return await this.uploadFile(userId, file, 'gallery', filename);
    } catch (error) {
      console.error('Error uploading gallery file:', error);
      throw error;
    }
  }

  /**
   * Creates a gallery item
   * @param itemData The gallery item data
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async createGalleryItem(itemData: any, memoriaProfileId?: string): Promise<any> {
    try {
      const metadata = {
        ...itemData.metadata,
        memoriaProfileId: memoriaProfileId || null
      };
      
      const { data, error } = await supabase
        .from('gallery_items')
        .insert({
          ...itemData,
          metadata
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating gallery item:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }
  }

  /**
   * Deletes a gallery item
   * @param itemId The gallery item ID
   */
  static async deleteGalleryItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        console.error('Error deleting gallery item:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  /**
   * Uploads a document file
   * @param userId The user ID
   * @param file The file to upload
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async uploadDocumentFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      const folder = memoriaProfileId ? `memoria/${memoriaProfileId}/documents` : `memoir/${userId}/documents`;
      const filename = `${folder}/${Date.now()}-${file.name}`;
      
      return await this.uploadFile(userId, file, 'documents', filename);
    } catch (error) {
      console.error('Error uploading document file:', error);
      throw error;
    }
  }

  /**
   * Gets MIME type from file
   * @param file The file
   */
  static getMimeTypeFromFile(file: File): string {
    return file.type || 'application/octet-stream';
  }

  /**
   * Stores personality test results
   * @param userId The user ID
   * @param results The test results
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async storePersonalityTestResults(userId: string, results: any, memoriaProfileId?: string): Promise<void> {
    try {
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      if (memoriaProfileId) {
        const profileData = profile?.profile_data || {};
        const updatedData = {
          ...profileData,
          personality_test: results
        };
        
        await this.updateMemoirData(userId, updatedData, memoriaProfileId);
      } else {
        const memoirData = profile?.memoir_data || {};
        const updatedData = {
          ...memoirData,
          personality_test: results
        };
        
        await this.updateMemoirData(userId, updatedData);
      }
    } catch (error) {
      console.error('Error storing personality test results:', error);
      throw error;
    }
  }

  /**
   * Recovers data from backup or alternative sources
   * @param userId The user ID
   * @param dataType The type of data to recover
   * @param memoriaProfileId Optional Memoria profile ID
   */
  static async recoverData(userId: string, dataType: string, memoriaProfileId?: string): Promise<any> {
    try {
      // This is a placeholder implementation
      // In a real application, this would attempt to recover data from backups
      console.log(`Attempting to recover ${dataType} for user ${userId}`);
      return null;
    } catch (error) {
      console.error('Error recovering data:', error);
      throw error;
    }
  }

  /**
   * Creates a new Memoria profile
   * @param userId The user ID
   * @param profileData The profile data
   */
  static async createMemoriaProfile(userId: string, profileData: any): Promise<MemoriaProfile> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .insert({
          user_id: userId,
          ...profileData,
          profile_data: profileData.profile_data || {},
          integration_status: {
            tavus: { status: 'not_started', last_updated: null, avatar_created: false },
            gemini: { status: 'not_started', last_updated: null, narratives_processed: false },
            avaturn: { status: 'not_started', last_updated: null, avatar_created: false },
            elevenlabs: { status: 'not_started', last_updated: null, voice_cloned: false },
            portrait_generation: { status: 'not_started', last_updated: null, portraits_generated: false }
          }
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating Memoria profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Updates a Memoria profile
   * @param userId The user ID
   * @param profileId The profile ID
   * @param profileData The updated profile data
   */
  static async updateMemoriaProfile(userId: string, profileId: string, profileData: any): Promise<MemoriaProfile> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating Memoria profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Deletes a Memoria profile
   * @param userId The user ID
   * @param profileId The profile ID
   */
  static async deleteMemoriaProfile(userId: string, profileId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('memoria_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error deleting Memoria profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting Memoria profile:', error);
      throw error;
    }
  }
}