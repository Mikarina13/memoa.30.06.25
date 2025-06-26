import { supabase } from './supabase';

export class MemoirIntegrations {
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
        // Fix the query formatting for proper array syntax
        query = query.or(`metadata->memoriaProfileId.eq.${memoriaProfileId},and(metadata->memoriaProfileId.is.null,tags.cs.{memoria:${memoriaProfileId}})`);
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
  static async getFavoriteProfiles(userId: string): Promise<any[]> {
    try {
      console.log(`Getting favorite profiles for user ${userId}`);
      
      const { data, error } = await supabase
        .from('profile_favorites')
        .select(`
          id,
          profile_id,
          profile_type,
          added_at,
          memoria_profiles (
            id,
            name,
            relationship,
            description,
            birth_date,
            death_date,
            is_celebrity,
            profile_data,
            created_at,
            updated_at,
            is_public
          )
        `)
        .eq('user_id', userId)
        .eq('profile_type', 'memoria')
        .order('added_at', { ascending: false });
      
      if (error) {
        console.error(`Error getting favorite profiles for user ${userId}:`, error);
        throw error;
      }

      console.log(`Retrieved ${data?.length || 0} favorite profiles`);
      
      return data || [];
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
}