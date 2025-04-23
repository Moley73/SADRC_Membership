import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { 
  Container, Typography, Box, Alert, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Paper, 
  Button, Tabs, Tab, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, Grid,
  Card, CardContent, CardActions, Divider, Menu, MenuItem
} from '@mui/material';
import AuthGuard from '../components/AuthGuard';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { exportMembersToPDF } from '../lib/pdfExportHelper';
import MemberUpdateDialog from '../components/MemberUpdateDialog';

const STATUS_COLORS = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [tab, setTab] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all'); // Track which filter is active
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    optInCompetitions: 0,
    optInAagaChallenge: 0,
    paid: 0,
    pendingUpdates: 0
  });
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [exportMenu, setExportMenu] = useState(null);
  const [reportsExportMenu, setReportsExportMenu] = useState(null);
  const [exportType, setExportType] = useState('csv');
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openAddAdminDialog, setOpenAddAdminDialog] = useState(false);
  const [selectedAdminMember, setSelectedAdminMember] = useState(null);
  const [adminRole, setAdminRole] = useState('admin');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState(null);
  const [addAdminSuccess, setAddAdminSuccess] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchMembers();
    fetchAdmins();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      filterMembers();
      calculateStats();
    }
  }, [members, searchTerm, activeFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching members:', error);
        setError(error.message);
      } else if (data) {
        // Add payment_status property if it doesn't exist
        const processedData = data.map(member => ({
          ...member,
          payment_status: member.payment_status || 'unpaid'
        }));
        
        setMembers(processedData);
        setFilteredMembers(processedData);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_list')
        .select('*');
      if (error) {
        console.error('Error fetching admins:', error);
      } else {
        setAdminList(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching admins:', err);
    }
  };

  const filterMembers = () => {
    let filtered = members;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(member => 
        (member.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.surname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'approved':
          filtered = filtered.filter(m => m.status === 'approved');
          break;
        case 'pending':
          filtered = filtered.filter(m => !m.status || m.status === 'pending');
          break;
        case 'paid':
          filtered = filtered.filter(m => m.payment_status === 'paid');
          break;
        case 'pendingUpdates':
          filtered = filtered.filter(m => m.pending_update === true);
          break;
        default:
          break;
      }
    }
    
    setFilteredMembers(filtered);
  };

  const calculateStats = () => {
    const stats = {
      total: members.length,
      approved: members.filter(m => m.status === 'approved').length,
      pending: members.filter(m => !m.status || m.status === 'pending').length,
      rejected: members.filter(m => m.status === 'rejected').length,
      optInCompetitions: members.filter(m => m.opt_in_competitions).length,
      optInAagaChallenge: members.filter(m => m.opt_in_aaga_challenge).length,
      paid: members.filter(m => m.payment_status === 'paid').length,
      pendingUpdates: members.filter(m => m.pending_update).length
    };
    
    setStats(stats);
  };

  const handleStatus = async (id, status) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      
      const { error } = await supabase
        .from('members')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating status:', error);
      } else {
        // Update local state
        const updatedMembers = members.map(member => 
          member.id === id ? { ...member, status } : member
        );
        setMembers(updatedMembers);
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handlePaymentStatus = async (id, paymentStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      
      // Update local state first for immediate feedback
      const updatedMembers = members.map(member => 
        member.id === id ? { ...member, payment_status: paymentStatus } : member
      );
      setMembers(updatedMembers);
      
      // Try to update in database if possible
      try {
        await supabase
          .from('members')
          .update({ payment_status: paymentStatus })
          .eq('id', id);
      } catch (dbErr) {
        console.log('Database update failed, using local state only:', dbErr);
      }
    } catch (err) {
      console.error('Payment status update error:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try {
        setActionLoading((prev) => ({ ...prev, [id]: true }));
        
        const { error } = await supabase
          .from('members')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Error deleting member:', error);
        } else {
          // Update local state
          const updatedMembers = members.filter(member => member.id !== id);
          setMembers(updatedMembers);
        }
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setActionLoading((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setOpenMemberDialog(true);
  };

  const handleViewUpdate = (member) => {
    setSelectedMember(member);
    setOpenUpdateDialog(true);
  };

  const handleApproveChanges = async (memberId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [memberId]: true }));
      
      const { error } = await supabase
        .from('members')
        .update({ pending_update: false })
        .eq('id', memberId);
      
      if (error) {
        console.error('Error approving changes:', error);
        setError(error.message);
      } else {
        // Refresh the members list
        await fetchMembers();
        setOpenUpdateDialog(false);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to approve changes. Please try again.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleAddAdmin = async () => {
    setAddAdminLoading(true);
    setAddAdminError(null);
    setAddAdminSuccess(null);
    if (!selectedAdminMember) {
      setAddAdminError('Please select a member.');
      setAddAdminLoading(false);
      return;
    }
    try {
      // Check if already admin
      const alreadyAdmin = adminList.some(a => a.email === selectedAdminMember.email);
      if (alreadyAdmin) {
        setAddAdminError('This member is already an admin.');
        setAddAdminLoading(false);
        return;
      }
      const { error } = await supabase
        .from('admin_list')
        .insert([{ email: selectedAdminMember.email, role: adminRole }]);
      if (error) {
        setAddAdminError(error.message);
      } else {
        setAddAdminSuccess('Administrator added successfully!');
        fetchAdmins();
        setSelectedAdminMember(null);
        setAdminRole('admin');
        setTimeout(() => setOpenAddAdminDialog(false), 1200);
      }
    } catch (err) {
      setAddAdminError('Failed to add administrator.');
    } finally {
      setAddAdminLoading(false);
    }
  };

  const openExportMenu = (event) => {
    console.log('openExportMenu called', event.currentTarget); // Debug log
    setExportMenu(event.currentTarget);
  };

  const closeExportMenu = () => {
    setExportMenu(null);
  };
  
  const openReportsExportMenu = (event) => {
    setReportsExportMenu(event.currentTarget);
  };

  const closeReportsExportMenu = () => {
    setReportsExportMenu(null);
  };

  const handleExportCSV = (fromReports = false) => {
    try {
      // Create CSV content
      const headers = ['First Name', 'Surname', 'Email', 'Date of Birth', 'Status', 'Payment', 'Competitions', 'AaGA Challenge', 'Update Pending'];
      const csvRows = [headers];
      
      filteredMembers.forEach(member => {
        const row = [
          member.first_name || '',
          member.surname || '',
          member.email || '',
          member.date_of_birth || '',
          member.status || 'pending',
          member.payment_status || 'unpaid',
          member.opt_in_competitions ? 'Yes' : 'No',
          member.opt_in_aaga_challenge ? 'Yes' : 'No',
          member.pending_update ? 'Yes' : 'No'
        ];
        csvRows.push(row);
      });
      
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `members-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Close the appropriate menu
      if (fromReports) {
        closeReportsExportMenu();
      } else {
        closeExportMenu();
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  };
  
  const handleExportPDF = (pdfType, fromReports = false) => {
    try {
      exportMembersToPDF(filteredMembers, pdfType);
      
      // Close the appropriate menu
      if (fromReports) {
        closeReportsExportMenu();
      } else {
        closeExportMenu();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Typography variant="h4" fontWeight={800} mb={2}>Admin Area</Typography>
        <Typography variant="subtitle1" mb={4}>User Management & Membership Submissions</Typography>
        
        {/* Dashboard Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: 2,
                boxShadow: activeFilter === 'all' ? 6 : 2,
                '&:hover': { 
                  transform: 'translateY(-5px)', 
                  boxShadow: 8 
                },
                bgcolor: activeFilter === 'all' ? 'primary.light' : 'background.paper',
                border: activeFilter === 'all' ? '2px solid' : '1px solid',
                borderColor: activeFilter === 'all' ? 'primary.main' : 'divider',
                height: '100%'
              }}
              onClick={() => {
                setActiveFilter('all');
                setSearchTerm('');
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
                  Total Members
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ my: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  View all members
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: 2,
                boxShadow: activeFilter === 'approved' ? 6 : 2,
                '&:hover': { 
                  transform: 'translateY(-5px)', 
                  boxShadow: 8 
                },
                bgcolor: activeFilter === 'approved' ? 'success.light' : 'background.paper',
                border: activeFilter === 'approved' ? '2px solid' : '1px solid',
                borderColor: activeFilter === 'approved' ? 'success.main' : 'divider',
                height: '100%'
              }}
              onClick={() => setActiveFilter('approved')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
                  Approved
                </Typography>
                <Typography variant="h3" color="success.main" fontWeight={700} sx={{ my: 1 }}>
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Approved members
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: 2,
                boxShadow: activeFilter === 'pending' ? 6 : 2,
                '&:hover': { 
                  transform: 'translateY(-5px)', 
                  boxShadow: 8 
                },
                bgcolor: activeFilter === 'pending' ? 'warning.light' : 'background.paper',
                border: activeFilter === 'pending' ? '2px solid' : '1px solid',
                borderColor: activeFilter === 'pending' ? 'warning.main' : 'divider',
                height: '100%'
              }}
              onClick={() => setActiveFilter('pending')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
                  Pending
                </Typography>
                <Typography variant="h3" color="warning.main" fontWeight={700} sx={{ my: 1 }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Awaiting approval
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: 2,
                boxShadow: activeFilter === 'paid' ? 6 : 2,
                '&:hover': { 
                  transform: 'translateY(-5px)', 
                  boxShadow: 8 
                },
                bgcolor: activeFilter === 'paid' ? 'info.light' : 'background.paper',
                border: activeFilter === 'paid' ? '2px solid' : '1px solid',
                borderColor: activeFilter === 'paid' ? 'info.main' : 'divider',
                height: '100%'
              }}
              onClick={() => setActiveFilter('paid')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
                  Paid Members
                </Typography>
                <Typography variant="h3" color="info.main" fontWeight={700} sx={{ my: 1 }}>
                  {stats.paid}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Payment received
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: 2,
                boxShadow: activeFilter === 'pendingUpdates' ? 6 : 2,
                '&:hover': { 
                  transform: 'translateY(-5px)', 
                  boxShadow: 8 
                },
                bgcolor: activeFilter === 'pendingUpdates' ? 'secondary.light' : 'background.paper',
                border: activeFilter === 'pendingUpdates' ? '2px solid' : '1px solid',
                borderColor: activeFilter === 'pendingUpdates' ? 'secondary.main' : 'divider',
                height: '100%'
              }}
              onClick={() => setActiveFilter('pendingUpdates')}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom fontWeight={500}>
                  Updates Pending
                </Typography>
                <Typography variant="h3" color="secondary.main" fontWeight={700} sx={{ my: 1 }}>
                  {stats.pendingUpdates}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Changes to review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4 }}>
          {/* Search and Export */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 2,
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, rgba(66,66,66,0.95), rgba(66,66,66,0.9))' 
                : 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0.9))'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', md: 'row'}, 
              justifyContent: 'space-between', 
              alignItems: {xs: 'stretch', md: 'center'}, 
              gap: 2 
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: {xs: 'column', sm: 'row'}, 
                alignItems: {xs: 'stretch', sm: 'center'},
                gap: 2,
                flexGrow: 1
              }}>
                <TextField 
                  size="medium" 
                  label="Search members" 
                  variant="outlined" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    sx: { borderRadius: 2 }
                  }}
                />
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={fetchMembers} 
                  disabled={loading}
                  variant="outlined"
                  size="large"
                  sx={{ 
                    borderRadius: 2,
                    minWidth: {xs: '100%', sm: '120px'}
                  }}
                >
                  Refresh
                </Button>
              </Box>
              <Button 
                startIcon={<DownloadIcon />} 
                onClick={openExportMenu} 
                variant="contained" 
                color="primary"
                size="large"
                aria-controls="export-menu"
                aria-haspopup="true"
                sx={{ 
                  borderRadius: 2,
                  minWidth: {xs: '100%', md: '180px'}
                }}
              >
                Export Data
              </Button>
            </Box>
            
            {/* Active Filter Indicator */}
            {activeFilter !== 'all' && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Active Filter:</Typography>
                <Chip 
                  label={activeFilter === 'pendingUpdates' ? 'Updates Pending' : 
                         activeFilter === 'approved' ? 'Approved' :
                         activeFilter === 'pending' ? 'Pending' :
                         activeFilter === 'paid' ? 'Paid Members' : activeFilter}
                  color={activeFilter === 'pendingUpdates' ? 'secondary' : 
                         activeFilter === 'approved' ? 'success' :
                         activeFilter === 'pending' ? 'warning' :
                         activeFilter === 'paid' ? 'info' : 'default'}
                  onDelete={() => {
                    setActiveFilter('all');
                    setSearchTerm('');
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            )}
          </Paper>

          {/* Export Menu */}
          <Menu
            id="export-menu"
            anchorEl={exportMenu}
            keepMounted
            open={Boolean(exportMenu)}
            onClose={closeExportMenu}
            PaperProps={{
              elevation: 3,
              sx: { borderRadius: 2, mt: 1 }
            }}
          >
            <MenuItem onClick={handleExportCSV}>
              <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
              Export as CSV
            </MenuItem>
            <MenuItem onClick={() => handleExportPDF('summary')}>
              <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
              Export Summary PDF
            </MenuItem>
            <MenuItem onClick={() => handleExportPDF('full')}>
              <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
              Export Full Details PDF
            </MenuItem>
            <MenuItem onClick={() => handleExportPDF('competitions')}>
              <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
              Export Competitions PDF
            </MenuItem>
            <MenuItem onClick={() => handleExportPDF('aaga')}>
              <PictureAsPdfIcon fontSize="small" sx={{ mr: 1 }} />
              Export AaGA Challenge PDF
            </MenuItem>
          </Menu>

          {/* Add Administrator Button */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenAddAdminDialog(true)}
            >
              Add Administrator
            </Button>
          </Box>

          {/* Members Table */}
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2, 
              overflow: 'hidden',
              mb: 4
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : filteredMembers.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.primary">No members found</Typography>
                {searchTerm && (
                  <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                    Try adjusting your search or filters
                  </Typography>
                )}
                {activeFilter !== 'all' && (
                  <Button 
                    variant="text" 
                    color="primary" 
                    onClick={() => {
                      setActiveFilter('all');
                      setSearchTerm('');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            ) : (
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ 
                  bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                  '& th': {
                    color: theme => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
                    fontWeight: 'bold'
                  }
                }}>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Surname</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Date of Birth</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Competitions</TableCell>
                    <TableCell>AaGA</TableCell>
                    <TableCell>Update Pending</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.first_name}</TableCell>
                      <TableCell>{m.surname}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>{m.date_of_birth}</TableCell>
                      <TableCell>
                        <Alert severity={STATUS_COLORS[m.status] || 'info'} sx={{ p: 0.5, m: 0, fontSize: 12, width: 'fit-content' }}>
                          {m.status || 'pending'}
                        </Alert>
                      </TableCell>
                      <TableCell>{m.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</TableCell>
                      <TableCell>{m.opt_in_competitions ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{m.opt_in_aaga_challenge ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {m.pending_update ? (
                          <Alert severity="warning" sx={{ p: 0.5, m: 0, fontSize: 12 }}>Update Pending</Alert>
                        ) : ''}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            onClick={() => handleViewMember(m)}
                          >
                            VIEW
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="success"
                            onClick={() => handleStatus(m.id, 'approved')}
                            disabled={m.status === 'approved' || actionLoading[m.id]}
                          >
                            APPROVE
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            onClick={() => handleStatus(m.id, 'rejected')}
                            disabled={m.status === 'rejected' || actionLoading[m.id]}
                          >
                            REJECT
                          </Button>
                          {m.pending_update && (
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="warning"
                              onClick={() => handleViewUpdate(m)}
                            >
                              VIEW CHANGES
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Membership Reports</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Competition Participants</Typography>
                  <Typography variant="body2" color="text.primary" paragraph>
                    Members who have opted in to club competitions: {stats.optInCompetitions}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>AaGA Challenge Participants</Typography>
                  <Typography variant="body2" color="text.primary" paragraph>
                    Members who have opted in to the AaGA Challenge: {stats.optInAagaChallenge}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<DownloadIcon />}
                    onClick={openReportsExportMenu}
                    variant="contained"
                    color="primary"
                  >
                    Export Data
                  </Button>
                  <Menu
                    id="reports-export-menu"
                    anchorEl={reportsExportMenu}
                    keepMounted
                    open={Boolean(reportsExportMenu)}
                    onClose={closeReportsExportMenu}
                  >
                    <MenuItem onClick={() => handleExportCSV(true)}>
                      <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
                      Export as CSV
                    </MenuItem>
                    <MenuItem onClick={() => handleExportPDF('summary', true)}>
                      <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
                      Export Summary PDF
                    </MenuItem>
                    <MenuItem onClick={() => handleExportPDF('full', true)}>
                      <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
                      Export Full Details PDF
                    </MenuItem>
                    <MenuItem onClick={() => handleExportPDF('competitions', true)}>
                      <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
                      Export Competitions PDF
                    </MenuItem>
                    <MenuItem onClick={() => handleExportPDF('aaga', true)}>
                      <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
                      Export AaGA Challenge PDF
                    </MenuItem>
                  </Menu>
                </CardActions>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Membership Status</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Approved:</Typography>
                    <Typography variant="body2" fontWeight="bold">{stats.approved}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Pending:</Typography>
                    <Typography variant="body2" fontWeight="bold">{stats.pending}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Rejected:</Typography>
                    <Typography variant="body2" fontWeight="bold">{stats.rejected}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Paid:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">{stats.paid}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total:</Typography>
                    <Typography variant="body2" fontWeight="bold">{stats.total}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
        
        {/* Member Detail Dialog */}
        {openMemberDialog && selectedMember && (
          <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Member Details: {selectedMember.first_name} {selectedMember.surname}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Personal Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedMember.email}</Typography>
                    <Typography variant="body2"><strong>Date of Birth:</strong> {selectedMember.date_of_birth}</Typography>
                    <Typography variant="body2"><strong>Gender:</strong> {selectedMember.gender}</Typography>
                    <Typography variant="body2"><strong>Country of Birth:</strong> {selectedMember.country_of_birth}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Contact Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2"><strong>Address:</strong> {selectedMember.address}</Typography>
                    <Typography variant="body2"><strong>Post Code:</strong> {selectedMember.post_code}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedMember.phone}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Emergency Contact</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedMember.emergency_contact_name}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedMember.emergency_contact_phone}</Typography>
                    <Typography variant="body2"><strong>Relationship:</strong> {selectedMember.emergency_contact_relationship}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Membership Details</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2"><strong>Type:</strong> {selectedMember.membership_type === 'club' ? 'Club Membership' : 'Club + EA Affiliation'}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {selectedMember.status || 'pending'}</Typography>
                    <Typography variant="body2"><strong>Payment Status:</strong> {selectedMember.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</Typography>
                    <Typography variant="body2"><strong>Created:</strong> {new Date(selectedMember.created_at).toLocaleString()}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Preferences</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Club Competitions:</strong> {selectedMember.opt_in_competitions ? 'Opted In' : 'Not Opted In'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>AaGA Challenge:</strong> {selectedMember.opt_in_aaga_challenge ? 'Opted In' : 'Not Opted In'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Photos:</strong> {selectedMember.opt_out_photos ? 'Opted Out' : 'Not Opted Out'}
                    </Typography>
                  </Box>
                </Grid>
                {selectedMember.medical_conditions && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Medical Conditions</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">{selectedMember.medical_conditions}</Typography>
                    </Box>
                  </Grid>
                )}
                {selectedMember.signature_url && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Signature</Typography>
                    <Box sx={{ mt: 1 }}>
                      <img 
                        src={selectedMember.signature_url} 
                        alt="Member Signature" 
                        style={{ maxWidth: '100%', maxHeight: '100px', border: '1px solid #eee' }} 
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenMemberDialog(false)}>Close</Button>
              <Button 
                color="info" 
                variant="contained" 
                onClick={() => {
                  const newStatus = selectedMember.payment_status === 'paid' ? 'unpaid' : 'paid';
                  handlePaymentStatus(selectedMember.id, newStatus);
                  setOpenMemberDialog(false);
                }}
                sx={{ mr: 1 }}
              >
                {selectedMember.payment_status === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
              </Button>
              <Button 
                color="success" 
                variant="contained" 
                disabled={selectedMember.status === 'approved'}
                onClick={() => {
                  handleStatus(selectedMember.id, 'approved');
                  setOpenMemberDialog(false);
                }}
              >
                Approve Member
              </Button>
            </DialogActions>
          </Dialog>
        )}
        
        {/* Member Update Dialog */}
        {selectedMember && (
          <MemberUpdateDialog
            open={openUpdateDialog}
            onClose={() => setOpenUpdateDialog(false)}
            member={selectedMember}
            onApproveChanges={handleApproveChanges}
            loading={actionLoading[selectedMember.id]}
          />
        )}
        
        {/* Add Administrator Dialog */}
        <Dialog open={openAddAdminDialog} onClose={() => setOpenAddAdminDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Administrator</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Select a member to promote to administrator:
              </Typography>
              <TextField
                select
                label="Select Member"
                value={selectedAdminMember ? selectedAdminMember.email : ''}
                onChange={e => {
                  const m = members.find(mem => mem.email === e.target.value);
                  setSelectedAdminMember(m || null);
                }}
                fullWidth
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="">-- Select Member --</option>
                {members.map((member) => (
                  <option key={member.id} value={member.email}>
                    {member.first_name} {member.surname} ({member.email})
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Role"
                value={adminRole}
                onChange={e => setAdminRole(e.target.value)}
                fullWidth
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </TextField>
              {addAdminError && <Alert severity="error" sx={{ mb: 1 }}>{addAdminError}</Alert>}
              {addAdminSuccess && <Alert severity="success" sx={{ mb: 1 }}>{addAdminSuccess}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddAdminDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddAdmin}
              variant="contained"
              color="primary"
              disabled={addAdminLoading}
            >
              {addAdminLoading ? <CircularProgress size={22} /> : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AuthGuard>
  );
}
