import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Typography, Box } from '@mui/material';
import { useRouter } from 'next/router';

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  if (user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="inherit">
          Logged in as {user.email}
        </Typography>
        <Button color="inherit" onClick={handleLogout} size="small" sx={{ ml: 1 }}>
          Log Out
        </Button>
      </Box>
    );
  } else {
    return (
      <Button color="inherit" onClick={() => router.push('/login')} size="small">
        Log In
      </Button>
    );
  }
}
