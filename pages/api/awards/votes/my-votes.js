import { supabase } from '../../../../lib/supabaseClient';

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
      // Get the current settings to get the active year
      const { data: settings, error: settingsError } = await supabase
        .from('award_settings')
        .select('active_year')
        .single();
        
      if (settingsError) {
        console.error('Error fetching award settings:', settingsError);
        throw new Error('Failed to fetch award settings: ' + settingsError.message);
      }
      
      // Get user's votes for the active year
      const { data: votes, error: votesError } = await supabase
        .from('award_votes')
        .select('*')
        .eq('voter_email', user.email)
        .eq('award_year', settings.active_year);
        
      if (votesError) {
        console.error('Error fetching user votes:', votesError);
        throw new Error('Failed to fetch your votes: ' + votesError.message);
      }
      
      return res.status(200).json(votes || []);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in my-votes API:', error);
    return res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
}
