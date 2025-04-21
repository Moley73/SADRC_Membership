import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use getSession instead of getUser for more reliable auth checking
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          // If it's just a missing session error, don't log it as an error
          if (error.name === 'AuthSessionMissingError') {
            console.log('No session found, redirecting to login');
          } else {
            console.error('Error getting user:', error);
          }
          
          setAuthenticated(false);
          setLoading(false);
          router.push('/login');
          return;
        }
        
        if (!data.session) {
          console.log('No active session found, redirecting to login');
          setAuthenticated(false);
          setLoading(false);
          router.push('/login');
          return;
        }
        
        // User is authenticated
        setAuthenticated(true);
        setLoading(false);
      } catch (err) {
        console.error('Auth check exception:', err);
        setAuthenticated(false);
        setLoading(false);
        router.push('/login');
      }
    };

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/reset-password'];
    
    if (publicRoutes.includes(router.pathname)) {
      setLoading(false);
      setAuthenticated(true);
    } else {
      checkAuth();
    }
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setAuthenticated(false);
          if (!publicRoutes.includes(router.pathname)) {
            router.push('/login');
          }
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!authenticated && !loading) {
    return null; // Router will handle redirect
  }

  return children;
}
