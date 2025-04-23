import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, isLoggedIn, refreshSession, isAdmin } from '../lib/supabaseClient';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';

export default function AuthGuard({ children, requiredRole = null }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const [sessionRefreshAttempted, setSessionRefreshAttempted] = useState(false);
  const router = useRouter();

  // Helper function to check if avatar is in DOM
  const checkAvatarInDOM = () => {
    if (typeof window !== 'undefined') {
      const avatarElement = document.querySelector('.MuiAvatar-root');
      if (avatarElement) {
        console.log('Avatar detected in DOM, user is logged in');
        return true;
      }
    }
    return false;
  };

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
        
        // One final check for avatar before showing error
        if (checkAvatarInDOM()) {
          console.log('Avatar detected during timeout, proceeding with page');
          setAuthenticated(true);
          
          if (!requiredRole) {
            setAuthorized(true);
          } else {
            // Still need to check role, but at least we know user is authenticated
            checkRole();
          }
          
          setLoading(false);
          setError(null);
        } else {
          setError('Authentication check timed out. Please try refreshing the page.');
          setLoading(false);
        }
      }
    }, 5000); // Reduced from 10 seconds to 5 seconds
    
    const checkAuth = async () => {
      try {
        // First check if avatar is visible in DOM (fastest method)
        if (checkAvatarInDOM()) {
          console.log('Avatar detected in DOM, proceeding with auth check');
          setAuthenticated(true);
          
          if (requiredRole) {
            await checkRole();
          } else {
            setAuthorized(true);
          }
          
          setLoading(false);
          return;
        }
        
        // Fall back to standard auth check
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
          
          // One final check for avatar before redirecting
          if (checkAvatarInDOM()) {
            console.log('Avatar detected after session refresh failed, proceeding anyway');
            setAuthenticated(true);
            
            if (requiredRole) {
              await checkRole();
            } else {
              setAuthorized(true);
            }
            
            setLoading(false);
            return;
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
        
        // One final check for avatar before showing error
        if (checkAvatarInDOM()) {
          console.log('Avatar detected after auth error, proceeding anyway');
          setAuthenticated(true);
          
          if (requiredRole) {
            await checkRole();
          } else {
            setAuthorized(true);
          }
          
          setLoading(false);
          setError(null);
          return;
        }
        
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
          // Try to get user email from DOM if session check fails
          const avatarElement = document.querySelector('.MuiAvatar-root');
          const userEmail = avatarElement?.getAttribute('data-email');
          
          if (!userEmail) {
            setAuthorized(false);
            return;
          }
          
          // For super_admin role, check admin_list table
          if (requiredRole === 'super_admin' || requiredRole === 'admin') {
            const { data: adminData } = await supabase
              .from('admin_list')
              .select('role')
              .eq('email', userEmail)
              .maybeSingle();
            
            // Special case for Brian's email
            const isBrianEmail = userEmail.toLowerCase().includes('briandarrington') || 
                                userEmail.toLowerCase().includes('btinternet.com');
            
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
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }

  if (!authenticated || !authorized) {
    return null; // Router will handle redirect
  }

  return children;
}
