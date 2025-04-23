// This is a diagnostic API endpoint to help debug authentication and permission issues
// Only accessible to logged-in users and outputs detailed information about authentication and database access

import { supabase, debugAuthState, testTableAccess } from '../../lib/supabaseClient';
import { corsHeaders, handleCors } from '../../lib/cors';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return; // Response already sent for OPTIONS request
  }
  
  try {
    // Check for token in query parameter (for direct browser access)
    const { token } = req.query;
    let customSupabase = supabase;
    let userData = null;
    
    // If token provided, create a custom client with it
    if (token) {
      customSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { 
          global: { 
            headers: { 
              Authorization: `Bearer ${token}` 
            } 
          },
          auth: {
            persistSession: false
          }
        }
      );
      
      // Try to get user with provided token
      const { data, error } = await customSupabase.auth.getUser();
      if (!error && data?.user) {
        userData = data;
        console.log('Authenticated via token param:', data.user.email);
      }
    } else {
      // Try normal session auth
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        userData = data;
      }
    }
    
    // If not authenticated through any method
    if (!userData?.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        details: 'Auth session missing',
        tip: 'Try accessing this endpoint with ?token=YOUR_JWT_TOKEN'
      });
    }

    // Get detailed auth state using the authenticated client
    const authState = await debugAuthState(customSupabase);
    
    // Test access to critical tables
    const memberAccess = await testTableAccess(customSupabase, 'members', userData.user.email);
    const adminAccess = await testTableAccess(customSupabase, 'admin_list', userData.user.email);
    const userRolesAccess = await testTableAccess(customSupabase, 'user_roles', userData.user.email);
    
    // Return comprehensive debug information
    res.status(200).json({
      timestamp: new Date().toISOString(),
      authState,
      user: {
        email: userData.user.email,
        id: userData.user.id,
        lastSignIn: userData.user.last_sign_in_at
      },
      tableAccess: {
        members: memberAccess,
        admin_list: adminAccess,
        user_roles: userRolesAccess
      },
      userAgent: req.headers['user-agent'],
      // Don't include the actual JWT for security reasons,
      // but note if it exists
      authMethod: token ? 'query_param_token' : 'session_cookie'
    });
    
  } catch (error) {
    console.error('Error in debug-auth endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
