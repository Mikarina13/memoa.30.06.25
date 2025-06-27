// ElevenLabs API integration
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Define voice settings interface
interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

interface VoiceCloneResponse {
  voice_id: string;
  name: string;
  samples: Array<{
    sample_id: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    hash: string;
  }>;
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    finetuning_requested_at?: string;
    finetuning_state?: string;
    verification_attempts?: any[];
    verification_failures?: string[];
    verification_attempts_count: number;
    slice_ids?: string[];
  };
  sharing?: any;
  high_quality_base_model_ids?: string[];
  safety_control?: string;
  voice_verification?: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_attempts_count: number;
    language?: string;
  };
  permissions?: {
    can_use_speaker_boost: boolean;
  };
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface TextToSpeechRequest {
  text: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
}

export class ElevenLabsAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'xi-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  private getFormHeaders() {
    return {
      'xi-api-key': this.apiKey,
    };
  }

  /**
   * Clone a voice using audio samples
   */
  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    const formData = new FormData();
    
    // Add files
    request.files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add metadata
    formData.append('name', request.name);
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.labels) {
      formData.append('labels', JSON.stringify(request.labels));
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all voices (including cloned ones)
   */
  async getVoices() {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get voice details by ID
   */
  async getVoice(voiceId: string) {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voice: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate speech from text using a specific voice
   */
  async textToSpeech(
    voiceId: string, 
    request: TextToSpeechRequest,
    modelId: string = 'eleven_turbo_v2'
  ): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          text: request.text,
          model_id: modelId,
          voice_settings: request.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        let errorMessage = `Text-to-speech failed: ${response.status}`;
        
        try {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
        } catch (e) {
          // If we can't parse the error text, just use the status code
        }
        
        // Add more specific error messages based on status code
        if (response.status === 401) {
          errorMessage = "Authentication failed: Invalid API key";
        } else if (response.status === 403) {
          errorMessage = "Access denied: Your API key doesn't have permission to use this voice";
        } else if (response.status === 404) {
          errorMessage = "Voice not found: The specified voice ID doesn't exist";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded: You've reached your API usage limit";
        }
        
        throw new Error(errorMessage);
      }

      return response.arrayBuffer();
    } catch (error) {
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete voice: ${response.statusText}`);
    }
  }

  /**
   * Get user subscription info
   */
  async getUserInfo() {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Isolate voice using ElevenLabs Voice Isolator
   */
  async isolateVoice(audioFile: File): Promise<ArrayBuffer> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${ELEVENLABS_BASE_URL}/audio-isolation`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voice isolation failed: ${response.status} - ${error}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Check if API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Use the voices endpoint which requires minimal permissions
      const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
        headers: this.getHeaders(),
      });
      
      if (response.ok) {
        console.log('ElevenLabs API key validation successful');
        return true;
      } else {
        console.log('ElevenLabs API key validation failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('ElevenLabs API key validation failed:', error);
      return false;
    }
  }
  
  /**
   * Get affiliate link for ElevenLabs with hackathon code
   */
  static getAffiliateLink(referralCode: string = 'memoa', promoCode: string = 'WORLDSLARGESTHACKATHON-0bb0fa21'): string {
    return `https://elevenlabs.io/app/subscription?ref=${referralCode}&code=${promoCode}`;
  }
}

// Helper function to convert audio buffer to downloadable file
export function createAudioDownload(arrayBuffer: ArrayBuffer, filename: string = 'generated-speech.mp3'): string {
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

// Helper function to play audio from array buffer
export function playAudioBuffer(arrayBuffer: ArrayBuffer): HTMLAudioElement {
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const url = URL.createObjectURL(blob);
  const audio = new HTMLAudioElement();
  audio.src = url;
  audio.play();
  
  // Cleanup URL when audio ends
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(url);
  });
  
  return audio;
}