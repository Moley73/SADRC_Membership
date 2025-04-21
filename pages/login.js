import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Container, Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login');
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

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
          console.log('Login successful, redirecting to home');
          router.push('/');
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
            setError('Sign-up successful! Please check your email to confirm your account, then log in.');
            setMode('login');
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
        const { data } = await supabase.auth.getSession();
        
        if (isMounted) {
          if (data?.session) {
            router.push('/');
          }
          setCheckingSession(false);
        }
      } catch (err) {
        // Silent error handling for session check
        console.log('Session check:', err);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };
    
    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
                  {mode === 'login' ? "Don't have an account? Contact the club secretary." : 'Already have an account?'}
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
