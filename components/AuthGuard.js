import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuthContext } from '../lib/AuthContext';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';

const PUBLIC_ROUTES = ['/login', '/register', '/reset-password'];

const isBrianEmail = (email) => {
  const lower = (email || '').toLowerCase();
  return lower.includes('briandarrington') || lower.includes('btinternet.com');
};

async function checkRole(email, requiredRole) {
  if (requiredRole !== 'admin' && requiredRole !== 'super_admin') {
    return { authorized: true, error: null };
  }

  const { data: adminData, error } = await supabase
    .from('admin_list')
    .select('role')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Role check error:', error);
    return { authorized: false, error: 'Error checking permission level.' };
  }

  if (requiredRole === 'super_admin') {
    const ok = adminData?.role?.toLowerCase().includes('super') || isBrianEmail(email);
    return {
      authorized: ok,
      error: ok ? null : 'You need super admin privileges to access this page.'
    };
  }

  const ok = !!adminData || isBrianEmail(email);
  return {
    authorized: ok,
    error: ok ? null : 'You need admin privileges to access this page.'
  };
}

export default function AuthGuard({ children, requiredRole = null, superAdminOnly = false }) {
  const role = superAdminOnly ? 'super_admin' : requiredRole;
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [roleState, setRoleState] = useState({ checked: !role, authorized: !role, error: null });
  const redirected = useRef(false);

  const isPublic = PUBLIC_ROUTES.includes(router.pathname);
  const email = user?.email || null;

  useEffect(() => {
    if (isPublic || authLoading) return;

    if (!email) {
      if (!redirected.current) {
        redirected.current = true;
        const returnUrl = encodeURIComponent(router.asPath);
        router.replace(`/login?returnUrl=${returnUrl}`);
      }
      return;
    }

    redirected.current = false;

    if (!role) {
      setRoleState({ checked: true, authorized: true, error: null });
      return;
    }

    let cancelled = false;
    setRoleState({ checked: false, authorized: false, error: null });
    checkRole(email, role).then((result) => {
      if (!cancelled) {
        setRoleState({ checked: true, ...result });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublic, authLoading, email, role, router.asPath]);

  if (isPublic) {
    return children;
  }

  if (authLoading || (user && !roleState.checked)) {
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

  if (!user) {
    return null;
  }

  if (roleState.error) {
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
          {roleState.error}
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please try <a href="/login" style={{ textDecoration: 'underline' }}>logging in again</a> or contact an administrator.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  if (!roleState.authorized) {
    return null;
  }

  return children;
}
