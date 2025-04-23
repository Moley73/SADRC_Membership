import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    let supabase = null;
    let token = null;
    let email = null;

    // Check if email is provided in query params (fallback method)
    if (req.query.email) {
      email = req.query.email;
      console.log('Using email from query params:', email);
      // Use admin client for this case since we don't have a token
      supabase = supabaseAdmin;
    } 
    // Otherwise use token-based auth (preferred method)
    else if (authHeader && authHeader.startsWith('Bearer ')) {
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
        email = user.email;
        console.log('Authenticated user:', email);
      } else {
        console.log('Auth error or no user:', authError);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    } else {
      console.log('No authorization header or email provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // For GET requests, fetch the profile data
    if (req.method === 'GET') {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('email', email)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data || {});
      } catch (error) {
        console.error('Error in profile API:', error);
        return res.status(500).json({ error: error.message });
      }
    } 
    // For PATCH requests, update the profile data
    else if (req.method === 'PATCH') {
      try {
        const updates = req.body;
        
        if (!updates) {
          return res.status(400).json({ error: 'No update data provided' });
        }

        // Add updated_at timestamp
        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('members')
          .update(updates)
          .eq('email', email)
          .select();

        if (error) {
          console.error('Error updating profile:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data[0] || {});
      } catch (error) {
        console.error('Error in profile update API:', error);
        return res.status(500).json({ error: error.message });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
