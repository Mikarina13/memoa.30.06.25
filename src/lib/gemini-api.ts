interface GeminiAnalysisResponse {
  personality_traits: string[];
  core_themes: string[];
  writing_style: string;
}

export class GeminiAPI {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private model = 'gemini-pro';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your .env file.');
    }
  }

  /**
   * Analyzes narrative text and returns insights
   */
  async analyzeNarratives(text: string): Promise<GeminiAnalysisResponse> {
    try {
      // Make sure we have text to analyze
      if (!text || text.trim().length < 10) {
        throw new Error('Not enough text to analyze. Please provide more narrative content.');
      }

      // Prepare the prompt
      const prompt = `
        Analyze the following text (personal stories, memories, reflections, and values) and extract key insights.
        Respond with a JSON object that contains three fields:
        1. "personality_traits" - an array of 3-5 personality traits evident in the writing
        2. "core_themes" - an array of 3-5 primary themes discussed in the content
        3. "writing_style" - a single concise sentence describing the author's writing style and tone

        Here is the text to analyze:
        ${text}
        
        Respond ONLY with the JSON object containing the requested fields. No introduction or explanation.
      `;

      // Prepare the API request
      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid API key or unauthorized. Please check your Gemini API key.');
        } else if (response.status === 429) {
          throw new Error('API quota exceeded. Please try again later or upgrade your Gemini API plan.');
        } else {
          throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
        }
      }

      const result = await response.json();
      
      // Extract the text from the response
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('No response received from Gemini API');
      }

      // Parse the JSON response
      try {
        // Find JSON object in response text (in case there's any extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Could not find valid JSON in response');
        }
        
        const jsonResponse = JSON.parse(jsonMatch[0]);
        
        // Ensure all required fields are present
        if (!jsonResponse.personality_traits || !Array.isArray(jsonResponse.personality_traits)) {
          jsonResponse.personality_traits = ['thoughtful', 'reflective', 'empathetic']; // Fallback
        }
        
        if (!jsonResponse.core_themes || !Array.isArray(jsonResponse.core_themes)) {
          jsonResponse.core_themes = ['family', 'growth', 'resilience']; // Fallback
        }
        
        if (!jsonResponse.writing_style || typeof jsonResponse.writing_style !== 'string') {
          jsonResponse.writing_style = 'contemplative and heartfelt'; // Fallback
        }
        
        return jsonResponse as GeminiAnalysisResponse;
      } catch (e) {
        console.error('Error parsing Gemini response:', e);
        console.log('Raw response:', responseText);
        throw new Error('Failed to parse Gemini API response. The API did not return valid JSON.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  /**
   * Check if the API key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const endpoint = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: 'Hello, testing API key validity.' }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating Gemini API key:', error);
      return false;
    }
  }
}

export default GeminiAPI;