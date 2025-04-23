// CORS headers configuration for API routes
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Consider restricting this to your specific domains
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
};

// Helper function to handle CORS preflight requests and apply CORS headers
export function handleCors(req, res) {
  // Apply CORS headers to all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indicates that the request has been handled
  }
  
  return false; // Continue with normal request handling
}
