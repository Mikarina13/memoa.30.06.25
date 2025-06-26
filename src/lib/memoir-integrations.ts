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
}