import { AwardsService } from '../../../lib/awardsService';
import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check if token exists
    if (!token) {
      console.error('No token provided in Authorization header');
      return res.status(401).json({ error: 'No authentication token provided' });
    }
    
    // Verify token and get user
    let user;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('Token validation error:', error);
        return res.status(401).json({ error: 'Invalid authentication token', details: error.message });
      }
      
      user = data.user;
      
      if (!user) {
        console.error('No user found with provided token');
        return res.status(401).json({ error: 'User not found with provided token' });
      }
      
      console.log('Authenticated user:', user.email);
    } catch (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ error: 'Authentication failed', details: authError.message });
    }

    // Check if user is an admin
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_list')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
        
      if (adminError) {
        console.error('Error checking admin status:', adminError);
        return res.status(500).json({ error: 'Failed to verify admin status', details: adminError.message });
      }
      
      if (!adminData) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }
      
      // Only super_admin can modify settings
      if (adminData.role !== 'super_admin' && req.method !== 'GET') {
        return res.status(403).json({ error: 'Forbidden - Super Admin access required for this operation' });
      }
      
      console.log('Admin role verified:', adminData.role);
    } catch (roleError) {
      console.error('Role verification error:', roleError);
      return res.status(500).json({ error: 'Error verifying user role', details: roleError.message });
    }

    // Process the request based on the method
    if (req.method === 'GET') {
      // Get award settings
      try {
        const settings = await AwardsService.getSettings();
        return res.status(200).json(settings);
      } catch (error) {
        console.error('Error getting settings:', error);
        return res.status(500).json({ error: 'Failed to retrieve settings', details: error.message });
      }
    } else if (req.method === 'PUT') {
      // Log the request body for debugging
      console.log('Received settings update request:', JSON.stringify(req.body, null, 2));
      
      // Ensure required fields are present
      if (!req.body.id) {
        return res.status(400).json({ error: 'Settings ID is required' });
      }
      
      // Validate date fields
      const dateFields = ['nomination_start_date', 'nomination_end_date', 'voting_start_date', 'voting_end_date'];
      for (const field of dateFields) {
        if (req.body[field] && !(new Date(req.body[field]).getTime())) {
          return res.status(400).json({ error: `Invalid date format for ${field}` });
        }
      }
      
      // Update award settings with data validation
      try {
        const updatedSettings = await AwardsService.updateSettings(req.body);
        console.log('Settings updated successfully:', JSON.stringify(updatedSettings, null, 2));
        return res.status(200).json(updatedSettings);
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Failed to update settings', details: error.message });
      }
    } else if (req.method === 'PATCH') {
      // Change phase
      const { phase, settingsId } = req.body;
      if (!phase || !settingsId) {
        return res.status(400).json({ error: 'Phase and settings ID are required' });
      }
      
      try {
        const updatedSettings = await AwardsService.changePhase(phase, settingsId);
        return res.status(200).json(updatedSettings);
      } catch (error) {
        console.error('Error changing phase:', error);
        return res.status(500).json({ error: 'Failed to change phase', details: error.message });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in award settings API:', error.message, error.stack);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
