import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin, supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Initialize session variables
    let session = null;
    let user = null;
    
    // Try to get session from auth cookie
    const authCookie = req.cookies['sb-access-token'] || req.cookies['sb:token'] || req.cookies['supabase-auth-token'];
    
    if (authCookie) {
      try {
        const token = typeof authCookie === 'string' ? authCookie : JSON.parse(authCookie).access_token;
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
          console.log('User authenticated via cookie:', user.email);
        }
      } catch (e) {
        console.error('Error parsing auth cookie:', e);
      }
    }
    
    // If no session from cookie, try authorization header
    if (!user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data.user) {
          user = data.user;
          console.log('User authenticated via header:', user.email);
        } else {
          console.log('Invalid token in authorization header');
        }
      }
    }
    
    // Development bypass for testing (remove in production)
    if (!user && process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass-secret'] === process.env.DEV_BYPASS_SECRET) {
      user = { email: 'dev@example.com', id: 'dev-user-id' };
      console.log('Using development bypass authentication');
    }
    
    // If still no user, return unauthorized
    if (!user) {
      console.log('No authenticated user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is an admin or super admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_list')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
      
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return res.status(500).json({ error: 'Failed to verify admin status' });
    }
    
    if (!adminData || !['admin', 'super_admin'].includes(adminData?.role)) {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    // Handle GET request for fetching nominations
    if (req.method === 'GET') {
      // Get current award settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('award_settings')
        .select('active_year, current_phase')
        .single();
        
      if (settingsError) {
        console.error('Error fetching award settings:', settingsError);
        return res.status(500).json({ error: 'Failed to fetch award settings' });
      }
      
      // Get nominations by status
      const { status = 'pending' } = req.query;
      
      const { data: nominations, error: nominationsError } = await supabaseAdmin
        .from('award_nominations')
        .select(`
          *,
          category:award_categories(id, name, description)
        `)
        .eq('award_year', settings.active_year)
        .eq('status', status)
        .order('created_at', { ascending: false });
        
      if (nominationsError) {
        console.error('Error fetching nominations for review:', nominationsError);
        return res.status(500).json({ error: 'Failed to fetch nominations' });
      }
      
      return res.status(200).json(nominations);
    } 
    // Handle POST request for updating nomination status
    else if (req.method === 'POST') {
      // Update nomination status
      const { nominationId, status, reason } = req.body;
      
      if (!nominationId || !status) {
        return res.status(400).json({ error: 'Nomination ID and status are required' });
      }
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "approved" or "rejected"' });
      }
      
      // If rejecting, require a reason
      if (status === 'rejected' && (!reason || reason.trim().length < 5)) {
        return res.status(400).json({ error: 'A reason is required when rejecting a nomination' });
      }
      
      // First, check if the nomination exists
      const { data: nomination, error: nominationError } = await supabaseAdmin
        .from('award_nominations')
        .select('id, status')
        .eq('id', nominationId)
        .single();
        
      if (nominationError) {
        console.error('Error finding nomination:', nominationError);
        return res.status(404).json({ error: 'Nomination not found or table does not exist' });
      }
      
      if (!nomination) {
        return res.status(404).json({ error: 'Nomination not found' });
      }
      
      // Update the nomination
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        reviewed_by: user.email
      };
      
      // Only include admin_note if a reason is provided (for rejections)
      if (reason) {
        updateData.admin_note = reason;
      }
      
      console.log('Updating nomination:', nominationId, 'with data:', updateData);
      
      try {
        const { data: updatedNomination, error: updateError } = await supabaseAdmin
          .from('award_nominations')
          .update(updateData)
          .eq('id', nominationId)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating nomination status:', updateError);
          
          // If the error is related to admin_note column, try without it
          if (updateError.message && updateError.message.includes('admin_note')) {
            console.log('Retrying update without admin_note field');
            delete updateData.admin_note;
            
            const { data: retryNomination, error: retryError } = await supabaseAdmin
              .from('award_nominations')
              .update(updateData)
              .eq('id', nominationId)
              .select()
              .single();
              
            if (retryError) {
              console.error('Error in retry update:', retryError);
              return res.status(500).json({ error: 'Failed to update nomination status: ' + retryError.message });
            }
            
            return res.status(200).json(retryNomination);
          }
          
          return res.status(500).json({ error: 'Failed to update nomination status: ' + updateError.message });
        }
        
        return res.status(200).json(updatedNomination);
      } catch (error) {
        console.error('Unexpected error updating nomination:', error);
        return res.status(500).json({ error: 'Unexpected error: ' + error.message });
      }
    } 
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in nominations review API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
