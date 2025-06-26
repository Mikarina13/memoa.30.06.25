import { supabase } from './supabase';
import { validatePersonalPreferences, validateNarrativesData, validateFamilyTreeData, validateMediaLinks, validatePortraitsData, validateAvaturnAvatarsData, validatePersonalityTestData, validateIntegrationStatus, validateMemoirData } from './data-validation';

/**
 * Represents the status of integration with external AI services
 */
export interface IntegrationStatus {
  status: 'not_started' | 'in_progress' | 'completed' | 'error';
  last_updated: string | null;
}

/**
 * Represents the status of all integrations for a memoir profile
 */
export interface MemoirIntegrationStatus {
  elevenlabs: IntegrationStatus & { voice_cloned: boolean };
  tavus: IntegrationStatus & { avatar_created: boolean };
  gemini: IntegrationStatus & { narratives_processed: boolean };
  avaturn?: IntegrationStatus & { avatar_created: boolean };
  portrait_generation?: IntegrationStatus & { portraits_generated: boolean };
}

/**
 * Represents a Memoria profile (a loved one's profile)
 */
export interface MemoriaProfile {
  id: string;
  user_id: string;
  name: string;
  relationship?: string;
  description?: string;
  birth_date?: string;
  death_date?: string;
  is_celebrity?: boolean;
  profile_data?: any;
  elevenlabs_voice_id?: string;
  tavus_avatar_id?: string;
  integration_status?: MemoirIntegrationStatus;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Represents a game entry in a user's gaming preferences
 */
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

/**
 * Represents a digital presence entry (social media, website, etc.)
 */
export interface DigitalPresenceEntry {
  id: string;
  name: string;
  url: string;
  timestamp: string;
}

/**
 * Class containing all integration methods for the MEMOIR platform
 */
export class MemoirIntegrations {
  /**
   * Gets the MIME type from a file
   * @param file The file to get the MIME type from
   * @returns The MIME type
   */
  static getMimeTypeFromFile(file: File): string {
    // If the file has a type property, use that
    if (file.type) {
      return file.type;
    }
    
    // Otherwise, try to determine based on file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return 'application/octet-stream';
    }
    
    // Map of common extensions to MIME types
    const mimeTypeMap: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'glb': 'model/gltf-binary',
      'gltf': 'model/gltf+json'
    };
    
