import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { isAdmin as checkIsAdmin } from '../lib/supabaseClient';

export default function AdminNavButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    checkIsAdmin().then((result) => {
      if (mounted) setIsAdmin(result);
    });
    return () => { mounted = false; };
  }, []);

  if (!isAdmin) return null;
  return (
    <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/admin')}>Admin</Button>
  );
}
