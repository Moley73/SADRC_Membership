import { AwardsService } from '../../../lib/awardsService';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    if (req.method === 'GET') {
      // Get vote counts (admin only)
      const { categoryId } = req.query;
      
      // Check if user is an admin
      const { data: adminData } = await supabase
        .from('admin_list')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
        
      if (!adminData || !['admin', 'super_admin'].includes(adminData.role)) {
        return res.status(403).json({ error: 'Forbidden - Admin access required to view vote counts' });
      }
      
      const voteCounts = await AwardsService.getVoteCounts(categoryId);
      return res.status(200).json(voteCounts);
    } else if (req.method === 'POST') {
      // Cast a vote
      const { nominationId } = req.body;
      
      const vote = await AwardsService.castVote(nominationId, user.email);
      return res.status(201).json(vote);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in votes API:', error);
    return res.status(500).json({ error: error.message });
  }
}
