import { supabase, supabaseAdmin } from '../../../../lib/supabaseClient';

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

    // Handle category management
    if (req.method === 'POST') {
      // Create new category
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const { data, error } = await supabaseAdmin
        .from('award_categories')
        .insert({ name, description })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json(data);
    } 
    else if (req.method === 'PUT') {
      // Update existing category
      const { id, name, description } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'Category ID and name are required' });
      }
      
      const { data, error } = await supabaseAdmin
        .from('award_categories')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data);
    } 
    else if (req.method === 'DELETE') {
      // Delete category
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }
      
      // First check if there are any existing nominations for this category
      const { data: nominations, error: checkError } = await supabaseAdmin
        .from('award_nominations')
        .select('id')
        .eq('category_id', id)
        .limit(1);
        
      if (checkError) {
        console.error('Error checking for nominations:', checkError);
        return res.status(500).json({ error: checkError.message });
      }
      
      if (nominations && nominations.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with existing nominations. Remove nominations first.'
        });
      }
      
      // No nominations, safe to delete
      const { error } = await supabaseAdmin
        .from('award_categories')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } 
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in categories management API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
