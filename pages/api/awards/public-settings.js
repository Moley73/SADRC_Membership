import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get award settings (publicly readable)
      const { data, error } = await supabase
        .from('award_settings')
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in public award settings API:', error);
    return res.status(500).json({ error: error.message });
  }
}
