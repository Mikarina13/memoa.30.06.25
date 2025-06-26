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
    const response = await fetch(`${TAVUS_BASE_URL}/replicas/${replicaId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch replica: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all replicas
   */
  async listReplicas(): Promise<TavusReplicaResponse[]> {
    const response = await fetch(`${TAVUS_BASE_URL}/replicas`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to list replicas: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a message to a replica to generate a video response
   */
  async sendMessage(request: TavusMessageRequest): Promise<TavusVideoResponse> {
    const response = await fetch(`${TAVUS_BASE_URL}/videos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a generated video by ID
   */
  async getVideo(videoId: string): Promise<TavusVideoResponse> {
    const response = await fetch(`${TAVUS_BASE_URL}/videos/${videoId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get video: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.listReplicas();
      return true;
    } catch (error) {
      return false;
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