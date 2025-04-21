import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Container, Typography, Box, Paper, Grid, Divider, 
  CircularProgress, Alert, Button, Chip
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthGuard from '../components/AuthGuard';

export default function ViewApplication() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [member, setMember] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('You must be logged in to view your application');
          setLoading(false);
          return;
        }
        
        // Try flexible email matching for the current user
        let { data: members, error } = await supabase
          .from('members')
          .select('*')
          .ilike('email', `%${user.email.split('@')[0]}%`)
          .limit(5);
          
        if (error) {
          throw error;
        }
        
        // If we found matches with flexible search, use the first one
        let memberData = null;
        if (members && members.length > 0) {
          memberData = members[0];
        } else {
          // Try exact match as fallback
          const { data, error: exactError } = await supabase
            .from('members')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (exactError) {
            throw exactError;
          }
          
          memberData = data;
          
          // Special case for Brian
          if (!memberData && user.email.toLowerCase().includes('briandarrington')) {
            const { data: brianData } = await supabase
              .from('members')
              .select('*')
              .eq('email', 'briandarrington@btinternet.com')
              .maybeSingle();
              
            memberData = brianData;
          }
        }
        
        if (!memberData) {
          setError('No membership application found. Please apply for membership first.');
          setLoading(false);
          return;
        }
        
        setMember(memberData);
        
      } catch (err) {
        console.error('Error fetching member data:', err);
        setError('Failed to load your application. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMemberData();
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };
  
  return (
    <AuthGuard>
      <Head>
        <title>View My Application | SADRC Membership</title>
        <meta name="description" content="View your SADRC membership application details" />
      </Head>
      
      <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            My Membership Application
          </Typography>
          <Link href="/" passHref legacyBehavior>
            <Button variant="outlined">Back to Home</Button>
          </Link>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        ) : member ? (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            {/* Application Status */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" gutterBottom>Application Status</Typography>
              <Box>
                <Chip 
                  label={member.status === 'approved' ? 'Approved' : 
                         member.status === 'rejected' ? 'Rejected' : 'Pending'}
                  color={member.status === 'approved' ? 'success' : 
                         member.status === 'rejected' ? 'error' : 'warning'}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={member.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  color={member.payment_status === 'paid' ? 'info' : 'default'}
                />
                {member.pending_update && (
                  <Chip 
                    label="Update Pending"
                    color="secondary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </Box>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Personal Information */}
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">First Name</Typography>
                <Typography variant="body1">{member.first_name || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Surname</Typography>
                <Typography variant="body1">{member.surname || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography variant="body1">{member.email || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Date of Birth</Typography>
                <Typography variant="body1">{formatDate(member.date_of_birth)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Gender</Typography>
                <Typography variant="body1">{member.gender || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Country of Birth</Typography>
                <Typography variant="body1">{member.country_of_birth || 'Not provided'}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Contact Information */}
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Address</Typography>
                <Typography variant="body1">{member.address || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Post Code</Typography>
                <Typography variant="body1">{member.post_code || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography variant="body1">{member.phone || 'Not provided'}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Emergency Contact */}
            <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Name</Typography>
                <Typography variant="body1">{member.emergency_contact_name || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Phone</Typography>
                <Typography variant="body1">{member.emergency_contact_phone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Relationship</Typography>
                <Typography variant="body1">{member.emergency_contact_relationship || 'Not provided'}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Medical Information */}
            <Typography variant="h6" gutterBottom>Medical Information</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Medical Conditions</Typography>
                <Typography variant="body1">
                  {member.medical_conditions || 'None provided'}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Membership Details */}
            <Typography variant="h6" gutterBottom>Membership Details</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Membership Type</Typography>
                <Typography variant="body1">
                  {member.membership_type === 'club' ? 'Club Membership' : 
                   member.membership_type === 'ea' ? 'Club + EA Affiliation' : 
                   'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Application Date</Typography>
                <Typography variant="body1">{formatDate(member.created_at)}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Preferences */}
            <Typography variant="h6" gutterBottom>Preferences</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Club Competitions</Typography>
                <Typography variant="body1">
                  {member.opt_in_competitions ? 'Opted In' : 'Not Opted In'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">AaGA Challenge</Typography>
                <Typography variant="body1">
                  {member.opt_in_aaga_challenge ? 'Opted In' : 'Not Opted In'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Photo Consent</Typography>
                <Typography variant="body1">
                  {member.opt_out_photos ? 'Opted Out' : 'Not Opted Out'}
                </Typography>
              </Grid>
            </Grid>
            
            {/* Signature */}
            {member.signature_url && (
              <>
                <Divider sx={{ mb: 4 }} />
                <Typography variant="h6" gutterBottom>Signature</Typography>
                <Box sx={{ mb: 4 }}>
                  <img 
                    src={member.signature_url} 
                    alt="Signature" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100px', 
                      border: '1px solid #eee',
                      borderRadius: '4px'
                    }} 
                  />
                </Box>
              </>
            )}
            
            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/" passHref legacyBehavior>
                <Button variant="outlined">Back to Home</Button>
              </Link>
              <Link href="/update" passHref legacyBehavior>
                <Button variant="contained" color="primary">
                  Update My Application
                </Button>
              </Link>
            </Box>
          </Paper>
        ) : null}
      </Container>
    </AuthGuard>
  );
}
