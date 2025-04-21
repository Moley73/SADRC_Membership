import { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Grid, Divider, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function MemberUpdateDialog({ 
  open, 
  onClose, 
  member, 
  onApproveChanges, 
  loading 
}) {
  if (!member) return null;

  // Function to compare and display changes
  const getChanges = () => {
    // We need to get the previous values from the member's history or compare with a snapshot
    // For now, we'll just show the current values and indicate they were updated
    const changes = [];
    
    // Fields that might have been updated
    const fieldLabels = {
      first_name: 'First Name',
      surname: 'Surname',
      email: 'Email',
      date_of_birth: 'Date of Birth',
      gender: 'Gender',
      country_of_birth: 'Country of Birth',
      address: 'Address',
      post_code: 'Post Code',
      phone: 'Phone',
      emergency_contact_name: 'Emergency Contact Name',
      emergency_contact_phone: 'Emergency Contact Phone',
      emergency_contact_relationship: 'Emergency Contact Relationship',
      medical_conditions: 'Medical Conditions',
      membership_type: 'Membership Type',
      opt_in_competitions: 'Competitions Opt-in',
      opt_out_photos: 'Photos Opt-out',
      opt_in_aaga_challenge: 'AaGA Challenge Opt-in'
    };
    
    // Add all fields to changes for now
    Object.keys(fieldLabels).forEach(field => {
      if (member[field] !== undefined) {
        let displayValue = member[field];
        
        // Format boolean values
        if (typeof displayValue === 'boolean') {
          displayValue = displayValue ? 'Yes' : 'No';
        }
        
        // Format membership type
        if (field === 'membership_type') {
          displayValue = displayValue === 'club' ? 'Club Membership' : 'Club + EA Affiliation';
        }
        
        changes.push({
          field,
          label: fieldLabels[field],
          value: displayValue
        });
      }
    });
    
    return changes;
  };

  const changes = getChanges();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Member Update Request
        <Typography variant="subtitle2" color="text.secondary">
          {member.first_name} {member.surname} has submitted updates to their membership details
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Review the updated information below. You can approve these changes or close to review later.
        </Alert>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell><Typography variant="subtitle2">Field</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Updated Value</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map((change) => (
                <TableRow key={change.field} hover>
                  <TableCell><Typography variant="body2">{change.label}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{change.value}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {member.signature_url && (
          <Box mt={3}>
            <Typography variant="subtitle2">Signature</Typography>
            <Box mt={1} p={1} border={1} borderColor="divider" borderRadius={1}>
              <img 
                src={member.signature_url} 
                alt="Member Signature" 
                style={{ maxWidth: '100%', maxHeight: '100px' }} 
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          onClick={() => onApproveChanges(member.id)} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Approve Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
