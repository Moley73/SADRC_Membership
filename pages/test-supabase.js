import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Container, Typography, Box, CircularProgress, Alert, Button, TextField, Pagination, MenuItem, FormControl, InputLabel, Select, Stack, Paper, useTheme } from '@mui/material';
import { exportMembersToPDF } from '../lib/pdfExportHelper';

const PAGE_SIZE = 5;

function exportToCSV(rows, filename = 'members_export.csv') {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(','), ...rows.map(row => header.map(field => `"${row[field] ?? ''}"`).join(','))].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TestSupabase() {
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSex, setFilterSex] = useState('');
  const [filterOptIn, setFilterOptIn] = useState('');
  const [filterMembership, setFilterMembership] = useState('');

  const fetchMembers = async () => {
    setLoading(true);
    let query = supabase.from('members').select('*').order('signed_at', { ascending: false });
    if (search.trim()) {
      query = query.ilike('first_name', `%${search}%`).or(`surname.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data, error } = await query;
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMembers(data || []);
      setTotalPages(Math.max(1, Math.ceil((data || []).length / PAGE_SIZE)));
      setPage(1);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line
  }, [search]);

  const handleAddDummy = async () => {
    setAdding(true);
    setAddError(null);
    const dummy = {
      first_name: 'Test',
      surname: 'User',
      address: '123 Test Street',
      post_code: 'TE57 1NG',
      telephone: '07123456789',
      email: 'test@example.com',
      date_of_birth: '2000-01-01',
      country_of_birth: 'Testland',
      sex: 'non-binary',
      emergency_name: 'Tester Emergency',
      emergency_relationship: 'Friend',
      emergency_phone: '07000000000',
      medical_conditions: '',
      has_medical_condition: false,
      membership_type: 'club',
      agreed_policies: true,
      opt_out_competitions: false,
      opt_out_photos: false,
      signature_url: null,
      signed_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('members').insert([dummy]);
    setAdding(false);
    if (error) {
      setAddError(error.message);
    } else {
      fetchMembers();
    }
  };

  // Apply filters client-side
  const filteredMembers = members.filter(m => {
    let pass = true;
    if (filterSex) pass = pass && m.sex === filterSex;
    if (filterOptIn) {
      if (filterOptIn === 'competitions-in') pass = pass && !m.opt_out_competitions;
      if (filterOptIn === 'competitions-out') pass = pass && !!m.opt_out_competitions;
      if (filterOptIn === 'photos-in') pass = pass && !m.opt_out_photos;
      if (filterOptIn === 'photos-out') pass = pass && !!m.opt_out_photos;
    }
    if (filterMembership) pass = pass && m.membership_type === filterMembership;
    return pass;
  });

  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE)));
    setPage(1);
  }, [filterSex, filterOptIn, filterMembership, members]);

  const paginatedMembers = filteredMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    exportToCSV(filteredMembers);
  };

  const handleExportPDF = () => {
    exportMembersToPDF(filteredMembers);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h3" gutterBottom sx={{ color: 'primary.main', fontWeight: 900, textAlign: 'center', letterSpacing: 1, mb: 4 }}>
        Membership Submissions
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center', mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" color="secondary" onClick={handleAddDummy} disabled={adding} sx={{ fontWeight: 700, px: 2, boxShadow: 2 }}>
          {adding ? 'Adding...' : 'Add Dummy Submission'}
        </Button>
        <TextField
          size="small"
          placeholder="Search name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 180, bgcolor: theme.palette.background.paper, borderRadius: 1, boxShadow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Gender</InputLabel>
          <Select value={filterSex} label="Gender" onChange={e => setFilterSex(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="non-binary">Non-binary</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Opt In/Out</InputLabel>
          <Select value={filterOptIn} label="Opt In/Out" onChange={e => setFilterOptIn(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="competitions-in">In Competitions</MenuItem>
            <MenuItem value="competitions-out">Opted Out Competitions</MenuItem>
            <MenuItem value="photos-in">In Photos</MenuItem>
            <MenuItem value="photos-out">Opted Out Photos</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Membership</InputLabel>
          <Select value={filterMembership} label="Membership" onChange={e => setFilterMembership(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="club">Club</MenuItem>
            <MenuItem value="club+affiliation">Club + Affiliation</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" color="primary" onClick={handleExport} sx={{ whiteSpace: 'nowrap', fontWeight: 700, borderWidth: 2 }}>
          Export Filtered (CSV)
        </Button>
        <Button variant="outlined" color="primary" onClick={handleExportPDF} sx={{ whiteSpace: 'nowrap', fontWeight: 700, borderWidth: 2 }}>
          Export Filtered (PDF)
        </Button>
      </Stack>
      {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
      {loading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={48} /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && !error && filteredMembers.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>No submissions found. Please submit a test application.</Alert>
      )}
      <Box mt={3}>
        {paginatedMembers.map((m) => (
          <Paper key={m.id} elevation={4} sx={{ mb: 4, p: 3, borderRadius: 3, background: theme.palette.mode === 'dark' ? '#232323' : '#fff7ed', border: '2px solid', borderColor: 'primary.main', boxShadow: '0 4px 24px 0 rgba(255,152,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mb: 1, letterSpacing: 0.5 }}>
              {m.first_name} {m.surname}
            </Typography>
            <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', rowGap: 0.5, columnGap: 2 }}>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Email:</Typography><Typography component="dd">{m.email}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Signed At:</Typography><Typography component="dd">{new Date(m.signed_at || m.created_at).toLocaleString()}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Address:</Typography><Typography component="dd">{m.address}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Post Code:</Typography><Typography component="dd">{m.post_code}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Date of Birth:</Typography><Typography component="dd">{m.date_of_birth}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Country of Birth:</Typography><Typography component="dd">{m.country_of_birth}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Gender/Sex:</Typography><Typography component="dd">{m.sex}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Membership Type:</Typography><Typography component="dd">{m.membership_type}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Medical Conditions:</Typography><Typography component="dd">{m.medical_conditions || 'None'}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Emergency Contact:</Typography><Typography component="dd">{m.emergency_name} ({m.emergency_relationship}) - {m.emergency_phone}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Agreed Policies:</Typography><Typography component="dd">{m.agreed_policies ? 'Yes' : 'No'}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Opt Out Competitions:</Typography><Typography component="dd">{m.opt_out_competitions ? 'Yes' : 'No'}</Typography>
              <Typography component="dt" sx={{ fontWeight: 600 }}>Opt Out Photos:</Typography><Typography component="dd">{m.opt_out_photos ? 'Yes' : 'No'}</Typography>
            </Box>
            {m.signature_url && (
              <Box mt={2}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Signature:</Typography>
                <img src={`https://wylflyzcsmkckzjdvsqc.supabase.co/storage/v1/object/public/${m.signature_url}`} alt="Signature" style={{ border: '1px solid #ff9800', background: '#fff', borderRadius: 4, maxWidth: 320 }} />
              </Box>
            )}
          </Paper>
        ))}
      </Box>
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            sx={{ '& .MuiPaginationItem-root': { fontWeight: 700 } }}
          />
        </Box>
      )}
    </Container>
  );
}
