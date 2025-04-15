import '../styles/globals.css';
import { CssBaseline, ThemeProvider, AppBar, Toolbar, Box, Button, Typography, Container, Link } from '@mui/material';
import getTheme from '../theme/theme';
import { useMemo, useState } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import ColorModeToggle from '../components/ColorModeToggle';
import AuthStatus from '../components/AuthStatus';
import AdminNavButton from '../components/AdminNavButton';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState('dark');
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);
  const theme = useMemo(() => getTheme(mode), [mode]);
  const router = useRouter();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, color: 'primary.main', cursor: 'pointer', letterSpacing: 1 }}
                onClick={() => router.push('/')}
              >
                SADRC Membership
              </Typography>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/')}>Home</Button>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/apply')}>Apply</Button>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/test-supabase')}>Submissions</Button>
              <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/resources')}>Resources</Button>
              <AdminNavButton />
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
