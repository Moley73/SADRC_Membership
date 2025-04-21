import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Box, CircularProgress, Alert, Container } from '@mui/material';

// Fallback admin emails list - used only if database check fails
const FALLBACK_ADMIN_EMAILS = [
  'briandarrington@btinternet.com',
];

export default function AuthGuard({ children, adminOnly = false, superAdminOnly = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.replace('/login');
          return;
        }
        
        if (!data?.session?.user) {
          console.log('No active session found');
          router.replace('/login');
          return;
        }

        const user = data.session.user;
        setUser(user);

        // If this is an admin-only or super-admin-only page, check permissions
        if (adminOnly || superAdminOnly) {
          try {
            // Query admin_list table with simplified case-insensitive check
            const { data: adminData, error } = await supabase
              .from('admin_list')
              .select('role')
              .eq('email', user.email)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching admin status:', error);
              // Fallback to hardcoded admin list
              const isUserAdmin = FALLBACK_ADMIN_EMAILS.includes(user.email);
              
              if (superAdminOnly && !isUserAdmin) {
                setError('Access denied: Only super administrators can access this page.');
                return;
              }
              
              if (adminOnly && !isUserAdmin) {
                setError('Access denied: You do not have permission to view this page.');
                return;
              }
            } else {
              // Case-insensitive role check from database
              const role = adminData?.role?.toLowerCase() || '';
              const isUserAdmin = role.includes('admin');
              const isUserSuperAdmin = role.includes('super');
              
              if (superAdminOnly && !isUserSuperAdmin) {
                setError('Access denied: Only super administrators can access this page.');
                return;
              }
              
              if (adminOnly && !isUserAdmin) {
                setError('Access denied: You do not have permission to view this page.');
                return;
              }
            }
          } catch (err) {
            console.error('Error checking admin status:', err);
            // Fallback to hardcoded admin check
            const isUserAdmin = FALLBACK_ADMIN_EMAILS.includes(user.email);
            
            if (superAdminOnly && !isUserAdmin) {
              setError('Access denied: Only super administrators can access this page.');
              return;
            }
            
            if (adminOnly && !isUserAdmin) {
              setError('Access denied: You do not have permission to view this page.');
              return;
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Auth error:', err);
        setError('Authentication error. Please try logging in again.');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router, adminOnly, superAdminOnly]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return children;
}
