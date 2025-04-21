// Test API route to verify environment variables
export default async function handler(req, res) {
  try {
    // Log environment variables (without exposing full keys)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` 
      : 'Not set';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...`
      : 'Not set';
    
    // Return masked values (for security)
    return res.status(200).json({
      supabaseUrl,
      supabaseAnonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKeyPresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Error in test-env API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
