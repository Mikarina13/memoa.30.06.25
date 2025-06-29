import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging to console
console.log('🔍 Debug Supabase Config:');
console.log('URL:', supabaseUrl);
console.log('Anon Key exists:', !!supabaseAnonKey);
console.log('Anon Key length:', supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.log('VITE_SUPABASE_URL:', supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to check if a session error is due to missing/invalid session
export const isSessionError = (error: any) => {
  return error?.message === 'Auth session missing!' || 
         error?.message?.includes('session_not_found') ||
         error?.message?.includes('JWT expired');
};

// Helper function to check if user is authenticated
const checkAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return session.user;
  } catch (err) {
    console.error('Error checking auth:', err);
    return null;
  }
};

// Helper function to provide detailed error diagnosis
const diagnoseConnectionError = (error: any) => {
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connectivity issue detected',
      suggestions: [
        'Check your internet connection',
        'Verify the Supabase URL is accessible',
        'Ensure your Supabase project is not paused',
        'Try restarting your development server',
        'Check if you\'re behind a firewall or proxy'
      ]
    };
  }
  
  if (error?.message?.includes('CORS')) {
    return {
      type: 'CORS_ERROR', 
      message: 'CORS policy error',
      suggestions: [
        'Check your Supabase project CORS settings',
        'Verify your domain is allowed in Supabase dashboard'
      ]
    };
  }
  
  if (error?.status === 401 || error?.status === 403) {
    return {
      type: 'AUTH_ERROR',
      message: 'Authentication/authorization error',
      suggestions: [
        'Verify your Supabase anon key is correct',
        'Check if your Supabase project is active',
        'Ensure RLS policies are properly configured'
      ]
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: error?.message || 'Unknown connection error',
    suggestions: [
      'Check the browser console for more details',
      'Verify all environment variables are set correctly'
    ]
  };
};

// Enhanced test connection function with better error handling and retry logic
export const testSupabaseConnection = async (retries = 3) => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🧪 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      console.log('🔗 URL:', supabaseUrl);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
      });
      
      // Test basic connection with timeout
      const connectionPromise = supabase.auth.getSession();
      const { data, error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
      
      if (error) {
        throw error;
      }
      
      // Test database connection with a simple query
      const dbPromise = supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      const { data: testData, error: dbError } = await Promise.race([dbPromise, timeoutPromise]) as any;
        
      if (dbError) {
        throw dbError;
      }
      
      console.log('✅ Supabase connection successful!');
      return true;
    } catch (err) {
      lastError = err;
      console.error(`❌ Supabase connection attempt ${attempt} failed:`, err);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        const waitTime = attempt * 1000; // Exponential backoff
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All attempts failed, provide detailed diagnosis
  const diagnosis = diagnoseConnectionError(lastError);
  console.error('🔧 Connection diagnosis:', diagnosis.type);
  console.error('📝 Error details:', diagnosis.message);
  console.error('💡 Suggestions:');
  diagnosis.suggestions.forEach((suggestion, index) => {
    console.error(`   ${index + 1}. ${suggestion}`);
  });
  
  return false;
};

// Don't automatically test connection on module load to avoid blocking
// Let components handle testing when needed