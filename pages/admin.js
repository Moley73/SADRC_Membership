import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Container, Typography, Box, Alert, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button, Tabs, Tab } from '@mui/material';

// Set your admin emails here
const ADMIN_EMAILS = [
  'briandarrington@btinternet.com', // Add more admin emails as needed
];

const STATUS_COLORS = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [tab, setTab] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace('/login');
        return;
      }
      setUser(data.user);
      if (!ADMIN_EMAILS.includes(data.user.email)) {
        setError('Access denied: You are not an admin.');
        setLoading(false);
        return;
      }
      fetchMembers();
    };
    checkAdmin();
    // eslint-disable-next-line
  }, [router]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data: membersData, error: membersError } = await supabase.from('members').select('*').order('created_at', { ascending: false });
    if (membersError) setError(membersError.message);
    else setMembers(membersData);
    setLoading(false);
  };

  const handleStatus = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    await supabase.from('members').update({ status }).eq('id', id);
    await fetchMembers();
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  const handleDelete = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    await supabase.from('members').delete().eq('id', id);
    await fetchMembers();
    setActionLoading((prev) => ({ ...prev, [id]: false }));
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Container maxWidth="md"><Alert severity="error" sx={{ mt: 4 }}>{error}</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Typography variant="h4" fontWeight={800} mb={2}>Admin Area</Typography>
      <Typography variant="subtitle1" mb={4}>User Management & Membership Submissions</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Manage Submissions" />
        {/* You can add more admin tabs here in the future */}
      </Tabs>
      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Surname</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Signed At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>auth_user_id</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.first_name}</TableCell>
                  <TableCell>{m.surname}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.date_of_birth}</TableCell>
                  <TableCell>{m.signed_at}</TableCell>
                  <TableCell>
                    <Alert severity={STATUS_COLORS[m.status] || 'info'} sx={{ p: 0.5, m: 0, fontSize: 12, width: 'fit-content' }}>{m.status || 'pending'}</Alert>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        disabled={actionLoading[m.id] || m.status === 'approved'}
                        onClick={() => handleStatus(m.id, 'approved')}
                      >Approve</Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={actionLoading[m.id] || m.status === 'rejected'}
                        onClick={() => handleStatus(m.id, 'rejected')}
                      >Reject</Button>
                      <Button
                        size="small"
                        color="secondary"
                        variant="outlined"
                        disabled={actionLoading[m.id]}
                        onClick={() => handleDelete(m.id)}
                      >Delete</Button>
                    </Box>
                  </TableCell>
                  <TableCell>{m.auth_user_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
