import { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Paper, Avatar, 
  TextField, Button, Alert, CircularProgress, Divider,
  Grid, Tabs, Tab, Chip
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import AuthGuard from '../components/AuthGuard';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    first_name: '',
    surname: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    membership_type: '',
    membership_status: '',
    membership_expiry: '',
    england_athletics_number: ''
  });
  const [userInitials, setUserInitials] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.user) {
          throw new Error('Authentication error - please try logging out and back in');
        }
        
        const currentUser = sessionData.session.user;
        setUser(currentUser);
        
        // Generate initials from email
        const email = currentUser.email;
        const name = email.split('@')[0];
        const parts = name.split(/[._-]/);
        
        if (parts.length > 1) {
          setUserInitials(`${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase());
        } else if (name.length > 1) {
          setUserInitials(name.substring(0, 2).toUpperCase());
        } else {
          setUserInitials(name[0].toUpperCase());
        }
        
        // Fetch member profile data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('email', currentUser.email)
          .single();
          
        if (memberError && memberError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" - not an error if the user hasn't created a profile yet
          console.error('Error fetching member data:', memberError);
          setError('Failed to load your profile data. Please try again later.');
        } else if (memberData) {
          // Update profile data with fetched member data
          setProfileData({
            first_name: memberData.first_name || '',
            surname: memberData.surname || '',
            email: currentUser.email,
            phone: memberData.phone || '',
            address: memberData.address || '',
            emergency_contact_name: memberData.emergency_contact_name || '',
            emergency_contact_phone: memberData.emergency_contact_phone || '',
            membership_type: memberData.membership_type || '',
            membership_status: memberData.membership_status || '',
            membership_expiry: memberData.membership_expiry ? new Date(memberData.membership_expiry).toISOString().split('T')[0] : '',
            england_athletics_number: memberData.england_athletics_number || ''
          });
        } else {
          // Set default email if no profile exists yet
          setProfileData(prev => ({
            ...prev,
            email: currentUser.email
          }));
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Get current token for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication error - please try logging out and back in');
      }
      
      // Check if member record exists
      const { data: existingMember, error: checkError } = await supabase
        .from('members')
        .select('id')
        .eq('email', profileData.email)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing member:', checkError);
        throw new Error('Failed to check existing profile');
      }
      
      let result;
      
      if (existingMember) {
        // Update existing record
        const { data, error } = await supabase
          .from('members')
          .update({
            first_name: profileData.first_name,
            surname: profileData.surname,
            phone: profileData.phone,
            address: profileData.address,
            emergency_contact_name: profileData.emergency_contact_name,
            emergency_contact_phone: profileData.emergency_contact_phone,
            updated_at: new Date().toISOString()
          })
          .eq('email', profileData.email);
          
        if (error) throw error;
        result = data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('members')
          .insert({
            email: profileData.email,
            first_name: profileData.first_name,
            surname: profileData.surname,
            phone: profileData.phone,
            address: profileData.address,
            emergency_contact_name: profileData.emergency_contact_name,
            emergency_contact_phone: profileData.emergency_contact_phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
        result = data;
      }
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile | SADRC Membership</title>
        <meta name="description" content="Manage your SADRC membership profile" />
      </Head>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}
          >
            {userInitials}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Personal Information" />
            <Tab label="Membership Details" />
            <Tab label="Account Settings" />
          </Tabs>
          
          <Box sx={{ p: 3 }}>
            {/* Personal Information Tab */}
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Surname"
                    name="surname"
                    value={profileData.surname}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    disabled
                    variant="outlined"
                    margin="normal"
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Emergency Contact
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Name"
                    name="emergency_contact_name"
                    value={profileData.emergency_contact_name}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    name="emergency_contact_phone"
                    value={profileData.emergency_contact_phone}
                    onChange={handleInputChange}
                    variant="outlined"
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ px: 4, py: 1 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            )}
            
            {/* Membership Details Tab */}
            {tabValue === 1 && (
              <Box>
                <Box sx={{ mb: 4, p: 3, bgcolor: 'background.subtle', borderRadius: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Membership Type
                      </Typography>
                      <Typography variant="h6">
                        {profileData.membership_type || 'Not set'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Status
                      </Typography>
                      <Chip 
                        label={profileData.membership_status || 'Unknown'} 
                        color={profileData.membership_status === 'Active' ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Expiry Date
                      </Typography>
                      <Typography variant="h6">
                        {profileData.membership_expiry ? new Date(profileData.membership_expiry).toLocaleDateString() : 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box>
                  <Typography variant="h6" gutterBottom>
                    England Athletics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="England Athletics Number"
                        value={profileData.england_athletics_number || 'Not registered'}
                        disabled
                        variant="outlined"
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </Box>
                
                <Alert severity="info" sx={{ mt: 4 }}>
                  <Typography variant="body2">
                    Membership details are managed by club administrators. Please contact the membership secretary if you need to update this information.
                  </Typography>
                </Alert>
              </Box>
            )}
            
            {/* Account Settings Tab */}
            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Password Management
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => router.push('/reset-password')}
                  sx={{ mt: 1, mb: 3 }}
                >
                  Reset Password
                </Button>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                  Danger Zone
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error"
                  sx={{ mt: 1 }}
                >
                  Delete Account
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  This action cannot be undone. Please contact the membership secretary if you wish to delete your account.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default function Profile() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
