import { supabaseAdmin, supabase } from '../../../lib/supabaseClient';

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
    
    // Check if user is a super admin (using regular client with RLS)
    const { data: adminData } = await supabase
      .from('admin_list')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
    
    // Always allow the hardcoded super admin
    const isSuperAdmin = adminData?.role?.toLowerCase().includes('super') || 
                        user.email === 'briandarrington@btinternet.com';
    
    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Not authorized. Super admin access required.' });
    }
    
    // If we get here, the user is authenticated and authorized as a super admin
    
    // Handle different operations
    switch (req.method) {
      case 'GET':
        // List all admins
        try {
          const { data, error } = await supabaseAdmin
            .from('admin_list')
            .select('*')
            .order('email');
            
          if (error) throw error;
          return res.status(200).json(data || []);
        } catch (error) {
          console.error('Error fetching admins:', error);
          return res.status(500).json({ error: error.message });
        }
        
      case 'POST':
        // Add a new admin
        try {
          const { email, role, name } = req.body;
          
          if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
          }
          
          // Check if admin already exists
          const { data: existingAdmin } = await supabaseAdmin
            .from('admin_list')
            .select('id')
            .eq('email', email)
            .maybeSingle();
            
          if (existingAdmin) {
            return res.status(409).json({ error: 'This user is already an administrator' });
          }
          
          // Add the new admin
          const { data, error } = await supabaseAdmin
            .from('admin_list')
            .insert({
              email,
              role,
              name: name || email.split('@')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (error) throw error;
          return res.status(201).json(data);
        } catch (error) {
          console.error('Error adding admin:', error);
          return res.status(500).json({ error: error.message });
        }
        
      case 'PUT':
        // Update an admin
        try {
          const { id, role } = req.body;
          
          if (!id || !role) {
            return res.status(400).json({ error: 'ID and role are required' });
          }
          
          const { data, error } = await supabaseAdmin
            .from('admin_list')
            .update({ 
              role, 
              updated_at: new Date().toISOString() 
            })
            .eq('id', id)
            .select()
            .single();
            
          if (error) throw error;
          return res.status(200).json(data);
        } catch (error) {
          console.error('Error updating admin:', error);
          return res.status(500).json({ error: error.message });
        }
        
      case 'DELETE':
        // Delete an admin
        try {
          const { id } = req.body;
          
          if (!id) {
            return res.status(400).json({ error: 'ID is required' });
          }
          
          const { error } = await supabaseAdmin
            .from('admin_list')
            .delete()
            .eq('id', id);
            
          if (error) throw error;
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error('Error deleting admin:', error);
          return res.status(500).json({ error: error.message });
        }
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unexpected error in manage-admins API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
