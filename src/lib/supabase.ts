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

// Enhanced test connection function with better error handling
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    console.log('🔗 URL:', supabaseUrl);
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
    
    // Test database connection
    const { data: testData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (dbError) {
      console.error('❌ Database connection error:', dbError);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      console.error('🔧 This appears to be a network connectivity issue. Please check:');
      console.error('   1. Your internet connection');
      console.error('   2. That the Supabase URL is correct and accessible');
      console.error('   3. That your development server has been restarted');
    }
    return false;
  }
};

// Initialize connection test on module load
testSupabaseConnection();