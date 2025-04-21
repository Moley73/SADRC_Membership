import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/reset-password'];
    
    // If we're on a public route, skip auth check
    if (publicRoutes.includes(router.pathname)) {
      setLoading(false);
      setAuthenticated(true);
      return;
    }
    
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Use getSession instead of getUser for more reliable auth checking
        const { data, error } = await supabase.auth.getSession();
        
        // If component unmounted during async operation, don't update state
        if (!isMounted) return;
        
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
        // If component unmounted during async operation, don't update state
        if (!isMounted) return;
        
        console.error('Auth check exception:', err);
        setAuthenticated(false);
        setLoading(false);
        router.push('/login');
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN') {
          setAuthenticated(true);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setAuthenticated(false);
          setLoading(false);
          if (!publicRoutes.includes(router.pathname)) {
            router.push('/login');
          }
        }
      }
    );

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router.pathname]);

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
