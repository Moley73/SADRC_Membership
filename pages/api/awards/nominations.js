import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { AwardsService } from '../../../lib/awardsService';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Create a Supabase client for server-side authentication with explicit env variables
    const supabase = createServerSupabaseClient({ 
      req, 
      res,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    
    // Log the Supabase URL being used to verify environment variables are loaded
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();
    
    console.log('Session:', session, 'Error:', sessionError);
    
    if (sessionError) {
      console.error('Auth error:', sessionError);
      return res.status(401).json({ error: 'Authentication error' });
    }
    
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
          return res.status(400).json({ error: 'Please provide a more detailed reason for your nomination (at least 10 characters)' });
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
