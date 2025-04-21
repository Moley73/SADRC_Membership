import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Create a Supabase client for server-side authentication with explicit env variables
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
    
    // Log the Supabase URL being used to verify environment variables are loaded
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    
    console.log('Session:', session, 'Error:', sessionError);
    
    if (!session || !session.user) {
      console.error('No session or user found');
      return res.status(401).json({ error: 'Unauthorized - No session found' });
    }
    
    const user = session.user;
    console.log('Authenticated user:', user.email);
    
    try {
      if (req.method === 'GET') {
        // Get current award settings to get the active year
        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('award_settings')
          .select('active_year')
          .single();
          
        if (settingsError) {
          console.error('Error fetching award settings:', settingsError);
          return res.status(500).json({ error: 'Failed to fetch award settings' });
        }
        
        // Get all nominations made by the current user for the active year
        const { data: nominations, error: nominationsError } = await supabaseAdmin
          .from('award_nominations')
          .select(`
            *,
            category:award_categories(id, name, description)
          `)
          .eq('nominator_email', user.email)
          .eq('award_year', settings.active_year)
          .order('created_at', { ascending: false });
          
        if (nominationsError) {
          console.error('Error fetching user nominations:', nominationsError);
          return res.status(500).json({ error: 'Failed to fetch your nominations' });
        }
        
        return res.status(200).json(nominations);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error in my nominations API:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } catch (error) {
    console.error('Error in my nominations API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
