import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { 
  Container, Typography, Box, Alert, CircularProgress, 
  Table, TableHead, TableRow, TableCell, TableBody, Paper, 
  Button, Tabs, Tab, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Chip, Grid,
  Card, CardContent, CardActions, Divider, Menu, MenuItem,
  IconButton, Tooltip, FormControl, FormLabel, RadioGroup,
  FormControlLabel, Radio, Checkbox, FormGroup
} from '@mui/material';
import AuthGuard from '../components/AuthGuard';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { exportMembersToPDF } from '../lib/pdfExportHelper';
import MemberUpdateDialog from '../components/MemberUpdateDialog';
import MembershipManagementDialog from '../components/MembershipManagementDialog';

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
    pendingUpdates: 0,
    active: 0,
    pendingMembership: 0,
    expired: 0
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
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportReportType, setExportReportType] = useState('summary');
  const [exportFields, setExportFields] = useState({
    personal: true,
    contact: true,
    membership: true,
    preferences: true,
    ea: true
  });
  const [exportLoading, setExportLoading] = useState(false);
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
        // Add default properties if they don't exist
        const processedData = data.map(member => ({
          ...member,
          payment_status: member.payment_status || 'unpaid',
          membership_status: member.membership_status || 'pending',
          membership_expiry: member.membership_expiry || null
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
        member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.ea_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'pending_updates') {
        filtered = filtered.filter(member => member.pending_update === true);
      } else if (activeFilter === 'active') {
        filtered = filtered.filter(member => member.membership_status === 'active');
      } else if (activeFilter === 'pending') {
        filtered = filtered.filter(member => member.membership_status === 'pending');
      } else if (activeFilter === 'expired') {
        filtered = filtered.filter(member => member.membership_status === 'expired');
      } else {
        filtered = filtered.filter(member => member.status === activeFilter);
      }
    }
    
    setFilteredMembers(filtered);
  };

  const calculateStats = () => {
    const newStats = {
      total: members.length,
      approved: members.filter(m => m.status === 'approved').length,
      pending: members.filter(m => m.status === 'pending').length,
      rejected: members.filter(m => m.status === 'rejected').length,
      optInCompetitions: members.filter(m => m.opt_in_competitions === true).length,
      optInAagaChallenge: members.filter(m => m.opt_in_aaga_challenge === true).length,
      paid: members.filter(m => m.payment_status === 'paid').length,
      pendingUpdates: members.filter(m => m.pending_update === true).length,
      active: members.filter(m => m.membership_status === 'active').length,
      pendingMembership: members.filter(m => m.membership_status === 'pending').length,
      expired: members.filter(m => m.membership_status === 'expired').length
    };
    
    setStats(newStats);
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
  
  const handleManageMembership = (member) => {
    setSelectedMember(member);
    setOpenMembershipDialog(true);
  };
  
  const handleMemberUpdated = (updatedMember) => {
    // Update the member in the members array
    const updatedMembers = members.map(m => 
      m.id === updatedMember.id ? updatedMember : m
    );
    setMembers(updatedMembers);
    
    // Also update the selected member
    if (selectedMember && selectedMember.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
    
    // Recalculate stats and filtered members
    calculateStats();
    filterMembers();
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

  const handleOpenExportDialog = () => {
    closeExportMenu();
    setOpenExportDialog(true);
  };

  const handleExportCSV = (fromReports = false) => {
    try {
      setExportLoading(true);
      
      // Determine which fields to include based on export options
      const fieldsToInclude = [];
      
      if (exportFields.personal) {
        fieldsToInclude.push('First Name', 'Surname', 'Date of Birth');
      }
      
      if (exportFields.contact) {
        fieldsToInclude.push('Email', 'Phone', 'Address', 'Post Code');
      }
      
      if (exportFields.membership) {
        fieldsToInclude.push('Membership Status', 'Membership Type', 'Expiry Date', 'Payment Status');
      }
      
      if (exportFields.preferences) {
        fieldsToInclude.push('Competitions', 'AaGA Challenge', 'Photos Opt-out');
      }
      
      if (exportFields.ea) {
        fieldsToInclude.push('EA Number');
      }
      
      // Filter members based on report type
      let membersToExport = [...filteredMembers];
      if (exportReportType === 'active') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'active');
      } else if (exportReportType === 'pending') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'pending');
      } else if (exportReportType === 'expired') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'expired');
      } else if (exportReportType === 'competitions') {
        membersToExport = membersToExport.filter(m => m.opt_in_competitions);
      } else if (exportReportType === 'aaga') {
        membersToExport = membersToExport.filter(m => m.opt_in_aaga_challenge);
      }
      
      // Create CSV content with selected fields
      const csvRows = [fieldsToInclude];
      
      membersToExport.forEach(member => {
        const row = [];
        
        fieldsToInclude.forEach(field => {
          switch(field) {
            case 'First Name':
              row.push(member.first_name || '');
              break;
            case 'Surname':
              row.push(member.surname || '');
              break;
            case 'Email':
              row.push(member.email || '');
              break;
            case 'Phone':
              row.push(member.phone || '');
              break;
            case 'Date of Birth':
              row.push(member.date_of_birth || '');
              break;
            case 'Address':
              row.push(member.address || '');
              break;
            case 'Post Code':
              row.push(member.post_code || '');
              break;
            case 'Membership Status':
              row.push(member.membership_status || 'pending');
              break;
            case 'Membership Type':
              row.push(member.membership_type || '');
              break;
            case 'Expiry Date':
              row.push(member.membership_expiry || '');
              break;
            case 'Payment Status':
              row.push(member.payment_status || 'unpaid');
              break;
            case 'Competitions':
              row.push(member.opt_in_competitions ? 'Yes' : 'No');
              break;
            case 'AaGA Challenge':
              row.push(member.opt_in_aaga_challenge ? 'Yes' : 'No');
              break;
            case 'Photos Opt-out':
              row.push(member.opt_out_photos ? 'Yes' : 'No');
              break;
            case 'EA Number':
              row.push(member.ea_number || '');
              break;
            default:
              row.push('');
          }
        });
        
        csvRows.push(row);
      });
      
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `members-${exportReportType}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setOpenExportDialog(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      setExportLoading(true);
      
      // Filter members based on report type
      let membersToExport = [...filteredMembers];
      if (exportReportType === 'active') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'active');
      } else if (exportReportType === 'pending') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'pending');
      } else if (exportReportType === 'expired') {
        membersToExport = membersToExport.filter(m => m.membership_status === 'expired');
      } else if (exportReportType === 'competitions') {
        membersToExport = membersToExport.filter(m => m.opt_in_competitions);
      } else if (exportReportType === 'aaga') {
        membersToExport = membersToExport.filter(m => m.opt_in_aaga_challenge);
      }
      
      exportMembersToPDF(membersToExport, exportReportType);
      setOpenExportDialog(false);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      handleExportCSV();
    } else {
      handleExportPDF();
    }
  };

  return (
    <AuthGuard requiredRole="admin">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Membership Administration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={fetchMembers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={handleOpenExportDialog}
              aria-controls="export-menu"
              aria-haspopup="true"
            >
              Export
            </Button>
          </Box>
        </Box>
        
        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="primary">{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Members</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="success.main">{stats.active || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Active Members</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="warning.main">{stats.pendingMembership || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Pending Members</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h5" color="error.main">{stats.expired || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Expired Members</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Filter tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={activeFilter} 
            onChange={(e, newValue) => setActiveFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${stats.total})`} value="all" />
            <Tab label={`Active (${stats.active || 0})`} value="active" />
            <Tab label={`Pending (${stats.pendingMembership || 0})`} value="pending" />
            <Tab label={`Expired (${stats.expired || 0})`} value="expired" />
            <Tab label={`Approved (${stats.approved})`} value="approved" />
            <Tab label={`Awaiting Approval (${stats.pending})`} value="pending_approval" />
            <Tab label={`Pending Updates (${stats.pendingUpdates})`} value="pending_updates" />
          </Tabs>
        </Box>
        
        {/* Members table */}
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search members..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Application Status</TableCell>
                <TableCell>Membership Status</TableCell>
                <TableCell>EA Number</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {member.first_name} {member.surname}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{member.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.status || 'pending'} 
                        color={STATUS_COLORS[member.status] || 'default'}
                        size="small"
                      />
                      {member.pending_update && (
                        <Chip 
                          label="Update Pending" 
                          color="info"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.membership_status || 'pending'} 
                        color={
                          member.membership_status === 'active' ? 'success' :
                          member.membership_status === 'pending' ? 'warning' :
                          member.membership_status === 'expired' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {member.ea_number || 'Not registered'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={member.payment_status === 'paid' ? 'Paid' : 'Unpaid'} 
                        color={member.payment_status === 'paid' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewMember(member)}
                          >
                            <SearchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {member.pending_update && (
                          <Tooltip title="Review Updates">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewUpdate(member)}
                              color="info"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Manage Membership">
                          <IconButton 
                            size="small" 
                            onClick={() => handleManageMembership(member)}
                            color="primary"
                          >
                            <ManageAccountsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
        
        {/* Member View Dialog */}
        {selectedMember && (
          <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Member Details
              <Typography variant="subtitle2" color="text.secondary">
                {selectedMember.first_name} {selectedMember.surname}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2"><strong>Email:</strong> {selectedMember.email}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedMember.phone || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Date of Birth:</strong> {selectedMember.date_of_birth || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Gender:</strong> {selectedMember.gender || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Address:</strong> {selectedMember.address || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Post Code:</strong> {selectedMember.post_code || 'Not provided'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Membership Details</Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      <strong>Application Status:</strong> {selectedMember.status || 'Pending'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Membership Status:</strong> {selectedMember.membership_status || 'Pending'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Membership Type:</strong> {
                        selectedMember.membership_type === 'club' ? 'Club Membership' : 
                        selectedMember.membership_type === 'ea' ? 'Club + EA Affiliation' : 
                        selectedMember.membership_type || 'Not specified'
                      }
                    </Typography>
                    <Typography variant="body2">
                      <strong>EA Number:</strong> {selectedMember.ea_number || 'Not registered'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Membership Expiry:</strong> {selectedMember.membership_expiry || 'Not set'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payment Status:</strong> {selectedMember.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Emergency Contact</Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedMember.emergency_contact_name || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedMember.emergency_contact_phone || 'Not provided'}</Typography>
                    <Typography variant="body2"><strong>Relationship:</strong> {selectedMember.emergency_contact_relationship || 'Not provided'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" gutterBottom>Preferences</Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2">
                      <strong>Competitions Opt-in:</strong> {selectedMember.opt_in_competitions ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Photos Opt-out:</strong> {selectedMember.opt_out_photos ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>AaGA Challenge Opt-in:</strong> {selectedMember.opt_in_aaga_challenge ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Grid>
                
                {selectedMember.signature_url && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>Signature</Typography>
                    <Box sx={{ ml: 2 }}>
                      <img 
                        src={selectedMember.signature_url} 
                        alt="Signature" 
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
        
        {/* Membership Management Dialog */}
        {selectedMember && (
          <MembershipManagementDialog
            open={openMembershipDialog}
            onClose={() => setOpenMembershipDialog(false)}
            member={selectedMember}
            onMemberUpdated={handleMemberUpdated}
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
        
        {/* Export Options Dialog */}
        <Dialog 
          open={openExportDialog} 
          onClose={() => setOpenExportDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Export Membership Data</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Export Format</FormLabel>
                <RadioGroup
                  row
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <FormControlLabel value="csv" control={<Radio />} label="CSV" />
                  <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
                </RadioGroup>
              </FormControl>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Report Type</FormLabel>
                <RadioGroup
                  value={exportReportType}
                  onChange={(e) => setExportReportType(e.target.value)}
                >
                  <FormControlLabel value="summary" control={<Radio />} label="All Members" />
                  <FormControlLabel value="active" control={<Radio />} label="Active Members Only" />
                  <FormControlLabel value="pending" control={<Radio />} label="Pending Members Only" />
                  <FormControlLabel value="expired" control={<Radio />} label="Expired Members Only" />
                  <FormControlLabel value="competitions" control={<Radio />} label="Competition Participants" />
                  <FormControlLabel value="aaga" control={<Radio />} label="AaGA Challenge Participants" />
                </RadioGroup>
              </FormControl>
            </Box>
            
            {exportFormat === 'csv' && (
              <Box>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Fields to Include</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox checked={exportFields.personal} onChange={(e) => setExportFields({...exportFields, personal: e.target.checked})} />}
                      label="Personal Information (Name, DOB)"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={exportFields.contact} onChange={(e) => setExportFields({...exportFields, contact: e.target.checked})} />}
                      label="Contact Information (Email, Phone, Address)"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={exportFields.membership} onChange={(e) => setExportFields({...exportFields, membership: e.target.checked})} />}
                      label="Membership Details (Status, Type, Expiry, Payment)"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={exportFields.preferences} onChange={(e) => setExportFields({...exportFields, preferences: e.target.checked})} />}
                      label="Preferences (Competitions, AaGA, Photos)"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={exportFields.ea} onChange={(e) => setExportFields({...exportFields, ea: e.target.checked})} />}
                      label="England Athletics Number"
                    />
                  </FormGroup>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenExportDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleExport} 
              variant="contained" 
              color="primary"
              disabled={exportLoading}
              startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AuthGuard>
  );
}
