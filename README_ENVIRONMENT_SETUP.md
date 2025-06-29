# Environment Variables Setup for MEMOIR Integrations

## Required API Keys

Add the following environment variables to your `.env` file:

```env
# ElevenLabs API Key
# Get this from: https://elevenlabs.io/app/subscription
# Use code: WORLDSLARGESTHACKATHON-0bb0fa21 for 3 months Creator Tier free
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Google Gemini API Key
# Get this from: https://makersuite.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Your existing Supabase variables should already be set:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Before running any npm scripts make sure to install dependencies:

```bash
npm install
```

## Setup Instructions

1. **ElevenLabs Setup:**
   - Visit https://elevenlabs.io/app/subscription
   - Select the Creator Tier
   - Enter code `WORLDSLARGESTHACKATHON-0bb0fa21` at checkout
   - Get 3 months free (100k credits/month, pro voice cloning, 192 kbps audio)
   - Copy your API key to the environment variable

2. **Google Gemini Setup:**
   - Visit https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key to the environment variable

## Database Migration

The database schema has been updated to support these integrations. Run the migration by:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/add_memoir_integration_columns.sql`

## Integration Features Enabled

- **ElevenLabs Voice Cloning:** Users can clone their voice for AI voice synthesis
- **Gemini AI Narratives:** AI-powered processing of user stories and memories
- **Digital Asset Management:** Store and organize photos, videos, music playlists
- **Social Media Integration:** Import data from Facebook, Instagram, etc.
- **Location Memories:** Integration with Google Maps saved places

## Next Steps

After setting up these environment variables and running the migration:

1. Test the integrations in the MEMOIR dashboard
2. Implement the affiliate link system for seamless user experience
3. Add direct upload capabilities for processed content
4. Integrate with additional AI content generation services