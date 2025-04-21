import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { CircularProgress, Box, Typography } from '@mui/material';

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Get current user session
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // User is logged in, redirect to home page
          router.push('/home');
        } else {
          // User is not logged in, redirect to login page
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // In case of error, redirect to login as fallback
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 4 }}>
        Redirecting...
      </Typography>
    </Box>
  );
}
