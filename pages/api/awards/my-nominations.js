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
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
    
    // Log the Supabase URL being used to verify environment variables are loaded
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Get the auth cookie from the request
    const authCookie = req.cookies['sb-access-token'] || req.cookies['sb:token'] || req.cookies['supabase-auth-token'];
    
    if (!authCookie) {
      console.error('No auth cookie found in request');
    } else {
      console.log('Auth cookie found:', authCookie.substring(0, 10) + '...');
    }
    
    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    
    console.log('Session check result:', session ? 'Session found' : 'No session found', 'Error:', sessionError);
    
    // If no session from cookie, try to get it from the Authorization header
    let user = session?.user;
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (!error && data?.user) {
            user = data.user;
            console.log('User found from Authorization header:', user.email);
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }
    
    // If still no user, try using admin client as fallback for development
    if (!user) {
      // For development/testing: allow admin access with specific headers
      const isDevMode = process.env.NODE_ENV === 'development';
      const devBypass = req.headers['x-dev-bypass'] === process.env.DEV_BYPASS_SECRET;
      const adminEmail = req.headers['x-admin-email'];
      
      if (isDevMode && devBypass && adminEmail) {
        console.log('Using development bypass with admin email:', adminEmail);
        user = { email: adminEmail };
      } else {
        console.error('No session or user found');
        return res.status(401).json({ error: 'Unauthorized - No session found' });
      }
    }
    
    console.log('Authenticated user:', user.email);
    
    try {
      if (req.method === 'GET') {
        // Check if award_settings table exists
        try {
          // Try to query the award_settings table
          const { data: settingsData, error: settingsCheckError } = await supabaseAdmin
            .from('award_settings')
            .select('id')
            .limit(1);
            
          // If we get a specific error about the table not existing, return a specific response
          if (settingsCheckError && 
              (settingsCheckError.code === '42P01' || 
               settingsCheckError.message.includes('relation') || 
               settingsCheckError.message.includes('does not exist'))) {
            console.log('Award tables do not exist yet');
            return res.status(503).json({ 
              error: 'Award system database tables are not yet set up',
              setupRequired: true
            });
          }
        } catch (checkError) {
          console.error('Error checking if award tables exist:', checkError);
          return res.status(503).json({ 
            error: 'Award system database tables are not yet set up',
            setupRequired: true
          });
        }
        
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
