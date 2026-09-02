import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create a standard client with the user's session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sadrc-membership-auth',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        return JSON.parse(window.localStorage.getItem(key));
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      },
    },
  }
});

// Create a service role client for admin operations
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to get the current session token
export const getAuthToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to check if user is logged in
export const isLoggedIn = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

// Helper function to check if user is admin
export const isAdmin = async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return false;
    
    const { data } = await supabase
      .from('admin_list')
      .select('role')
      .eq('email', sessionData.session.user.email)
      .maybeSingle();
      
    return !!data;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Force a session refresh
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data?.session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
};

// Helper function to safely use the admin client
export const withServiceRole = async (operation) => {
  if (!supabaseAdmin) {
    console.error('Service role key not available. Falling back to regular client.');
    return operation(supabase);
  }
  
  try {
    return await operation(supabaseAdmin);
  } catch (error) {
    console.error('Error using service role client:', error);
    // Fallback to regular client if service role fails
    return operation(supabase);
  }
};

// Add a custom error handler for auth errors
export const handleAuthError = (error) => {
  if (error?.name === 'AuthSessionMissingError') {
    console.log('Session missing, redirecting to login');
    // Clear any local storage items that might be causing issues
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sadrc-membership-auth');
      localStorage.removeItem('supabase.auth.token');
    }
    return true; // Indicates this was an auth error that was handled
  }
  return false; // Not handled
};

// Helper to safely get the current session
export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      handleAuthError(error);
      return { session: null, user: null };
    }
    return { 
      session: data?.session || null,
      user: data?.session?.user || null
    };
  } catch (err) {
    console.error('Unexpected error getting session:', err);
    handleAuthError(err);
    return { session: null, user: null };
  }
};

// Debug function to log auth state and session details
export const debugAuthState = async (customClient = supabase) => {
  try {
    const { data: sessionData, error: sessionError } = await customClient.auth.getSession();
    const { data: userData, error: userError } = await customClient.auth.getUser();
    
    console.log('====== AUTH DEBUG INFO ======');
    console.log('Session exists:', !!sessionData?.session);
    console.log('JWT exists:', !!sessionData?.session?.access_token);
    console.log('User exists:', !!userData?.user);
    
    if (userData?.user) {
      console.log('User email:', userData.user.email);
      console.log('User ID:', userData.user.id);
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }
    
    if (userError) {
      console.error('User error:', userError);
    }
    
    return {
      hasSession: !!sessionData?.session,
      hasUser: !!userData?.user,
      userEmail: userData?.user?.email,
      userId: userData?.user?.id,
      sessionError,
      userError
    };
  } catch (err) {
    console.error('Error in debugAuthState:', err);
    return {
      hasSession: false,
      hasUser: false,
      error: err.message
    };
  }
};

// Debug function to test RLS permissions on specific tables
export const testTableAccess = async (customClient = supabase, tableName, email = null) => {
  try {
    const client = customClient || supabase;
    const query = client.from(tableName).select('*');
    
    // If email provided, try to filter by it
    if (email) {
      query.ilike('email', email);
    }
    
    // Limit to just one row for testing
    query.limit(1);
    
    // Execute with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query to ${tableName} timed out`)), 5000)
    );
    
    const { data, error } = await Promise.race([
      query,
      timeoutPromise
    ]);
    
    console.log(`==== ${tableName.toUpperCase()} ACCESS TEST ====`);
    console.log('Query successful:', !error);
    console.log('Data found:', !!data && data.length > 0);
    
    if (error) {
      console.error(`Error accessing ${tableName}:`, error);
    }
    
    return {
      success: !error,
      hasData: !!data && data.length > 0,
      data: data,
      error: error
    };
  } catch (err) {
    console.error(`Error testing access to ${tableName}:`, err);
    return {
      success: false,
      error: err.message
    };
  }
};
