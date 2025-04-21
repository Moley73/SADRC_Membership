import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Regular client for normal operations (uses RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Service role client for admin operations (bypasses RLS)
// IMPORTANT: This should only be used for admin operations on the server side
// Never expose this client to the client side
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

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
