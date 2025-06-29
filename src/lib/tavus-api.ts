// Tavus API integration
const TAVUS_BASE_URL = 'https://api.tavus.io/v1';

interface TavusReplicaResponse {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

interface TavusVideoResponse {
  id: string;
  replica_id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  url?: string;
  created_at: string;
}

interface TavusMessageRequest {
  replica_id: string;
  persona_id?: string;
  message: string;
  callback_url?: string;
}

export class TavusAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get details about a specific replica
   */
  async getReplica(replicaId: string): Promise<TavusReplicaResponse> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/replicas/${replicaId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch replica: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network Error: Unable to connect to Tavus API. Please check your internet connection and try again.');
      }
      console.error('Error getting replica:', error);
      throw error;
    }
  }

  /**
   * List all replicas
   */
  async listReplicas(): Promise<TavusReplicaResponse[]> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list replicas: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network Error: Unable to connect to Tavus API. Please check your internet connection and try again.');
      }
      console.error('Error listing replicas:', error);
      throw error;
    }
  }

  /**
   * Send a message to a replica to generate a video response
   */
  async sendMessage(request: TavusMessageRequest): Promise<TavusVideoResponse> {
    try {
      console.log('Sending message to Tavus API:', request);
      
      const response = await fetch(`${TAVUS_BASE_URL}/videos`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network Error: Unable to connect to Tavus API. Please check your internet connection and try again.');
      }
      console.error('Error sending message to Tavus:', error);
      throw error;
    }
  }

  /**
   * Get a generated video by ID
   */
  async getVideo(videoId: string): Promise<TavusVideoResponse> {
    try {
      const response = await fetch(`${TAVUS_BASE_URL}/videos/${videoId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get video: ${response.status} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network Error: Unable to connect to Tavus API. Please check your internet connection and try again.');
      }
      console.error('Error getting video from Tavus:', error);
      throw error;
    }
  }

  /**
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to list replicas as a simple API key validation test
      await this.listReplicas();
      return true;
    } catch (error) {
      console.error('Tavus API key validation failed:', error);
      // Re-throw the error instead of returning false to provide specific error details
      throw error;
    }
  }

  /**
   * Get a conversation URL from a conversation ID
   */
  static getConversationUrl(conversationId: string): string {
    return `https://tavus.io/conversation/${conversationId}`;
  }

  /**
   * Extract a conversation ID from a URL
   */
  static extractConversationId(url: string): string | null {
    try {
      // Handle different URL formats
      if (url.includes('/conversation/')) {
        const matches = url.match(/\/conversation\/([a-zA-Z0-9]+)/);
        return matches?.[1] || null;
      }
      
      if (url.includes('tavus.daily.co/')) {
        const matches = url.match(/tavus\.daily\.co\/([a-zA-Z0-9]+)/);
        return matches?.[1] || null;
      }
      
      // If it's already just an ID
      if (/^[a-zA-Z0-9]{8,}$/.test(url)) {
        return url;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting conversation ID:', error);
      return null;
    }
  }

  /**
   * Get affiliate link for Tavus
   */
  static getAffiliateLink(referralCode: string = 'memoa'): string {
    return `https://tavus.io/?ref=${referralCode}`;
  }
}

// Helper function to convert video response to a playable URL
export function getVideoUrl(videoResponse: TavusVideoResponse): string | null {
  if (videoResponse.status === 'ready' && videoResponse.url) {
    return videoResponse.url;
  }
  return null;
}