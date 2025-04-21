import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Container, Typography, Box, Button, Alert, CircularProgress } from '@mui/material';
import MemberForm from '../components/MemberForm';

export default function UpdateApplication() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Fetch the current member's data (assuming user is authenticated)
    const fetchMember = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to update your application.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', user.email)
        .single();
      if (error || !data) {
        setError('Could not find your membership record.');
      } else {
        setMember(data);
      }
      setLoading(false);
    };
    fetchMember();
  }, []);

  const handleSubmit = async (updatedData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // Include all fields that exist in the database
      const safeFields = [
        // Personal Information
        'first_name', 'surname', 'email', 'date_of_birth', 'gender', 'country_of_birth',
        // Contact Information
        'address', 'post_code', 'phone',
        // Emergency Contact
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
        // Medical & Membership
        'medical_conditions', 'membership_type',
        // Agreements & Preferences
        'agreed_policies', 'opt_in_competitions', 'opt_out_photos', 'opt_in_aaga_challenge',
        // Signature
        'signature_url'
        // Note: status, payment_status, pending_update, created_at, and updated_at are managed by the system
      ];
      
      // Create a filtered object with only the fields that exist in the database
      const dataToUpdate = { pending_update: true, updated_at: new Date().toISOString() };
      
      // Only copy fields that are in our safe list
      safeFields.forEach(field => {
        if (updatedData[field] !== undefined) {
          dataToUpdate[field] = updatedData[field];
        }
      });
      
      console.log('Updating member with data:', dataToUpdate);
      
      const { error } = await supabase
        .from('members')
        .update(dataToUpdate)
        .eq('id', member.id);
        
      if (error) {
        console.error('Update error:', error);
        setError(`Failed to update application: ${error.message}`);
      } else {
        setSuccess(true);
        // Refresh the member data
        const { data } = await supabase
          .from('members')
          .select('*')
          .eq('id', member.id)
          .single();
        if (data) setMember(data);
      }
    } catch (err) {
      console.error('Exception during update:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!member) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>Update Your Application</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>Your application update has been submitted!</Alert>}
      <MemberForm member={member} onSubmit={handleSubmit} submitLabel="Update Application" />
    </Container>
  );
}
