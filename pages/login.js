import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { supabase, refreshSession, isLoggedIn } from '../lib/supabaseClient';
import { Container, Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import Head from 'next/head';
import { AuthContext } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login');
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionRefreshAttempted, setSessionRefreshAttempted] = useState(false);
  const router = useRouter();
  const { returnUrl, mode: urlMode } = router.query;
  const { user } = useContext(AuthContext) || {}; // Get global auth state

  // Set initial mode based on URL parameter
  useEffect(() => {
    if (urlMode === 'signup') {
      setMode('signup');
    }
  }, [urlMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate input
      if (!email || !password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }
      
      if (mode === 'login') {
        // Attempt login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          console.log('Login error:', signInError);
          setError(signInError.message || 'Failed to sign in. Please check your credentials.');
          return;
        }
        
        if (data?.session) {
          console.log('Login successful, redirecting to home or return URL');
          // Store the token in localStorage for explicit use in API calls
          localStorage.setItem('supabase-auth-token', data.session.access_token);
          
          // Force a session refresh to ensure it's properly stored
          await refreshSession();
          
          // Redirect to returnUrl if provided, otherwise to home
          const redirectTo = returnUrl || '/';
          
          // Use router.push first, but if that doesn't trigger a navigation,
          // fall back to window.location for a full page reload
          router.push(redirectTo).then(() => {
            // Set a small timeout to allow the router to complete
            setTimeout(() => {
              // If we're still on the login page after the router.push, force a reload
              if (window.location.pathname.includes('/login')) {
                console.log('Forcing page reload for navigation');
                window.location.href = redirectTo;
              }
            }, 300);
          });
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        // Attempt sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        
        if (signUpError) {
          console.log('Sign up error:', signUpError);
          setError(signUpError.message || 'Failed to sign up. Please check your credentials.');
          return;
        }
        
        if (data?.user) {
          if (data.user.identities?.length === 0) {
            setError('This email is already registered. Please log in instead.');
          } else {
            // Store the token for API calls
            if (data.session) {
              localStorage.setItem('supabase-auth-token', data.session.access_token);
              
              // Force a session refresh to ensure it's properly stored
              await refreshSession();
            }
            
            // Redirect to the application form to complete registration
            setError(null);
            setMode('login');
            router.push('/apply');
          }
        } else {
          setError('Sign-up failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Auth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    let checkTimeout = null;
    
    const checkSession = async () => {
      try {
        setCheckingSession(true);
        
        // First check if user is logged in via Supabase
        const loggedIn = await isLoggedIn();
        
        // Also check if the avatar is visible in the header (DOM check)
        const avatarVisible = typeof window !== 'undefined' && 
                             document.querySelector('.MuiAvatar-root') !== null;
        
        if (isMounted) {
          if (loggedIn || avatarVisible) {
            console.log('User is already logged in, redirecting...');
            // Redirect to returnUrl if provided, otherwise to home
            const redirectTo = returnUrl || '/';
            router.push(redirectTo);
            return;
          }
          
          // If not logged in, try to refresh the session
          if (!sessionRefreshAttempted) {
            setSessionRefreshAttempted(true);
            console.log('Attempting to refresh session...');
            const session = await refreshSession();
            
            if (session && isMounted) {
              console.log('Session refreshed successfully, redirecting...');
              // Redirect to returnUrl if provided, otherwise to home
              const redirectTo = returnUrl || '/';
              router.push(redirectTo);
              return;
            }
          }
          
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    checkSession();
    
    // Add a safety timeout to prevent infinite loading
    checkTimeout = setTimeout(() => {
      if (isMounted && checkingSession) {
        console.log('Session check timed out, showing login form');
        
        // One final check for avatar in header before showing login form
        const avatarVisible = typeof window !== 'undefined' && 
                             document.querySelector('.MuiAvatar-root') !== null;
        
        if (avatarVisible) {
          // If avatar is visible but we're still on login page, force redirect
          console.log('Avatar detected in header, forcing redirect');
          const redirectTo = returnUrl || '/';
          window.location.href = redirectTo; // Use direct location change
        } else {
          setCheckingSession(false);
        }
      }
    }, 3000); // Reduced to 3 seconds for faster response
    
    return () => {
      isMounted = false;
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [router, returnUrl, sessionRefreshAttempted]);

  if (checkingSession || user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Checking authentication status...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>Login | SADRC Membership Portal</title>
        <meta name="description" content="Login to the Skegness and District Running Club Membership Portal" />
      </Head>
      
      <Container maxWidth="sm">
        <Box sx={{ my: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              SADRC Membership Portal
            </Typography>
            
            <Typography variant="h5" component="h2" align="center" gutterBottom>
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleAuth} sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  {mode === 'login' ? "Don't have an account? Sign up to create one." : 'Already have an account?'}
                </Typography>
                
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  sx={{ mt: 1 }}
                >
                  {mode === 'login' ? 'Sign Up' : 'Login'}
                </Button>
                
                {mode === 'login' && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => router.push('/reset-password')}
                    sx={{ mt: 1 }}
                  >
                    Forgot password?
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
