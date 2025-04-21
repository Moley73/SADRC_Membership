// pages/api/test-admin-auth.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Create a Supabase client with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Get the user's session from the request cookie
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', session ? 'Session found' : 'No session found');
    
    if (sessionError || !session) {
      return res.status(401).json({ 
        error: 'Unauthorized - No valid session',
        details: sessionError || 'No session found'
      });
    }

    // Get the user's email from the session
    const userEmail = session.user.email;
    
    // Check if the user is in the admin_list
    const { data: adminData, error: adminError } = await supabase
      .from('admin_list')
      .select('role')
      .eq('email', userEmail)
      .single();
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return res.status(500).json({ 
        error: 'Error checking admin status',
        details: adminError
      });
    }
    
    if (!adminData) {
      return res.status(403).json({ 
        error: 'Forbidden - Not an admin',
        userEmail
      });
    }
    
    // Return success with admin role
    return res.status(200).json({ 
      success: true, 
      message: 'Admin authenticated successfully',
      role: adminData.role,
      userEmail
    });
    
  } catch (error) {
    console.error('Server error in test-admin-auth:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
