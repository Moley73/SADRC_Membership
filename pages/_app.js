import '../styles/globals.css';
import { CssBaseline, ThemeProvider, AppBar, Toolbar, Box, Button, Typography, Container, Link, IconButton, Menu, MenuItem, useMediaQuery } from '@mui/material';
import getTheme from '../theme/theme';
import { useMemo, useState, useEffect } from 'react';
import { ColorModeContext } from '../theme/ColorModeContext';
import ColorModeToggle from '../components/ColorModeToggle';
import AuthStatus from '../components/AuthStatus';
import AdminNavButton from '../components/AdminNavButton';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import MenuIcon from '@mui/icons-material/Menu';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const [mode, setMode] = useState('dark');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const router = useRouter();
  
  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
    },
  }), []);
  
  const theme = useMemo(() => getTheme(mode), [mode]);
  
  // Use the theme after it's initialized
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleNavigation = (path) => {
    router.push(path);
    handleMobileMenuClose();
  };

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

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="sticky" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'primary.main',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    mr: { xs: 1, md: 3 },
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                  onClick={() => router.push('/')}
                >
                  SADRC <Box component="span" sx={{ color: 'text.primary', ml: 0.5 }}>Members Area</Box>
                </Typography>
                {isMobile ? (
                  <IconButton
                    size="large"
                    aria-label="navigation menu"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMobileMenuOpen}
                    color="inherit"
                    sx={{ ml: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                ) : (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button 
                      color="inherit" 
                      sx={{ 
                        fontWeight: 600, 
                        borderRadius: '4px',
                        px: 1.5,
                        minWidth: 'auto',
                        '&:hover': { backgroundColor: 'background.subtle' },
                        ...(router.pathname === '/' && { 
                          color: 'primary.main',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 6,
                            left: 10,
                            right: 10,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main'
                          }
                        })
                      }} 
                      onClick={() => router.push('/')}
                    >
                      HOME
                    </Button>
                    <Button 
                      color="inherit" 
                      sx={{ 
                        fontWeight: 600, 
                        borderRadius: '4px',
                        px: 1.5,
                        minWidth: 'auto',
                        '&:hover': { backgroundColor: 'background.subtle' },
                        ...(router.pathname === '/resources' && { 
                          color: 'primary.main',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 6,
                            left: 10,
                            right: 10,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main'
                          }
                        })
                      }} 
                      onClick={() => router.push('/resources')}
                    >
                      RESOURCES
                    </Button>
                    <Button 
                      color="inherit" 
                      sx={{ 
                        fontWeight: 600, 
                        borderRadius: '4px',
                        px: 1.5,
                        minWidth: 'auto',
                        '&:hover': { backgroundColor: 'background.subtle' },
                        ...(router.pathname.startsWith('/awards') && !router.pathname.includes('/manage') && { 
                          color: 'primary.main',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 6,
                            left: 10,
                            right: 10,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main'
                          }
                        })
                      }} 
                      onClick={() => router.push('/awards')}
                    >
                      AWARDS
                    </Button>
                    <Button 
                      color="inherit" 
                      sx={{ 
                        fontWeight: 600, 
                        borderRadius: '4px',
                        px: 1.5,
                        minWidth: 'auto',
                        '&:hover': { backgroundColor: 'background.subtle' },
                        ...(router.pathname === '/relay' && { 
                          color: 'primary.main',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 6,
                            left: 10,
                            right: 10,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main'
                          }
                        })
                      }} 
                      onClick={() => router.push('/relay')}
                    >
                      RELAY
                    </Button>
                    <Button 
                      color="inherit" 
                      sx={{ 
                        fontWeight: 600, 
                        borderRadius: '4px',
                        px: 1.5,
                        minWidth: 'auto',
                        '&:hover': { backgroundColor: 'background.subtle' },
                        ...(router.pathname === '/xmas-party' && { 
                          color: 'primary.main',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 6,
                            left: 10,
                            right: 10,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main'
                          }
                        })
                      }} 
                      onClick={() => router.push('/xmas-party')}
                    >
                      XMAS PARTY
                    </Button>
                    {isAdmin && (
                      <Button 
                        color="inherit" 
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: '4px',
                          px: 1.5,
                          minWidth: 'auto',
                          '&:hover': { backgroundColor: 'background.subtle' },
                          ...(router.pathname === '/admin' && { 
                            color: 'primary.main',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 6,
                              left: 10,
                              right: 10,
                              height: 3,
                              borderRadius: 1.5,
                              backgroundColor: 'primary.main'
                            }
                          })
                        }} 
                        onClick={() => router.push('/admin')}
                      >
                        ADMIN
                      </Button>
                    )}
                    {isSuperAdmin && (
                      <Button 
                        color="inherit" 
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: '4px',
                          px: 1.5,
                          minWidth: 'auto',
                          '&:hover': { backgroundColor: 'background.subtle' },
                          ...(router.pathname === '/manage' && { 
                            color: 'primary.main',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 6,
                              left: 10,
                              right: 10,
                              height: 3,
                              borderRadius: 1.5,
                              backgroundColor: 'primary.main'
                            }
                          })
                        }} 
                        onClick={() => router.push('/manage')}
                      >
                        MANAGE
                      </Button>
                    )}
                    {isSuperAdmin && (
                      <Button 
                        color="inherit" 
                        sx={{ 
                          fontWeight: 600, 
                          borderRadius: '4px',
                          px: 1.5,
                          minWidth: 'auto',
                          '&:hover': { backgroundColor: 'background.subtle' },
                          ...(router.pathname === '/awards/manage' && { 
                            color: 'primary.main',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              bottom: 6,
                              left: 10,
                              right: 10,
                              height: 3,
                              borderRadius: 1.5,
                              backgroundColor: 'primary.main'
                            }
                          })
                        }} 
                        onClick={() => router.push('/awards/manage')}
                      >
                        MANAGE AWARDS
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AuthStatus />
                <ColorModeToggle />
              </Box>
            </Toolbar>
          </AppBar>
          {isMobile && (
            <Menu
              id="menu-appbar"
              anchorEl={mobileMenuAnchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(mobileMenuAnchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  width: 200,
                  borderRadius: 2,
                  overflow: 'visible',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                }
              }}
            >
              <MenuItem 
                onClick={() => handleNavigation('/')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                HOME
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/resources')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/resources' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                RESOURCES
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/awards')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname.startsWith('/awards') && !router.pathname.includes('/manage') && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                AWARDS
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/relay')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/relay' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                RELAY
              </MenuItem>
              <MenuItem 
                onClick={() => handleNavigation('/xmas-party')}
                sx={{ 
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  px: 2,
                  ...(router.pathname === '/xmas-party' && { 
                    color: 'primary.main',
                    bgcolor: 'background.subtle'
                  })
                }}
              >
                XMAS PARTY
              </MenuItem>
              {isAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/admin')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/admin' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  ADMIN
                </MenuItem>
              )}
              {isSuperAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/manage')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/manage' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  MANAGE
                </MenuItem>
              )}
              {isSuperAdmin && (
                <MenuItem 
                  onClick={() => handleNavigation('/awards/manage')}
                  sx={{ 
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    px: 2,
                    ...(router.pathname === '/awards/manage' && { 
                      color: 'primary.main',
                      bgcolor: 'background.subtle'
                    })
                  }}
                >
                  MANAGE AWARDS
                </MenuItem>
              )}
            </Menu>
          )}
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Component {...pageProps} />
          </Box>
          <Box 
            component="footer" 
            sx={{ 
              py: 3, 
              px: 2, 
              mt: 'auto', 
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Container maxWidth="lg">
              <Typography variant="body2" color="text.secondary" align="center">
                {new Date().getFullYear()} Skegness and District Running Club. All rights reserved.
              </Typography>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
