import { AwardsService } from '../../../lib/awardsService';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  // Check authentication using multiple methods
  let user = null;
  
  // Method 1: Check for cookie-based session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('Session check result: User found from cookie');
      user = session.user;
    } else {
      console.log('Session check result: No session found Error:', null);
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
  
  // Method 2: Check for Authorization header
  if (!user && req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (authUser && !error) {
        console.log('User found from Authorization header:', authUser.email);
        user = authUser;
      } else if (error) {
        console.error('Error validating token:', error.message);
      }
    } catch (error) {
      console.error('Error processing Authorization header:', error);
    }
  }
  
  // Return 401 if no authenticated user found
  if (!user) {
    console.log('No authenticated user found');
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }
  
  console.log('Authenticated user:', user.email);
  
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
      
      if (!nominationId) {
        return res.status(400).json({ error: 'Missing required field: nominationId' });
      }
      
      try {
        const vote = await AwardsService.castVote(nominationId, user.email);
        return res.status(201).json(vote);
      } catch (error) {
        console.error('Error casting vote:', error);
        return res.status(400).json({ error: error.message || 'Failed to cast vote' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in votes API:', error);
    return res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
}
