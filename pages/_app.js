import '../styles/globals.css';
import { CssBaseline, ThemeProvider, AppBar, Toolbar, Box, Button, Typography, Container, Link } from '@mui/material';
import getTheme from '../theme/theme';
import { useMemo, useState, useEffect } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import ColorModeToggle from '../components/ColorModeToggle';
import AuthStatus from '../components/AuthStatus';
import AdminNavButton from '../components/AdminNavButton';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState('dark');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            // Simplified query to admin_list table with case-insensitive role check
            const { data, error } = await supabase
              .from('admin_list')
              .select('role')
              .eq('email', session.user.email)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching admin status:', error);
              // Fallback to hardcoded admin list
              const isAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
              const isSuperAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
              setIsAdmin(isAdmin);
              setIsSuperAdmin(isSuperAdmin);
              return;
            }
            
            // Use case-insensitive matching for more flexibility
            const role = data?.role?.toLowerCase() || '';
            const isUserAdmin = role.includes('admin');
            const isUserSuperAdmin = role.includes('super');
            
            setIsAdmin(isUserAdmin);
            setIsSuperAdmin(isUserSuperAdmin);
          } catch (err) {
            console.error('Error checking admin status:', err);
            // Fallback to hardcoded admin list
            const isAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
            const isSuperAdmin = ['briandarrington@btinternet.com'].includes(session.user.email);
            setIsAdmin(isAdmin);
            setIsSuperAdmin(isSuperAdmin);
          }
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 0, 
                  fontWeight: 'bold', 
                  color: 'primary.main',
                  mr: 4,
                  cursor: 'pointer'
                }}
                onClick={() => router.push('/')}
              >
                SADRC Members Area
              </Typography>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/')}>HOME</Button>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/resources')}>RESOURCES</Button>
              {isAdmin && (
                <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/admin')}>ADMIN</Button>
              )}
              {isSuperAdmin && (
                <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/manage')}>MANAGE</Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AuthStatus />
              <ColorModeToggle />
            </Box>
          </Toolbar>
        </AppBar>
        <Container maxWidth={false} disableGutters sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Component {...pageProps} />
        </Container>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
