import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  // Create a Supabase client for server-side authentication
  const supabase = createServerSupabaseClient({ req, res });
  
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = session.user;

  // Check if user is an admin or super admin
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('admin_list')
    .select('role')
    .eq('email', user.email)
    .maybeSingle();
    
  if (adminError || !adminData || !['admin', 'super_admin'].includes(adminData.role)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }

  try {
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
      
      // Update the nomination
      const updateData = {
        status,
        admin_note: reason || null,
        updated_at: new Date().toISOString(),
        reviewed_by: user.email
      };
      
      const { data: updatedNomination, error: updateError } = await supabaseAdmin
        .from('award_nominations')
        .update(updateData)
        .eq('id', nominationId)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating nomination status:', updateError);
        return res.status(500).json({ error: 'Failed to update nomination status' });
      }
      
      return res.status(200).json(updatedNomination);
    } 
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in nominations review API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
