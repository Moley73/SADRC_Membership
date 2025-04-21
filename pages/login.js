import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Container, Box, Typography, TextField, Button, Alert, Tabs, Tab, CircularProgress } from '@mui/material';
import Head from 'next/head';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        setCheckingAuth(true);
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      if (!email || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
        return;
      }
      
      if (mode === 'login') {
        console.log('Attempting login with:', email);
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (error) {
          console.error('Login error:', error);
          setError(error.message);
        } else if (data?.session) {
          setSuccess('Login successful! Redirecting...');
          // Wait briefly to ensure session is stored properly
          setTimeout(() => {
            router.push('/');
          }, 500);
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        
        if (error) {
          console.error('Signup error:', error);
          setError(error.message);
        } else if (data?.user) {
          if (data.user.identities?.length === 0) {
            setError('This email is already registered. Please log in instead.');
          } else {
            setSuccess('Sign-up successful! Please check your email to confirm your account, then log in.');
            setMode('login');
          }
        } else {
          setError('Sign-up failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <div>
      <Head>
        <title>SADRC Members Area - Login</title>
        <meta name="description" content="Skegness and District Running Club Members Area" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Box sx={{ bgcolor: 'background.paper', p: 4, borderRadius: 4, boxShadow: 4 }}>
          <Typography variant="h4" align="center" mb={2} fontWeight={800} color="primary">SADRC Members Area</Typography>
          <Tabs value={mode} onChange={(_, v) => setMode(v)} centered sx={{ mb: 2 }}>
            <Tab label="Login" value="login" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleAuth}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              required
              disabled={loading}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              size="large"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                mode === 'login' ? 'Login' : 'Sign Up'
              )}
            </Button>
          </form>
        </Box>
      </Container>
    </div>
  );
}
