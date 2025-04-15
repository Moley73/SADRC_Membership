import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const ADMIN_EMAILS = [
  'briandarrington@btinternet.com', // Add more admin emails as needed
];

export default function AdminNavButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data?.user && ADMIN_EMAILS.includes(data.user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (!isAdmin) return null;
  return (
    <Button color="inherit" sx={{ fontWeight: 700 }} onClick={() => router.push('/admin')}>Admin</Button>
  );
}
