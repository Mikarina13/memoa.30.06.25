/**
 * GeminiAPI class for interacting with Google's Gemini API
 * This class handles the communication with the Gemini API for narrative analysis
 */

interface GeminiAPIOptions {
  apiKey: string;
  apiVersion?: string;
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
  }>;
}

interface NarrativeInsights {
  personality_traits: string[];
  core_themes: string[];
  writing_style: string;
  processed_at: string;
}

export class GeminiAPI {
  private apiKey: string;
  private baseURL: string;
  private defaultOptions: {
    maxOutputTokens: number;
    temperature: number;
    topP: number;
    topK: number;
  };

  constructor(options: GeminiAPIOptions) {
    this.apiKey = options.apiKey;
    const apiVersion = options.apiVersion || 'v1beta';
    this.baseURL = `https://generativelanguage.googleapis.com/${apiVersion}/models/`;
    this.defaultOptions = {
      maxOutputTokens: options.maxOutputTokens || 1024,
      temperature: options.temperature || 0.7,
      topP: options.topP || 0.8,
      topK: options.topK || 40
    };
  }

  /**
   * Analyzes narratives using the Gemini API
   * @param narrativeText - The combined narrative text to analyze
   * @returns A promise that resolves to the analysis results
   */
  async analyzeNarratives(narrativeText: string): Promise<NarrativeInsights> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not provided. Please check your environment configuration.');
    }

    if (!narrativeText || narrativeText.trim().length === 0) {
      throw new Error('No narrative text provided for analysis.');
    }

    // Build the prompt with detailed instructions for the analysis
    const prompt = `
Analyze the following personal narratives and provide insights about the writer's personality, writing style, and core themes. The text contains personal stories, memories, reflections and values of the person.

TEXT TO ANALYZE:
${narrativeText}

Please provide your analysis in JSON format with the following structure:
{
  "personality_traits": ["trait1", "trait2", "trait3", ...], // 3-6 key personality traits evident in the writing
  "core_themes": ["theme1", "theme2", "theme3", ...], // 3-6 main themes that recur in the narratives
  "writing_style": "A paragraph describing the writing style, tone, and distinctive characteristics of the author's voice"
}

Your analysis should be insightful, respectful, and reflective of the actual content provided.
`;

    try {
      // Use the gemini-pro model which is optimized for text tasks
      const response = await fetch(
        `${this.baseURL}gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: this.defaultOptions.temperature,
              topP: this.defaultOptions.topP,
              topK: this.defaultOptions.topK,
              maxOutputTokens: this.defaultOptions.maxOutputTokens
            }
          })
        }
      );

      if (!response.ok) {
        // Handle different error status codes
        if (response.status === 400) {
          throw new Error('Invalid request to Gemini API. Check your request format.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized access to Gemini API.');
        } else if (response.status === 403) {
          throw new Error('Gemini API access forbidden. Check your API key permissions.');
        } else if (response.status === 429) {
          throw new Error('Gemini API quota exceeded. Please try again later.');
        } else if (response.status === 500) {
          throw new Error('Gemini API server error. Please try again later.');
        } else {
          throw new Error(`Gemini API request failed with status: ${response.status}`);
        }
      }

      const data = await response.json() as GeminiResponse;

      // Extract the JSON response from the text
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response - it might be wrapped in markdown code blocks
      let jsonStr = responseText;
      
      // If response is wrapped in markdown code blocks, extract just the JSON part
      const jsonMatch = responseText.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      }
      
      // Parse the JSON response
      let insights: NarrativeInsights;
      try {
        insights = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Error parsing Gemini response as JSON:", parseError);
        console.log("Raw response:", responseText);
        throw new Error('Failed to parse Gemini API response as JSON');
      }

      // Validate the response format
      if (!insights.personality_traits || !insights.core_themes || !insights.writing_style) {
        throw new Error('Gemini API response is missing required fields');
      }

      // Add processed timestamp
      insights.processed_at = new Date().toISOString();

      return insights;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Enhance the error message based on error type
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          throw new Error('Gemini API quota exceeded. Please try again later or check your API usage limits.');
        } else if (error.message.includes('API key')) {
          throw new Error('Invalid Gemini API key. Please check your API key in the environment variables.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error while connecting to Gemini API. Please check your internet connection.');
        } else {
          throw error; // Re-throw the original error
        }
      } else {
        throw new Error('Unknown error occurred while calling Gemini API');
      }
    }
  }

  /**
   * Validate if the API key is properly configured and working
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    
    try {
      // Make a simple request to test the API key
      const response = await fetch(
        `${this.baseURL}gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Hello"
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 10
            }
          })
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Error validating Gemini API key:', error);
      return false;
    }
  }
}