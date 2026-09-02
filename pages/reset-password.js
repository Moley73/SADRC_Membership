import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Container, Box, TextField, Button, Typography, Alert, Paper, CircularProgress } from '@mui/material';
import Head from 'next/head';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const hashError = hashParams.get('error_description') || hashParams.get('error');
    if (hashError) {
      setError(decodeURIComponent(hashError.replace(/\+/g, ' ')));
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasRecoverySession(true);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data?.session) {
        setHasRecoverySession(true);
      }
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleRequestLink = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email. Please try again.');
        return;
      }

      setSuccess('If an account exists for that email, a password reset link has been sent. Please open the link on this device.');
    } catch (err) {
      console.error('Reset request exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        if (/session/i.test(updateError.message || '')) {
          setHasRecoverySession(false);
          setError('Your reset link has expired or was already used. Please request a new one.');
        } else {
          setError(updateError.message || 'Failed to update password. Please try again.');
        }
        return;
      }

      setSuccess('Your password has been updated. Redirecting to login...');
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      console.error('Password update exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Checking reset link...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password | SADRC Membership Portal</title>
        <meta name="description" content="Reset your SADRC Membership Portal password" />
      </Head>

      <Container maxWidth="sm">
        <Box sx={{ my: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              SADRC Membership Portal
            </Typography>

            <Typography variant="h5" component="h2" align="center" gutterBottom>
              {hasRecoverySession ? 'Set New Password' : 'Reset Password'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {hasRecoverySession ? (
              <Box component="form" onSubmit={handleUpdatePassword} sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleRequestLink} sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Enter your email address and we will send you a link to reset your password.
                </Typography>

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

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                </Button>
              </Box>
            )}

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button variant="text" size="small" onClick={() => router.push('/login')}>
                Return to login
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
}
