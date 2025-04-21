import { AwardsService } from '../../../lib/awardsService';
import { supabase, supabaseAdmin } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Check if user is authenticated using regular supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is a super admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_list')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
      
    if (adminError || !adminData || adminData.role !== 'super_admin') {
      return res.status(403).json({ error: 'Forbidden - Super Admin access required' });
    }

    // Process the request based on the method
    if (req.method === 'GET') {
      // Get award settings
      const settings = await AwardsService.getSettings();
      return res.status(200).json(settings);
    } else if (req.method === 'PUT') {
      // Ensure required fields are present
      if (!req.body.id) {
        return res.status(400).json({ error: 'Settings ID is required' });
      }
      
      // Update award settings with data validation
      try {
        const updatedSettings = await AwardsService.updateSettings(req.body);
        return res.status(200).json(updatedSettings);
      } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: error.message || 'Failed to update settings' });
      }
    } else if (req.method === 'PATCH') {
      // Change phase
      const { phase, settingsId } = req.body;
      if (!phase || !settingsId) {
        return res.status(400).json({ error: 'Phase and settings ID are required' });
      }
      
      const updatedSettings = await AwardsService.changePhase(phase, settingsId);
      return res.status(200).json(updatedSettings);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in award settings API:', error.message, error.stack);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
