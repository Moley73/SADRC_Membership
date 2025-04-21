import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Container, Typography, Box, Paper, Tabs, Tab, Alert, 
  CircularProgress, Divider, Button, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Switch,
  FormControlLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import { supabase } from '../../lib/supabaseClient';
import AuthGuard from '../../components/AuthGuard';

function AwardsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [members, setMembers] = useState([]);
  const [voteStats, setVoteStats] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [nominationDialog, setNominationDialog] = useState({
    open: false,
    nomination: null
  });
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    current_phase: 'inactive',
    nomination_start_date: null,
    nomination_end_date: null,
    voting_start_date: null,
    voting_end_date: null,
    active_year: new Date().getFullYear()
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch award settings
        const settingsRes = await fetch('/api/awards/settings');
        if (!settingsRes.ok) {
          throw new Error('Failed to fetch award settings');
        }
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        
        // Initialize settings form
        if (settingsData) {
          setSettingsForm({
            ...settingsData,
            nomination_start_date: settingsData.nomination_start_date ? new Date(settingsData.nomination_start_date) : null,
            nomination_end_date: settingsData.nomination_end_date ? new Date(settingsData.nomination_end_date) : null,
            voting_start_date: settingsData.voting_start_date ? new Date(settingsData.voting_start_date) : null,
            voting_end_date: settingsData.voting_end_date ? new Date(settingsData.voting_end_date) : null,
          });
        }

        // Fetch award categories
        const categoriesRes = await fetch('/api/awards/categories');
        if (!categoriesRes.ok) {
          throw new Error('Failed to fetch award categories');
        }
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        // Fetch all nominations
        const nominationsRes = await fetch('/api/awards/nominations');
        if (!nominationsRes.ok) {
          throw new Error('Failed to fetch nominations');
        }
        const nominationsData = await nominationsRes.json();
        setNominations(nominationsData);
        
        // Fetch club members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname');
          
        if (membersError) throw membersError;
        setMembers(membersData || []);
        
        // Fetch voting stats
        const statsRes = await fetch('/api/awards/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setVoteStats(statsData);
        }

      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (name, date) => {
    setSettingsForm(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const res = await fetch('/api/awards/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...settingsForm,
          id: settings.id
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      const updatedSettings = await res.json();
      setSettings(updatedSettings);
      
      setSuccess('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePhase = async (phase) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const res = await fetch('/api/awards/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phase,
          settingsId: settings.id
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to change phase');
      }
      
      const updatedSettings = await res.json();
      setSettings(updatedSettings);
      setSettingsForm(prev => ({
        ...prev,
        current_phase: phase
      }));
      
      setSuccess(`Phase changed to ${phase} successfully`);
    } catch (err) {
      console.error('Error changing phase:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateNominationStatus = async (nominationId, status) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/awards/nominations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nominationId,
          status
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update nomination status');
      }
      
      // Update the nominations list
      setNominations(prev => 
        prev.map(nom => 
          nom.id === nominationId ? { ...nom, status } : nom
        )
      );
      
      setSuccess(`Nomination ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Error updating nomination status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewNomination = (nomination) => {
    setNominationDialog({
      open: true,
      nomination
    });
  };
  
  const handleCloseNominationDialog = () => {
    setNominationDialog({
      open: false,
      nomination: null
    });
  };
  
  const formatMemberName = (email) => {
    const member = members.find(m => m.email === email);
    if (member) {
      return `${member.first_name} ${member.surname}`;
    }
    return email;
  };
  
  const renderSettingsTab = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Awards System Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="phase-label">Current Phase</InputLabel>
              <Select
                labelId="phase-label"
                name="current_phase"
                value={settingsForm.current_phase}
                onChange={handleSettingsChange}
                label="Current Phase"
                disabled={true} // Phase is changed via buttons, not directly
              >
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="nomination">Nomination</MenuItem>
                <MenuItem value="voting">Voting</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              name="active_year"
              label="Active Year"
              type="number"
              value={settingsForm.active_year}
              onChange={handleSettingsChange}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Change Phase
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleChangePhase('inactive')}
                  disabled={settings?.current_phase === 'inactive'}
                >
                  Set Inactive
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleChangePhase('nomination')}
                  disabled={settings?.current_phase === 'nomination'}
                >
                  Start Nominations
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleChangePhase('voting')}
                  disabled={settings?.current_phase === 'voting'}
                >
                  Start Voting
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => handleChangePhase('completed')}
                  disabled={settings?.current_phase === 'completed'}
                >
                  Complete Awards
                </Button>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Nomination Start Date"
                value={settingsForm.nomination_start_date}
                onChange={(date) => handleDateChange('nomination_start_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
              
              <DateTimePicker
                label="Nomination End Date"
                value={settingsForm.nomination_end_date}
                onChange={(date) => handleDateChange('nomination_end_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Voting Start Date"
                value={settingsForm.voting_start_date}
                onChange={(date) => handleDateChange('voting_start_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
              
              <DateTimePicker
                label="Voting End Date"
                value={settingsForm.voting_end_date}
                onChange={(date) => handleDateChange('voting_end_date', date)}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderNominationsTab = () => {
    const pendingNominations = nominations.filter(nom => nom.status === 'pending');
    const approvedNominations = nominations.filter(nom => nom.status === 'approved');
    const rejectedNominations = nominations.filter(nom => nom.status === 'rejected');
    
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Nominations
        </Typography>
        
        <Tabs value={activeTab === 1 ? 0 : activeTab - 1} onChange={(e, val) => setActiveTab(val + 1)}>
          <Tab label={`Pending (${pendingNominations.length})`} />
          <Tab label={`Approved (${approvedNominations.length})`} />
          <Tab label={`Rejected (${rejectedNominations.length})`} />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Nominee</TableCell>
                    <TableCell>Nominator</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingNominations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No pending nominations
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingNominations.map(nomination => {
                      const category = categories.find(c => c.id === nomination.category_id);
                      
                      return (
                        <TableRow key={nomination.id}>
                          <TableCell>{category?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominee_email)}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominator_email)}</TableCell>
                          <TableCell>{new Date(nomination.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleViewNomination(nomination)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton 
                              color="success" 
                              onClick={() => handleUpdateNominationStatus(nomination.id, 'approved')}
                              size="small"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                            <IconButton 
                              color="error" 
                              onClick={() => handleUpdateNominationStatus(nomination.id, 'rejected')}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {activeTab === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Nominee</TableCell>
                    <TableCell>Nominator</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedNominations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No approved nominations
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedNominations.map(nomination => {
                      const category = categories.find(c => c.id === nomination.category_id);
                      
                      return (
                        <TableRow key={nomination.id}>
                          <TableCell>{category?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominee_email)}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominator_email)}</TableCell>
                          <TableCell>{new Date(nomination.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleViewNomination(nomination)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {activeTab === 3 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Nominee</TableCell>
                    <TableCell>Nominator</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rejectedNominations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No rejected nominations
                      </TableCell>
                    </TableRow>
                  ) : (
                    rejectedNominations.map(nomination => {
                      const category = categories.find(c => c.id === nomination.category_id);
                      
                      return (
                        <TableRow key={nomination.id}>
                          <TableCell>{category?.name || 'Unknown'}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominee_email)}</TableCell>
                          <TableCell>{formatMemberName(nomination.nominator_email)}</TableCell>
                          <TableCell>{new Date(nomination.created_at).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              color="primary" 
                              onClick={() => handleViewNomination(nomination)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <IconButton 
                              color="success" 
                              onClick={() => handleUpdateNominationStatus(nomination.id, 'approved')}
                              size="small"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    );
  };
  
  const renderResultsTab = () => {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Voting Results
        </Typography>
        
        {voteStats.length === 0 ? (
          <Alert severity="info">No voting data available yet.</Alert>
        ) : (
          <Grid container spacing={2}>
            {categories.map(category => {
              const categoryStat = voteStats.find(stat => stat.category_id === category.id);
              
              if (!categoryStat) return null;
              
              return (
                <Grid item xs={12} key={category.id}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {category.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Votes
                        </Typography>
                        <Typography variant="h5">
                          {categoryStat.total_votes}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Nominations
                        </Typography>
                        <Typography variant="h5">
                          {categoryStat.total_nominations}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Approved
                        </Typography>
                        <Typography variant="h5">
                          {categoryStat.approved_nominations}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      color="primary"
                      startIcon={<BarChartIcon />}
                      onClick={() => {
                        // This would navigate to a detailed results page
                        // router.push(`/awards/results/${category.id}`);
                      }}
                    >
                      View Detailed Results
                    </Button>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  };

  if (loading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>SADRC Members Area - Awards Administration</title>
        <meta name="description" content="Manage SADRC club awards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Awards Administration
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="awards admin tabs"
            >
              <Tab label="Settings" />
              <Tab label="Nominations" />
              <Tab label="Results" />
            </Tabs>
          </Box>
          
          {activeTab === 0 && renderSettingsTab()}
          {activeTab === 1 && renderNominationsTab()}
          {activeTab === 2 && renderResultsTab()}
        </Paper>
      </Container>
      
      {/* Nomination Detail Dialog */}
      <Dialog
        open={nominationDialog.open}
        onClose={handleCloseNominationDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nomination Details
        </DialogTitle>
        <DialogContent>
          {nominationDialog.nomination && (
            <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {categories.find(c => c.id === nominationDialog.nomination.category_id)?.name || 'Unknown'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={nominationDialog.nomination.status.charAt(0).toUpperCase() + nominationDialog.nomination.status.slice(1)} 
                    color={
                      nominationDialog.nomination.status === 'approved' ? 'success' : 
                      nominationDialog.nomination.status === 'rejected' ? 'error' : 
                      'default'
                    }
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nominee
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatMemberName(nominationDialog.nomination.nominee_email)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {nominationDialog.nomination.nominee_email}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nominated By
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatMemberName(nominationDialog.nomination.nominator_email)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {nominationDialog.nomination.nominator_email}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nomination Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(nominationDialog.nomination.created_at).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Reason for Nomination
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Typography variant="body1">
                      {nominationDialog.nomination.reason}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {nominationDialog.nomination && nominationDialog.nomination.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  handleUpdateNominationStatus(nominationDialog.nomination.id, 'approved');
                  handleCloseNominationDialog();
                }} 
                color="success"
                variant="contained"
              >
                Approve
              </Button>
              <Button 
                onClick={() => {
                  handleUpdateNominationStatus(nominationDialog.nomination.id, 'rejected');
                  handleCloseNominationDialog();
                }} 
                color="error"
                variant="contained"
              >
                Reject
              </Button>
            </>
          )}
          <Button onClick={handleCloseNominationDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function AwardsAdmin() {
  return (
    <AuthGuard superAdminOnly={true}>
      <AwardsAdminPage />
    </AuthGuard>
  );
}
