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
    fetch: (url, options = {}) => {
      // Add timeout and better error handling to all requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      })
      .then(response => {
        clearTimeout(timeoutId);
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Supabase fetch error:', error);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - check your internet connection and Supabase project status');
        }
        
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error - unable to reach Supabase. Check your internet connection and verify your Supabase project is active.');
        }
        
        throw error;
      });
    }
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

// Helper function to check if error is a network error
export const isNetworkError = (error: any) => {
  return (error instanceof TypeError && 
         (error.message?.includes('Failed to fetch') || 
          error.message?.includes('Network request failed') ||
          error.message?.includes('fetch'))) ||
         error.message?.includes('timeout') ||
         error.message?.includes('Network error');
};

// Helper function to provide detailed error diagnosis
const diagnoseConnectionError = (error: any) => {
  if (isNetworkError(error)) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connectivity issue detected',
      suggestions: [
        'Check your internet connection',
        'Verify the Supabase URL is accessible',
        'Ensure your Supabase project is not paused',
        'Check your Supabase project dashboard at https://supabase.com/dashboard',
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
        'Verify your domain is allowed in Supabase dashboard',
        'Add localhost:5173 to your allowed origins'
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
  
  if (error?.message?.includes('timeout')) {
    return {
      type: 'TIMEOUT_ERROR',
      message: 'Connection timeout',
      suggestions: [
        'Your internet connection may be slow',
        'Supabase servers may be experiencing issues',
        'Try again in a few moments',
        'Check Supabase status page'
      ]
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: error?.message || 'Unknown connection error',
    suggestions: [
      'Check the browser console for more details',
      'Verify all environment variables are set correctly',
      'Try refreshing the page',
      'Contact support if the issue persists'
    ]
  };
};

// Enhanced test connection function with better error handling and retry logic
export const testSupabaseConnection = async (retries = 5) => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🧪 Testing Supabase connection (attempt ${attempt}/${retries})...`);
      console.log('🔗 URL:', supabaseUrl);
      
      // Test basic connection with longer timeout for initial connection
      const timeoutDuration = attempt === 1 ? 20000 : 10000; // First attempt gets more time
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Connection timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration);
      });
      
      // Test auth service first (simpler endpoint)
      console.log('🔐 Testing auth service...');
      const authPromise = supabase.auth.getSession();
      const { error: authError } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (authError && !isSessionError(authError)) {
        throw authError;
      }
      
      // Test database connection with a simple query (only if auth works)
      console.log('🗄️  Testing database connection...');
      const dbPromise = supabase
        .from('profiles')
        .select('count')
        .limit(1);
        
      const { error: dbError } = await Promise.race([dbPromise, timeoutPromise]) as any;
        
      if (dbError) {
        // Allow certain database errors that don't indicate connection issues
        if (dbError.code === 'PGRST116' || dbError.message?.includes('relation') || dbError.message?.includes('permission')) {
          console.log('✅ Database accessible (table/permission issue is normal)');
        } else {
          throw dbError;
        }
      }
      
      console.log('✅ Supabase connection successful!');
      return true;
    } catch (err) {
      lastError = err;
      console.error(`❌ Supabase connection attempt ${attempt} failed:`, err);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < retries) {
        const waitTime = Math.min(attempt * 2000, 10000); // Progressive backoff, max 10s
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

// Export the diagnosis function for use in components
export { diagnoseConnectionError };