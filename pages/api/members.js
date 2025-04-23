import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let supabase = null;
    let token = null;

    // Always create a new supabase client for this request, using the access token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      // Verify the token and get user info
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (!authError && userData.user) {
        user = userData.user;
        console.log('Authenticated user:', user.email);
      } else {
        console.log('Auth error or no user:', authError);
      }
    } else {
      console.log('No authorization header provided');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // For the GET method, we'll allow different access levels
    if (req.method === 'GET') {
      // Check if this is for awards functionality
      const isAwardsRequest = req.query.for === 'awards';

      // If user is authenticated and this is for awards, we'll allow access
      // without requiring admin rights
      if (user && isAwardsRequest) {
        console.log('Allowing member list access for awards functionality');
        try {
          // Use service role to bypass RLS
          const { data, error } = await supabaseAdmin
            .from('members')
            .select('id, email, first_name, surname')
            .order('surname', { ascending: true });
          if (error) throw error;
          return res.status(200).json(data || []);
        } catch (error) {
          console.error('Error fetching members for awards:', error);
          return res.status(500).json({ error: error.message });
        }
      }

      // For non-awards requests, require admin rights
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user has admin rights (using user-level supabase client)
      const { data: adminData, error: adminError } = await supabase
        .from('admin_list')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
      if (adminError) {
        console.error('Admin check error:', adminError);
        return res.status(500).json({ error: 'Error checking admin rights' });
      }
      const isAdmin = adminData?.role?.toLowerCase().includes('admin') || 
                      adminData?.role?.toLowerCase().includes('editor') ||
                      user.email === 'briandarrington@btinternet.com';
      if (!isAdmin) {
        return res.status(403).json({ error: 'Not authorized. Admin access required.' });
      }

      // If we get here, the user is authenticated and authorized
      try {
        // Use service role to bypass RLS for admin
        const { data, error } = await supabaseAdmin
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname', { ascending: true });
        if (error) throw error;
        return res.status(200).json(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        return res.status(500).json({ error: error.message });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in members API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
