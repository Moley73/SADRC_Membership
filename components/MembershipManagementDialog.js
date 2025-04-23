import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Grid, TextField, MenuItem,
  FormControl, InputLabel, Select, CircularProgress,
  Alert, Divider
} from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import dayjs from 'dayjs';

export default function MembershipManagementDialog({ 
  open, 
  onClose, 
  member, 
  onMemberUpdated
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    membership_status: member?.membership_status || 'active',
    ea_number: member?.ea_number || '',
    membership_expiry: member?.membership_expiry || dayjs().add(1, 'year').format('YYYY-MM-DD')
  });

  // Reset form data when member changes
  useState(() => {
    if (member) {
      setFormData({
        membership_status: member.membership_status || 'active',
        ea_number: member.ea_number || '',
        membership_expiry: member.membership_expiry || dayjs().add(1, 'year').format('YYYY-MM-DD')
      });
    }
  }, [member]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate data
      if (!formData.membership_status) {
        throw new Error('Membership status is required');
      }

      // Format expiry date if provided
      let formattedData = { ...formData };
      if (formData.membership_expiry) {
        try {
          // Ensure date is in YYYY-MM-DD format
          formattedData.membership_expiry = dayjs(formData.membership_expiry).format('YYYY-MM-DD');
        } catch (err) {
          throw new Error('Invalid expiry date format');
        }
      }

      // Update member in database
      const { data, error } = await supabase
        .from('members')
        .update(formattedData)
        .eq('id', member.id)
        .select();

      if (error) throw error;

      setSuccess('Membership details updated successfully');
      
      // Call the callback with updated member data
      if (onMemberUpdated && data && data.length > 0) {
        onMemberUpdated(data[0]);
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating membership:', err);
      setError(err.message || 'Failed to update membership details');
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage Membership Details
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          {member.first_name} {member.surname}
        </Typography>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="membership-status-label">Membership Status</InputLabel>
                <Select
                  labelId="membership-status-label"
                  value={formData.membership_status || 'active'}
                  label="Membership Status"
                  onChange={(e) => handleChange('membership_status', e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="England Athletics Number"
                value={formData.ea_number || ''}
                onChange={(e) => handleChange('ea_number', e.target.value)}
                placeholder="Enter EA registration number"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Membership Expiry Date"
                type="date"
                value={formData.membership_expiry || ''}
                onChange={(e) => handleChange('membership_expiry', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary">
            These changes will be immediately reflected in the member's profile and dashboard.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
