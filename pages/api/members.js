import { supabaseAdmin, supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user info
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
    
    const user = userData.user;
    
    // Check if user has admin rights
    const { data: adminData } = await supabase
      .from('admin_list')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
    
    const isAdmin = adminData?.role?.toLowerCase().includes('admin') || 
                    adminData?.role?.toLowerCase().includes('editor') ||
                    user.email === 'briandarrington@btinternet.com';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Not authorized. Admin access required.' });
    }
    
    // If we get here, the user is authenticated and authorized
    
    if (req.method === 'GET') {
      try {
        // Use service role to bypass RLS
        const { data, error } = await supabaseAdmin
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname', { ascending: true });
          
        if (error) throw error;
        return res.status(200).json(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
        return res.status(500).json({ error: error.message });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in members API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
