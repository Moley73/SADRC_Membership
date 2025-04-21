import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Button, TextField, 
  Table, TableHead, TableBody, TableRow, TableCell,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, Alert, Snackbar, IconButton,
  Tooltip, Chip
} from '@mui/material';
import Head from 'next/head';
import AuthGuard from '../components/AuthGuard';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { supabase } from '../lib/supabaseClient';

export default function ManagePage() {
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');

  useEffect(() => {
    fetchUsers();
    fetchMembers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to view this page');
        setLoading(false);
        return;
      }
      
      // Query admin_list table
      const { data, error } = await supabase
        .from('admin_list')
        .select('*')
        .order('email');
        
      if (error) {
        console.error('Error fetching admin list:', error);
        // Fallback to hardcoded data
        const hardcodedUsers = [{
          id: '1',
          email: 'briandarrington@btinternet.com',
          role: 'super_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }];
        
        setUsers(hardcodedUsers);
      } else {
        // Process data to ensure consistent structure
        const processedData = (data || []).map(admin => {
          // If name is missing, create a display name from email
          if (!admin.hasOwnProperty('name')) {
            admin.name = admin.email.split('@')[0];
          }
          return admin;
        });
        setUsers(processedData);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user roles. Please try again.');
      setLoading(false);
      
      // Fallback to hardcoded data if API fails
      const hardcodedUsers = [{
        id: '1',
        email: 'briandarrington@btinternet.com',
        role: 'super_admin',
        name: 'Brian Darrington',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }];
      
      setUsers(hardcodedUsers);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, email, first_name, surname')
        .order('surname', { ascending: true });
        
      if (error) throw error;
      
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setOpenDialog(true);
  };

  const handleUpdateRole = async () => {
    try {
      setLoading(true);
      
      // Update admin_list
      const { error } = await supabase
        .from('admin_list')
        .update({ 
          role: newRole, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedUser.id);
        
      if (error) {
        console.error('Error updating admin_list:', error);
        setNotification({
          open: true,
          message: `Error updating role: ${error.message}`,
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      setNotification({
        open: true,
        message: `User role updated successfully to ${newRole}`,
        severity: 'success'
      });
      
      setOpenDialog(false);
      fetchUsers(); // Refresh the list
      setLoading(false);
    } catch (err) {
      console.error('Error updating role:', err);
      setNotification({
        open: true,
        message: `Error updating role: ${err.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to remove ${user.email}'s role?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete from admin_list
      const { error } = await supabase
        .from('admin_list')
        .delete()
        .eq('id', user.id);
        
      if (error) {
        console.error('Error deleting from admin_list:', error);
        setNotification({
          open: true,
          message: `Error removing user: ${error.message}`,
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      setNotification({
        open: true,
        message: `Removed ${user.email} from admin roles`,
        severity: 'success'
      });
      
      fetchUsers(); // Refresh the list
      setLoading(false);
    } catch (err) {
      console.error('Error removing user:', err);
      setNotification({
        open: true,
        message: `Error removing user: ${err.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setAddUserDialog(true);
  };

  const handleAddUserSubmit = async () => {
    try {
      setLoading(true);
      
      // First check if user already exists in admin_list
      let existingAdmin = null;
      try {
        const { data, error } = await supabase
          .from('admin_list')
          .select('id')
          .eq('email', newUserEmail)
          .maybeSingle();
          
        if (!error) {
          existingAdmin = data;
        } else {
          console.error('Error checking existing admin:', error);
        }
      } catch (checkErr) {
        console.error('Exception checking existing admin:', checkErr);
      }
      
      if (existingAdmin) {
        setNotification({
          open: true,
          message: 'This user is already an administrator',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }
      
      // Get user name from members if possible
      const memberDetails = getMemberDetails(newUserEmail);
      const displayName = memberDetails ? 
        `${memberDetails.first_name || ''} ${memberDetails.surname || ''}`.trim() : 
        newUserEmail.split('@')[0];
      
      // Try to add to admin_list with error handling
      try {
        // First, let's check the table structure
        console.log('Checking admin_list table structure...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('admin_list')
          .select('*')
          .limit(1);
          
        if (tableError) {
          console.error('Error checking table structure:', tableError);
        } else {
          console.log('Table columns:', tableInfo);
        }
        
        // Insert with minimal required fields
        const { data, error } = await supabase
          .from('admin_list')
          .insert({
            email: newUserEmail,
            role: newUserRole
          });
          
        if (error) {
          console.error('Insert error details:', error);
          throw error;
        }
        
        setNotification({
          open: true,
          message: `Administrator ${newUserEmail} added successfully`,
          severity: 'success'
        });
        
        setAddUserDialog(false);
        setNewUserEmail('');
        setNewUserRole('admin');
        fetchUsers(); // Refresh the list
      } catch (insertErr) {
        console.error('Error adding administrator:', insertErr);
        setNotification({
          open: true,
          message: `Error adding administrator: ${insertErr.message}`,
          severity: 'error'
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error in handleAddUserSubmit:', err);
      setNotification({
        open: true,
        message: `Unexpected error: ${err.message}`,
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <SupervisorAccountIcon color="error" />;
      case 'admin':
        return <AdminPanelSettingsIcon color="primary" />;
      case 'editor':
        return <EditNoteIcon color="success" />;
      default:
        return <PersonIcon color="action" />;
    }
  };

  const getRoleChip = (role) => {
    switch (role) {
      case 'super_admin':
        return <Chip 
          icon={<SupervisorAccountIcon />} 
          label="Super Admin" 
          color="error" 
          size="small" 
        />;
      case 'admin':
        return <Chip 
          icon={<AdminPanelSettingsIcon />} 
          label="Admin" 
          color="primary" 
          size="small" 
        />;
      case 'editor':
        return <Chip 
          icon={<EditNoteIcon />} 
          label="Editor" 
          color="success" 
          size="small" 
        />;
      default:
        return <Chip 
          icon={<PersonIcon />} 
          label="Member" 
          variant="outlined" 
          size="small" 
        />;
    }
  };

  const getMemberDetails = (email) => {
    if (!email) return null;
    
    const member = members.find(m => 
      m.email.toLowerCase() === email.toLowerCase() ||
      (m.email.includes('@') && m.email.split('@')[0].toLowerCase() === email.split('@')[0].toLowerCase())
    );
    
    return member;
  };

  return (
    <AuthGuard superAdminOnly={true}>
      <Head>
        <title>Manage Administrators | SADRC Membership</title>
        <meta name="description" content="Manage administrator access for SADRC membership system" />
      </Head>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            <AdminPanelSettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Manage Administrators
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PersonAddIcon />} 
              onClick={handleAddUser}
            >
              Add Administrator
            </Button>
          </Box>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            User Roles Management
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Manage administrator access for the SADRC membership system. Super Admins can add or remove admin rights.
          </Typography>
          
          <TextField
            label="Search by email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ mt: 4 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            ) : filteredUsers.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No users found. {searchTerm ? 'Try a different search term.' : 'Add administrators using the button above.'}
              </Alert>
            ) : (
              <Paper elevation={3}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ 
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                      '& th': {
                        color: theme => theme.palette.mode === 'dark' ? 'common.white' : 'text.primary',
                        fontWeight: 'bold'
                      }
                    }}>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Last Updated</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const memberDetails = getMemberDetails(user.email);
                        return (
                          <TableRow key={user.id} hover>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {memberDetails ? 
                                `${memberDetails.first_name || ''} ${memberDetails.surname || ''}` : 
                                'Not a member'}
                            </TableCell>
                            <TableCell>
                              {getRoleChip(user.role)}
                            </TableCell>
                            <TableCell>
                              {new Date(user.updated_at).toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Tooltip title="Edit Role">
                                  <span>
                                    <IconButton 
                                      color="primary" 
                                      onClick={() => handleEditRole(user)}
                                      disabled={user.role === 'super_admin' && user.email === 'briandarrington@btinternet.com'}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Remove Role">
                                  <span>
                                    <IconButton 
                                      color="error" 
                                      onClick={() => handleDeleteUser(user)}
                                      disabled={user.role === 'super_admin' && user.email === 'briandarrington@btinternet.com'}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            )}
          </Box>
        </Paper>
      </Container>
      
      {/* Edit Role Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <Typography variant="body1" gutterBottom>
              Email: {selectedUser?.email}
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={newRole}
                label="Role"
                onChange={(e) => setNewRole(e.target.value)}
                disabled={selectedUser?.role === 'super_admin' && selectedUser?.email === 'briandarrington@btinternet.com'}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Update Role'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add User Dialog */}
      <Dialog open={addUserDialog} onClose={() => setAddUserDialog(false)}>
        <DialogTitle>Add Administrator</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 300 }}>
            <TextField
              label="Email Address"
              fullWidth
              margin="normal"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              helperText="User must have registered and created an account"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="new-role-select-label">Role</InputLabel>
              <Select
                labelId="new-role-select-label"
                value={newUserRole}
                label="Role"
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddUserSubmit} 
            variant="contained" 
            color="primary" 
            disabled={loading || !newUserEmail}
          >
            {loading ? <CircularProgress size={24} /> : 'Add Administrator'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </AuthGuard>
  );
}
