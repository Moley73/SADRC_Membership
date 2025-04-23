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
