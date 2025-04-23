import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, isLoggedIn, refreshSession, isAdmin } from '../lib/supabaseClient';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

export default function AuthGuard({ children, requiredRole = null }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRefreshAttempted, setSessionRefreshAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/register', '/reset-password'];
    
    // If we're on a public route, skip auth check
    if (publicRoutes.includes(router.pathname)) {
      setLoading(false);
      setAuthenticated(true);
      setAuthorized(true);
      return;
    }
    
    let isMounted = true;
    let timeoutId = null;
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.log('Auth check timed out');
        setError('Authentication check timed out. Please try refreshing the page.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    const checkAuth = async () => {
      try {
        // First check if user is logged in
        const loggedIn = await isLoggedIn();
        
        // If component unmounted during async operation, don't update state
        if (!isMounted) return;
        
        if (!loggedIn) {
          // If not logged in but we haven't tried refreshing the session yet
          if (!sessionRefreshAttempted) {
            console.log('Attempting to refresh session...');
            setSessionRefreshAttempted(true);
            const session = await refreshSession();
            
            if (session && isMounted) {
              console.log('Session refreshed successfully');
              // Continue with role check if needed
              if (requiredRole) {
                checkRole(session);
              } else {
                setAuthenticated(true);
                setAuthorized(true);
                setLoading(false);
              }
              return;
            }
          }
          
          console.log('No active session found, redirecting to login');
          setAuthenticated(false);
          setAuthorized(false);
          setLoading(false);
          
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(router.asPath);
          router.push(`/login?returnUrl=${returnUrl}`);
          return;
        }
        
        // User is authenticated, now check role if required
        setAuthenticated(true);
        
        if (requiredRole) {
          await checkRole();
        } else {
          setAuthorized(true);
        }
        
        setLoading(false);
      } catch (err) {
        // If component unmounted during async operation, don't update state
        if (!isMounted) return;
        
        console.error('Auth check exception:', err);
        setError('Authentication error. Please try logging in again.');
        setAuthenticated(false);
        setAuthorized(false);
        setLoading(false);
        
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(router.asPath);
        router.push(`/login?returnUrl=${returnUrl}`);
      } finally {
        if (timeoutId && isMounted) {
          clearTimeout(timeoutId);
        }
      }
    };
    
    const checkRole = async () => {
      try {
        // Get user session
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        
        if (!user) {
          setAuthorized(false);
          return;
        }
        
        // For super_admin role, check admin_list table
        if (requiredRole === 'super_admin' || requiredRole === 'admin') {
          const { data: adminData } = await supabase
            .from('admin_list')
            .select('role')
            .eq('email', user.email)
            .maybeSingle();
          
          // Special case for Brian's email
          const isBrianEmail = user.email.toLowerCase().includes('briandarrington') || 
                              user.email.toLowerCase().includes('btinternet.com');
          
          if (requiredRole === 'super_admin') {
            // For super_admin, role must contain "super"
            const isSuperAdmin = adminData?.role?.toLowerCase().includes('super') || isBrianEmail;
            setAuthorized(isSuperAdmin);
            
            if (!isSuperAdmin) {
              setError('You need super admin privileges to access this page.');
            }
          } else if (requiredRole === 'admin') {
            // For admin, any role in admin_list is sufficient
            setAuthorized(!!adminData || isBrianEmail);
            
            if (!adminData && !isBrianEmail) {
              setError('You need admin privileges to access this page.');
            }
          }
        } else {
          // Default to authorized if no specific role check
          setAuthorized(true);
        }
      } catch (err) {
        console.error('Role check error:', err);
        setAuthorized(false);
        setError('Error checking permission level.');
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN') {
          setAuthenticated(true);
          if (requiredRole) {
            checkRole();
          } else {
            setAuthorized(true);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setAuthenticated(false);
          setAuthorized(false);
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
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router.pathname, router.asPath, requiredRole, sessionRefreshAttempted]);

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
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please try <a href="/login" style={{ textDecoration: 'underline' }}>logging in again</a> or contact an administrator.
        </Typography>
      </Box>
    );
  }

  if (!authenticated || !authorized) {
    return null; // Router will handle redirect
  }

  return children;
}