    return mimeTypeMap[extension] || 'application/octet-stream';
  }

  /**
   * Updates the integration status for a specific service
   * @param userId The user ID
   * @param service The service name
   * @param status The new status
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated user profile data
   */
  static async updateIntegrationStatus(
    userId: string,
    service: 'elevenlabs' | 'tavus' | 'gemini' | 'avaturn' | 'portrait_generation',
    status: Partial<IntegrationStatus & { voice_cloned?: boolean, avatar_created?: boolean, narratives_processed?: boolean, portraits_generated?: boolean }>,
    memoriaProfileId?: string
  ): Promise<any> {
    console.log(`Updating integration status for ${service} with status:`, status);
    
    try {
      // Prepare the update payload
      let updatePayload: any = {};
      
      if (memoriaProfileId) {
        // For Memoria profile
        console.log(`Updating integration status for Memoria profile ${memoriaProfileId}`);
        
        // Get current integration_status for the profile
        const { data: profile, error: getError } = await supabase
          .from('memoria_profiles')
          .select('integration_status')
          .eq('id', memoriaProfileId)
          .single();
        
        if (getError) {
          console.error(`Error getting Memoria profile ${memoriaProfileId}:`, getError);
          throw getError;
        }
        
        // Update the status for the specific service
        const integrationStatus = profile?.integration_status || {};
        integrationStatus[service] = {
          ...integrationStatus[service],
          ...status,
          last_updated: new Date().toISOString()
        };
        
        updatePayload = { integration_status: integrationStatus };
        
        // Update the profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update(updatePayload)
          .eq('id', memoriaProfileId)
          .eq('user_id', userId); // Ensure the user owns this profile
        
        if (error) {
          console.error(`Error updating Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }
        
        return data;
      } else {
        // For user profile
        console.log(`Updating integration status for user profile ${userId}`);
        
        // Get current integration_status
        const { data: profile, error: getError } = await supabase
          .from('profiles')
          .select('integration_status')
          .eq('user_id', userId)
          .single();
        
        if (getError) {
          console.error(`Error getting user profile ${userId}:`, getError);
          throw getError;
        }
        
        // Update the status for the specific service
        const integrationStatus = profile?.integration_status || {};
        integrationStatus[service] = {
          ...integrationStatus[service],
          ...status,
          last_updated: new Date().toISOString()
        };
        
        updatePayload = { integration_status: integrationStatus };
        
        // Update the profile
        const { data, error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('user_id', userId);
        
        if (error) {
          console.error(`Error updating user profile ${userId}:`, error);
          throw error;
        }
        
        return data;
      }
    } catch (error) {
      console.error(`Error updating integration status for ${service}:`, error);
      throw error;
    }
  }

  /**
   * Stores an ElevenLabs voice ID for a user
   * @param userId The user ID
   * @param voiceId The ElevenLabs voice ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeElevenLabsVoiceId(userId: string, voiceId: string, memoriaProfileId?: string): Promise<any> {
    try {
      console.log(`Storing ElevenLabs voice ID for ${memoriaProfileId ? 'Memoria profile' : 'user'} ${memoriaProfileId || userId}`);
      
      if (memoriaProfileId) {
        // Update Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update({ 
            elevenlabs_voice_id: voiceId,
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        // Also update integration status
        await this.updateIntegrationStatus(userId, 'elevenlabs', {
          status: 'completed',
          voice_cloned: true
        }, memoriaProfileId);
        
        return data;
      } else {
        // Update user profile
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            elevenlabs_voice_id: voiceId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        // Also update integration status
        await this.updateIntegrationStatus(userId, 'elevenlabs', {
          status: 'completed',
          voice_cloned: true
        });
        
        return data;
      }
    } catch (error) {
      console.error('Error storing ElevenLabs voice ID:', error);
      throw error;
    }
  }

  /**
   * Stores a Tavus avatar ID for a user
   * @param userId The user ID
   * @param avatarId The Tavus avatar ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeTavusAvatarId(userId: string, avatarId: string, memoriaProfileId?: string): Promise<any> {
    try {
      console.log(`Storing Tavus avatar ID for ${memoriaProfileId ? 'Memoria profile' : 'user'} ${memoriaProfileId || userId}`);
      
      if (memoriaProfileId) {
        // Update Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update({ 
            tavus_avatar_id: avatarId,
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        // Also update integration status
        await this.updateIntegrationStatus(userId, 'tavus', {
          status: 'completed',
          avatar_created: true
        }, memoriaProfileId);
        
        return data;
      } else {
        // Update user profile
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            tavus_avatar_id: avatarId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (error) {
          throw error;
        }
        
        // Also update integration status
        await this.updateIntegrationStatus(userId, 'tavus', {
          status: 'completed',
          avatar_created: true
        });
        
        return data;
      }
    } catch (error) {
      console.error('Error storing Tavus avatar ID:', error);
      throw error;
    }
  }

  /**
   * Updates memoir data (memoir_data for user profile, profile_data for Memoria profile)
   * @param userId The user ID
   * @param data The data to update
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async updateMemoirData(userId: string, data: any, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get current profile_data for Memoria profile
        const { data: currentProfile, error: getError } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
        
        if (getError) {
          console.error(`Error getting Memoria profile ${memoriaProfileId}:`, getError);
          throw getError;
        }
        
        // Merge new data with existing data
        const mergedData = {
          ...(currentProfile?.profile_data || {}),
          ...data
        };
        
        // Use data-validation to ensure data integrity
        const validatedData = validateMemoirData(mergedData);
        
        // Update the profile
        const { data: updatedData, error } = await supabase
          .from('memoria_profiles')
          .update({ 
            profile_data: validatedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select();
        
        if (error) {
          console.error(`Error updating Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }
        
        return updatedData[0] || null;
      } else {
        // Get current memoir_data for user profile
        const { data: currentProfile, error: getError } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
        
        if (getError) {
          console.error(`Error getting user profile ${userId}:`, getError);
          throw getError;
        }
        
        // Merge new data with existing data
        const mergedData = {
          ...(currentProfile?.memoir_data || {}),
          ...data
        };
        
        // Use data-validation to ensure data integrity
        const validatedData = validateMemoirData(mergedData);
        
        // Update the profile
        const { data: updatedData, error } = await supabase
          .from('profiles')
          .update({ 
            memoir_data: validatedData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select();
        
        if (error) {
          console.error(`Error updating user profile ${userId}:`, error);
          throw error;
        }
        
        return updatedData[0] || null;
      }
    } catch (error) {
      console.error('Error updating memoir data:', error);
      throw error;
    }
  }

  /**
   * Stores gaming preferences for a user
   * @param userId The user ID
   * @param games The gaming preferences data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeGamingPreferences(userId: string, games: any[], memoriaProfileId?: string): Promise<any> {
    try {
      // Get the current personal preferences (if any)
      const preferences = await this.getPersonalPreferences(userId, memoriaProfileId);
      
      // Update with new gaming preferences
      const updatedPreferences = {
        ...preferences,
        gaming_preferences: games
      };
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        const result = await this.updateMemoirData(
          userId,
          { preferences: { personal: updatedPreferences } },
          memoriaProfileId
        );
        
        return updatedPreferences;
      } else {
        const result = await this.updateMemoirData(
          userId,
          { preferences: { personal: updatedPreferences } }
        );
        
        return updatedPreferences;
      }
    } catch (error) {
      console.error('Error storing gaming preferences:', error);
      throw error;
    }
  }

  /**
   * Stores personal preferences for a user
   * @param userId The user ID
   * @param preferences The personal preferences data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storePersonalPreferences(userId: string, preferences: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate preferences data
      const validatedPrefs = validatePersonalPreferences(preferences);
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        console.log(`Storing personal preferences for Memoria profile ${memoriaProfileId}`);
        const result = await this.updateMemoirData(
          userId,
          { preferences: { personal: validatedPrefs } },
          memoriaProfileId
        );
        
        return validatedPrefs;
      } else {
        console.log(`Storing personal preferences for user ${userId}`);
        const result = await this.updateMemoirData(
          userId,
          { preferences: { personal: validatedPrefs } }
        );
        
        return validatedPrefs;
      }
    } catch (error) {
      console.error('Error storing personal preferences:', error);
      throw error;
    }
  }

  /**
   * Gets personal preferences for a user
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The personal preferences data
   */
  static async getPersonalPreferences(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }
        
        return data?.profile_data?.preferences?.personal || null;
      } else {
        // Get user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting user profile ${userId}:`, error);
          throw error;
        }
        
        return data?.memoir_data?.preferences?.personal || null;
      }
    } catch (error) {
      console.error('Error getting personal preferences:', error);
      throw error;
    }
  }

  /**
   * Gets a user's memoir profile
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The memoir profile data
   */
  static async getMemoirProfile(userId: string, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Get Memoria profile
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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting user profile ${userId}:`, error);
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
   * Gets Memoria profiles for a user
   * @param userId The user ID
   * @returns The Memoria profiles
   */
  static async getMemoriaProfiles(userId: string): Promise<MemoriaProfile[]> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error getting Memoria profiles for user ${userId}:`, error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Creates a new Memoria profile
   * @param userId The user ID
   * @param name The profile name
   * @param relationship Optional relationship
   * @param description Optional description
   * @param birthDate Optional birth date
   * @param deathDate Optional death date
   * @param isCelebrity Optional is celebrity flag
   * @returns The created Memoria profile
   */
  static async createMemoriaProfile(
    userId: string,
    name: string,
    relationship?: string,
    description?: string,
    birthDate?: string,
    deathDate?: string,
    isCelebrity?: boolean
  ): Promise<MemoriaProfile> {
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
        .select();
      
      if (error) {
        console.error(`Error creating Memoria profile for user ${userId}:`, error);
        throw error;
      }
      
      return data[0] as MemoriaProfile;
    } catch (error) {
      console.error('Error creating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Updates a Memoria profile
   * @param profileId The profile ID
   * @param updateData The data to update
   * @returns The updated Memoria profile
   */
  static async updateMemoriaProfile(
    profileId: string,
    updateData: Partial<MemoriaProfile>
  ): Promise<MemoriaProfile> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId)
        .select();
      
      if (error) {
        console.error(`Error updating Memoria profile ${profileId}:`, error);
        throw error;
      }
      
      return data[0] as MemoriaProfile;
    } catch (error) {
      console.error('Error updating Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Deletes a Memoria profile
   * @param profileId The profile ID
   * @returns True if successful
   */
  static async deleteMemoriaProfile(profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('memoria_profiles')
        .delete()
        .eq('id', profileId);
      
      if (error) {
        console.error(`Error deleting Memoria profile ${profileId}:`, error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting Memoria profile:', error);
      throw error;
    }
  }

  /**
   * Sets the visibility of a profile (public or private)
   * @param userId The user ID
   * @param isPublic Whether the profile should be public
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile
   */
  static async setProfileVisibility(userId: string, isPublic: boolean, memoriaProfileId?: string): Promise<any> {
    try {
      if (memoriaProfileId) {
        // Update Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .update({ 
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .select();
          
        if (error) {
          throw error;
        }
        
        return data[0];
      } else {
        // Update user profile
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select();
          
        if (error) {
          throw error;
        }
        
        return data[0];
      }
    } catch (error) {
      console.error('Error setting profile visibility:', error);
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
        // Fix the query formatting for proper JSONB and array syntax
        query = query.or(`metadata->>memoriaProfileId.eq.'${memoriaProfileId}',and(metadata->>memoriaProfileId.is.null,tags.cs.'{"memoria:${memoriaProfileId}"}')`);
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
   * Creates a gallery item
   * @param itemData The gallery item data
   * @param memoriaProfileId Optional Memoria profile ID (for logging only)
   * @returns The created gallery item
   */
  static async createGalleryItem(itemData: any, memoriaProfileId?: string): Promise<any> {
    try {
      console.log(`Creating gallery item${memoriaProfileId ? ` for Memoria profile ${memoriaProfileId}` : ''}`);
      
      const { data, error } = await supabase
        .from('gallery_items')
        .insert([itemData])
        .select();
      
      if (error) {
        console.error('Error creating gallery item:', error);
        throw error;
      }
      
      console.log('Gallery item created successfully:', data[0].id);
      
      return data[0];
    } catch (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }
  }

  /**
   * Deletes a gallery item
   * @param itemId The gallery item ID
   * @returns True if successful
   */
  static async deleteGalleryItem(itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        console.error(`Error deleting gallery item ${itemId}:`, error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  /**
   * Uploads a file to the gallery bucket
   * @param userId The user ID
   * @param file The file to upload
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The file path
   */
  static async uploadGalleryFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      console.log(`Uploading gallery file for user ${userId}${memoriaProfileId ? ` and Memoria profile ${memoriaProfileId}` : ''}`);
      
      // Create a unique file name to avoid collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileExtension = file.name.split('.').pop();
      
      // Create a storage path - if memoriaProfileId is provided, include it in the path
      const storagePath = memoriaProfileId
        ? `${userId}/${memoriaProfileId}/${timestamp}-${randomString}.${fileExtension}`
        : `${userId}/${timestamp}-${randomString}.${fileExtension}`;
      
      const { data, error } = await supabase.storage
        .from('gallery')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || this.getMimeTypeFromFile(file)
        });
      
      if (error) {
        console.error('Error uploading gallery file:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(data.path);
      
      console.log('Gallery file uploaded successfully:', urlData.publicUrl);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading gallery file:', error);
      throw error;
    }
  }

  /**
   * Uploads a document file
   * @param userId The user ID
   * @param file The file to upload
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The file path
   */
  static async uploadDocumentFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      console.log(`Uploading document file for user ${userId}${memoriaProfileId ? ` and Memoria profile ${memoriaProfileId}` : ''}`);
      
      // Create a unique file name to avoid collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
      
      // Create a storage path - if memoriaProfileId is provided, include it in the path
      const storagePath = memoriaProfileId
        ? `${userId}/${memoriaProfileId}/${timestamp}-${randomString}-${fileName}`
        : `${userId}/${timestamp}-${randomString}-${fileName}`;
      
      console.log('Uploading document to path:', storagePath);
      console.log('File details:', {
        name: file.name,
        type: file.type || this.getMimeTypeFromFile(file),
        size: file.size
      });
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || this.getMimeTypeFromFile(file)
        });
      
      if (error) {
        console.error('Error uploading document file:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);
      
      console.log('Document file uploaded successfully:', urlData.publicUrl);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading document file:', error);
      throw error;
    }
  }

  /**
   * Uploads a 3D model file
   * @param userId The user ID
   * @param file The file to upload
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The file path
   */
  static async upload3DModelFile(userId: string, file: File, memoriaProfileId?: string): Promise<string> {
    try {
      console.log(`Uploading 3D model file for user ${userId}${memoriaProfileId ? ` and Memoria profile ${memoriaProfileId}` : ''}`);
      
      // Create a unique file name to avoid collisions
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
      
      // Create a storage path - if memoriaProfileId is provided, include it in the path
      const storagePath = memoriaProfileId
        ? `${userId}/${memoriaProfileId}/${timestamp}-${randomString}-${fileName}`
        : `${userId}/${timestamp}-${randomString}-${fileName}`;
      
      console.log('Uploading 3D model to path:', storagePath);
      console.log('File details:', {
        name: file.name,
        type: file.type || this.getMimeTypeFromFile(file),
        size: file.size
      });
      
      const { data, error } = await supabase.storage
        .from('models')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || this.getMimeTypeFromFile(file)
        });
      
      if (error) {
        console.error('Error uploading 3D model file:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('models')
        .getPublicUrl(data.path);
      
      console.log('3D model file uploaded successfully:', urlData.publicUrl);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
      throw error;
    }
  }

  /**
   * Stores narratives data for a user
   * @param userId The user ID
   * @param narratives The narratives data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeNarratives(userId: string, narratives: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate narratives data
      const validatedNarratives = validateNarrativesData(narratives);
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        const result = await this.updateMemoirData(
          userId,
          { narratives: validatedNarratives },
          memoriaProfileId
        );
        
        return validatedNarratives;
      } else {
        const result = await this.updateMemoirData(
          userId,
          { narratives: validatedNarratives }
        );
        
        return validatedNarratives;
      }
    } catch (error) {
      console.error('Error storing narratives:', error);
      throw error;
    }
  }

  /**
   * Stores family tree data for a user
   * @param userId The user ID
   * @param familyTreeData The family tree data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeFamilyTreeData(userId: string, familyTreeData: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate family tree data
      const validatedData = validateFamilyTreeData(familyTreeData);
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        const result = await this.updateMemoirData(
          userId,
          { family_tree: validatedData },
          memoriaProfileId
        );
        
        return validatedData;
      } else {
        const result = await this.updateMemoirData(
          userId,
          { family_tree: validatedData }
        );
        
        return validatedData;
      }
    } catch (error) {
      console.error('Error storing family tree data:', error);
      throw error;
    }
  }

  /**
   * Gets media links for a user
   * @param userId The user ID
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The media links
   */
  static async getMediaLinks(userId: string, memoriaProfileId?: string): Promise<any[]> {
    try {
      // Try to get from memoir_data or profile_data
      if (memoriaProfileId) {
        // Get Memoria profile
        const { data, error } = await supabase
          .from('memoria_profiles')
          .select('profile_data')
          .eq('id', memoriaProfileId)
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting Memoria profile ${memoriaProfileId}:`, error);
          throw error;
        }
        
        return data?.profile_data?.media_links || [];
      } else {
        // Get user profile
        const { data, error } = await supabase
          .from('profiles')
          .select('memoir_data')
          .eq('user_id', userId)
          .single();
        
        if (error) {
          console.error(`Error getting user profile ${userId}:`, error);
          throw error;
        }
        
        return data?.memoir_data?.media_links || [];
      }
    } catch (error) {
      console.error('Error getting media links:', error);
      throw error;
    }
  }

  /**
   * Stores media links for a user
   * @param userId The user ID
   * @param mediaLinks The media links data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storeMediaLinks(userId: string, mediaLinks: any[], memoriaProfileId?: string): Promise<any> {
    try {
      // Validate media links data
      const validatedMediaLinks = validateMediaLinks(mediaLinks);
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        const result = await this.updateMemoirData(
          userId,
          { media_links: validatedMediaLinks },
          memoriaProfileId
        );
        
        return validatedMediaLinks;
      } else {
        const result = await this.updateMemoirData(
          userId,
          { media_links: validatedMediaLinks }
        );
        
        return validatedMediaLinks;
      }
    } catch (error) {
      console.error('Error storing media links:', error);
      throw error;
    }
  }

  /**
   * Stores personality test results for a user
   * @param userId The user ID
   * @param testData The personality test data
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The updated profile data
   */
  static async storePersonalityTestResults(userId: string, testData: any, memoriaProfileId?: string): Promise<any> {
    try {
      // Validate test data
      const validatedTestData = validatePersonalityTestData(testData);
      
      // Store in memoir_data or profile_data
      if (memoriaProfileId) {
        const result = await this.updateMemoirData(
          userId,
          { personality_test: validatedTestData },
          memoriaProfileId
        );
        
        return validatedTestData;
      } else {
        const result = await this.updateMemoirData(
          userId,
          { personality_test: validatedTestData }
        );
        
        return validatedTestData;
      }
    } catch (error) {
      console.error('Error storing personality test results:', error);
      throw error;
    }
  }

  /**
   * Gets public Memoria profiles
   * @returns Public Memoria profiles
   */
  static async getPublicMemoriaProfiles(): Promise<MemoriaProfile[]> {
    try {
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting public Memoria profiles:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting public Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Gets public Memoir profiles
   * @returns Public Memoir profiles
   */
  static async getPublicMemoirProfiles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting public Memoir profiles:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting public Memoir profiles:', error);
      throw error;
    }
  }

  /**
   * Gets user's favorite profiles
   * @param userId The user ID
   * @returns Favorite profiles
   */
  static async getFavoriteProfiles(userId: string): Promise<{memoir: any[], memoria: MemoriaProfile[]}> {
    try {
      console.log(`Getting favorite profiles for user ${userId}`);
      
      // Get all favorites for this user
      const { data: favoriteData, error: favoriteError } = await supabase
        .from('profile_favorites')
        .select('profile_id, profile_type')
        .eq('user_id', userId);
      
      if (favoriteError) {
        console.error(`Error getting favorites for user ${userId}:`, favoriteError);
        throw favoriteError;
      }
      
      // Separate IDs by type
      const memoirIds = favoriteData
        .filter(fav => fav.profile_type === 'memoir')
        .map(fav => fav.profile_id);
      
      const memoriaIds = favoriteData
        .filter(fav => fav.profile_type === 'memoria')
        .map(fav => fav.profile_id);
      
      console.log(`Found ${memoirIds.length} memoir favorites and ${memoriaIds.length} memoria favorites`);
      
      // Get actual profile data
      const memoirProfiles = memoirIds.length > 0
        ? await this.getMemoirProfiles(memoirIds)
        : [];
      
      const memoriaProfiles = memoriaIds.length > 0
        ? await this.getMemoriaProfilesByIds(memoriaIds)
        : [];
      
      return {
        memoir: memoirProfiles,
        memoria: memoriaProfiles
      };
    } catch (error) {
      console.error('Error getting favorite profiles:', error);
      throw error;
    }
  }

  /**
   * Gets Memoir profiles by IDs
   * @param profileIds The profile IDs
   * @returns The profiles
   */
  static async getMemoirProfiles(profileIds: string[]): Promise<any[]> {
    try {
      if (profileIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);
      
      if (error) {
        console.error('Error getting Memoir profiles:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting Memoir profiles:', error);
      throw error;
    }
  }

  /**
   * Gets Memoria profiles by IDs (renamed to resolve function overloading)
   * @param profileIds The profile IDs
   * @returns The profiles
   */
  static async getMemoriaProfilesByIds(profileIds: string[]): Promise<MemoriaProfile[]> {
    try {
      if (profileIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('memoria_profiles')
        .select('*')
        .in('id', profileIds);
      
      if (error) {
        console.error('Error getting Memoria profiles:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting Memoria profiles:', error);
      throw error;
    }
  }

  /**
   * Adds a profile to favorites
   * @param userId The user ID
   * @param profileId The profile ID to add
   * @param profileType The profile type ('memoir' or 'memoria')
   * @returns The created favorite
   */
  static async addProfileToFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<any> {
    try {
      console.log(`Adding ${profileType} profile ${profileId} to favorites for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profile_favorites')
        .insert([
          {
            user_id: userId,
            profile_id: profileId,
            profile_type: profileType
          }
        ])
        .select();
      
      if (error) {
        console.error('Error adding profile to favorites:', error);
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error adding profile to favorites:', error);
      throw error;
    }
  }

  /**
   * Removes a profile from favorites
   * @param userId The user ID
   * @param profileId The profile ID to remove
   * @param profileType The profile type ('memoir' or 'memoria')
   * @returns True if successful
   */
  static async removeProfileFromFavorites(userId: string, profileId: string, profileType: 'memoir' | 'memoria'): Promise<boolean> {
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
      
      return true;
    } catch (error) {
      console.error('Error removing profile from favorites:', error);
      throw error;
    }
  }

  /**
   * Attempts to recover data from a failed request
   * This is a fallback method that tries to extract data from error responses
   * @param userId The user ID
   * @param dataType The type of data to recover
   * @param memoriaProfileId Optional Memoria profile ID
   * @returns The recovered data, if any
   */
  static async recoverData(userId: string, dataType: string, memoriaProfileId?: string): Promise<any> {
    console.log(`Attempting to recover ${dataType} for user ${userId}${memoriaProfileId ? ` and Memoria profile ${memoriaProfileId}` : ''}`);
    
    try {
      // Get the full profile
      const profile = await this.getMemoirProfile(userId, memoriaProfileId);
      
      // Figure out which data structure to use
      const dataObject = memoriaProfileId ? profile?.profile_data : profile?.memoir_data;
      
      if (!dataObject) {
        console.log('No data object found, cannot recover data');
        return null;
      }
      
      // Parse the dataType path (e.g., 'preferences.personal' -> ['preferences', 'personal'])
      const pathParts = dataType.split('.');
      
      // Navigate through the object to get the data
      let data = dataObject;
      for (const part of pathParts) {
        if (!data[part]) {
          console.log(`No data found at path ${part}`);
          return null;
        }
        data = data[part];
      }
      
      console.log(`Recovered data for ${dataType}:`, data);
      return data;
    } catch (error) {
      console.error(`Error recovering ${dataType}:`, error);
      return null;
    }
  }
}