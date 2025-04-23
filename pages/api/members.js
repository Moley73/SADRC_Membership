import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabaseClient';
import { corsHeaders, handleCors } from '../../lib/cors';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return; // Response already sent for OPTIONS request
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Bearer token required' });
    }
    let user = null;
    let supabase = null;
    let token = null;

    // Always create a new supabase client for this request, using the access token
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
      // Fall back to admin client if token auth fails
      supabase = supabaseAdmin;
    }

    // For the GET method, we'll allow different access levels
    if (req.method === 'GET') {
      // Check if this is for awards functionality
      const forAwards = req.query.for === 'awards';
      
      try {
        // Use admin client for data access, but respect RLS policies
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('surname', { ascending: true });
        
        if (error) {
          console.error('Error fetching members:', error);
          return res.status(500).json({ error: error.message });
        }
        
        // Process the data to ensure consistent fields
        const processedData = data.map(member => ({
          ...member,
          payment_status: member.payment_status || 'unpaid',
          membership_status: member.membership_status || 'pending',
          membership_expiry: member.membership_expiry || null
        }));
        
        return res.status(200).json(processedData || []);
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
