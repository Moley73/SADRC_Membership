import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase, refreshSession, isLoggedIn } from '../lib/supabaseClient';
import { Container, Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import Head from 'next/head';

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
          
          // Redirect to returnUrl if provided, otherwise to home
          const redirectTo = returnUrl || '/';
          window.location.href = redirectTo; // Use window.location for full page reload
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
    
    const checkSession = async () => {
      try {
        setCheckingSession(true);
        
        // First check if user is logged in
        const loggedIn = await isLoggedIn();
        
        if (isMounted) {
          if (loggedIn) {
            console.log('User is already logged in, redirecting...');
            // Redirect to returnUrl if provided, otherwise to home
            const redirectTo = returnUrl || '/';
            router.push(redirectTo);
            return;
          }
          
          // If not logged in but we haven't tried refreshing the session yet
          if (!sessionRefreshAttempted) {
            console.log('Attempting to refresh session...');
            setSessionRefreshAttempted(true);
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
    
    return () => {
      isMounted = false;
    };
  }, [router, returnUrl, sessionRefreshAttempted]);

  if (checkingSession) {
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
