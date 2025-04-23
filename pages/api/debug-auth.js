// This is a diagnostic API endpoint to help debug authentication and permission issues
// Only accessible to logged-in users and outputs detailed information about authentication and database access

import { supabase, debugAuthState, testTableAccess } from '../../lib/supabaseClient';
import { corsHeaders, handleCors } from '../../lib/cors';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return; // Response already sent for OPTIONS request
  }
  
  try {
    // First, check if the user is authenticated
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData?.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        details: authError?.message || 'No user found in session'
      });
    }

    // Get detailed auth state
    const authState = await debugAuthState();
    
    // Test access to critical tables
    const memberAccess = await testTableAccess('members', userData.user.email);
    const adminAccess = await testTableAccess('admin_list', userData.user.email);
    const userRolesAccess = await testTableAccess('user_roles', userData.user.email);
    
    // Return comprehensive debug information
    res.status(200).json({
      timestamp: new Date().toISOString(),
      authState,
      tableAccess: {
        members: memberAccess,
        admin_list: adminAccess,
        user_roles: userRolesAccess
      },
      userAgent: req.headers['user-agent'],
      // Don't include the actual JWT for security reasons,
      // but note if it exists
      hasJwt: !!authState.hasSession
    });
    
  } catch (error) {
    console.error('Error in debug-auth endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
