import { supabase } from '../../../../lib/supabaseClient';

export default async function handler(req, res) {
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    if (req.method === 'GET') {
      // Get the current settings to get the active year
      const { data: settings, error: settingsError } = await supabase
        .from('award_settings')
        .select('active_year')
        .single();
        
      if (settingsError) {
        throw settingsError;
      }
      
      // Get user's votes for the active year
      const { data: votes, error: votesError } = await supabase
        .from('award_votes')
        .select('*')
        .eq('voter_email', user.email)
        .eq('award_year', settings.active_year);
        
      if (votesError) {
        throw votesError;
      }
      
      return res.status(200).json(votes || []);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in my-votes API:', error);
    return res.status(500).json({ error: error.message });
  }
}
