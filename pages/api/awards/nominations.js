import { createClient } from '@supabase/supabase-js';
import { AwardsService } from '../../../lib/awardsService';
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
    
    if (sessionError) {
      console.error('Auth error:', sessionError);
      return res.status(401).json({ error: 'Authentication error' });
    }
    
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
      // Check if award tables exist before proceeding
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
      
      if (req.method === 'GET') {
        // Get current award settings to get the active year
        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('award_settings')
          .select('active_year, current_phase')
          .single();
          
        if (settingsError) {
          console.error('Error fetching award settings:', settingsError);
          return res.status(500).json({ error: 'Failed to fetch award settings' });
        }
        
        // Check for category ID in query params
        const { categoryId, status } = req.query;
        
        let nominations;
        
        if (categoryId) {
          // Get nominations for a specific category
          const { data, error } = await supabaseAdmin
            .from('award_nominations')
            .select(`
              *,
              category:award_categories(name, description)
            `)
            .eq('category_id', categoryId)
            .eq('award_year', settings.active_year)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Error fetching category nominations:', error);
            return res.status(500).json({ error: 'Failed to fetch nominations' });
          }
          
          nominations = data;
        } else {
          // Check if user is an admin for getting all nominations
          const { data: adminData } = await supabase
            .from('admin_list')
            .select('role')
            .eq('email', user.email)
            .maybeSingle();
            
          if (!adminData || !['admin', 'super_admin'].includes(adminData.role)) {
            return res.status(403).json({ error: 'Forbidden - Admin access required to view all nominations' });
          }
          
          // Get all nominations for admins
          const { data, error } = await supabaseAdmin
            .from('award_nominations')
            .select(`
              *,
              category:award_categories(name, description)
            `)
            .eq('award_year', settings.active_year)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Error fetching all nominations:', error);
            return res.status(500).json({ error: 'Failed to fetch nominations' });
          }
          
          nominations = data;
        }
        
        return res.status(200).json(nominations);
      } else if (req.method === 'POST') {
        // Create a new nomination
        const { category_id, nominee_email, reason } = req.body;
        
        // Validate required fields
        if (!category_id) {
          return res.status(400).json({ error: 'Category ID is required' });
        }
        
        if (!nominee_email) {
          return res.status(400).json({ error: 'Nominee email is required' });
        }
        
        if (!reason || reason.trim().length < 10) {
          return res.status(400).json({ error: 'A detailed reason (at least 10 characters) is required' });
        }
        
        // Get current award settings
        const { data: settings, error: settingsError } = await supabaseAdmin
          .from('award_settings')
          .select('active_year, current_phase')
          .single();
          
        if (settingsError) {
          console.error('Error fetching award settings:', settingsError);
          return res.status(500).json({ error: 'Failed to fetch award settings' });
        }
        
        // Check if nominations are open
        if (settings.current_phase !== 'nomination') {
          return res.status(403).json({ error: 'Nominations are currently closed' });
        }
        
        // Check if category exists
        const { data: categoryData, error: categoryError } = await supabaseAdmin
          .from('award_categories')
          .select('id')
          .eq('id', category_id)
          .single();
          
        if (categoryError || !categoryData) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        
        // Check if user has already nominated for this category
        const { data: existingNomination, error: existingError } = await supabaseAdmin
          .from('award_nominations')
          .select('id')
          .eq('nominator_email', user.email)
          .eq('category_id', category_id)
          .eq('award_year', settings.active_year)
          .single();
          
        if (existingNomination) {
          return res.status(400).json({ error: 'You have already made a nomination for this category' });
        }
        
        // Create the nomination
        const nomination = {
          category_id,
          nominee_email,
          reason,
          nominator_email: user.email,
          status: 'pending',
          award_year: settings.active_year,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: newNomination, error: createError } = await supabaseAdmin
          .from('award_nominations')
          .insert(nomination)
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating nomination:', createError);
          return res.status(500).json({ error: 'Failed to create nomination' });
        }
        
        return res.status(201).json(newNomination);
      } else if (req.method === 'PATCH') {
        // Update nomination status (admin only)
        const { nominationId, status } = req.body;
        
        // Check if user is an admin
        const { data: adminData } = await supabase
          .from('admin_list')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();
          
        if (!adminData || !['admin', 'super_admin'].includes(adminData.role)) {
          return res.status(403).json({ error: 'Forbidden - Admin access required to update nomination status' });
        }
        
        // Update nomination status
        const { data: updatedNomination, error: updateError } = await supabaseAdmin
          .from('award_nominations')
          .update({ 
            status, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', nominationId)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating nomination:', updateError);
          return res.status(500).json({ error: 'Failed to update nomination' });
        }
        
        return res.status(200).json(updatedNomination);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (error) {
      console.error('Error in nominations API:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  } catch (error) {
    console.error('Error in authentication:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
