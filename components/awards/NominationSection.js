import { useState, useEffect } from 'react';
import { 
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, 
  TextField, Button, Alert, CircularProgress, Divider, 
  FormControl, InputLabel, Select, MenuItem, Grid, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { supabase } from '../../lib/supabaseClient';

export default function NominationSection({ categories }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [members, setMembers] = useState([]);
  const [myNominations, setMyNominations] = useState([]);
  const [formState, setFormState] = useState({
    category_id: '',
    nominee_email: '',
    reason: ''
  });
  const [loadingNominations, setLoadingNominations] = useState(true);
  const [tablesExist, setTablesExist] = useState(true);

  useEffect(() => {
    // Fetch club members
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname');
          
        if (error) throw error;
        setMembers(data || []);
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };

    // Fetch my nominations using the dedicated endpoint
    const fetchMyNominations = async () => {
      try {
        setLoadingNominations(true);
        const res = await fetch('/api/awards/my-nominations', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          
          // Check if the error is related to missing tables
          if (errorData.error && (
              errorData.error.includes("relation") || 
              errorData.error.includes("does not exist") ||
              errorData.error.includes("42P01"))) {
            console.log('Awards tables not yet created in database');
            setTablesExist(false);
            return;
          }
          
          throw new Error(errorData.error || 'Failed to fetch nominations');
        }
        
        const nominations = await res.json();
        setMyNominations(nominations);
      } catch (err) {
        console.error('Error fetching my nominations:', err);
        // Don't show error UI for missing tables
        if (err.message && (
            err.message.includes("relation") || 
            err.message.includes("does not exist"))) {
          setTablesExist(false);
        }
      } finally {
        setLoadingNominations(false);
      }
    };

    fetchMembers();
    fetchMyNominations();
  }, []);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tablesExist) {
      setError("The awards system is not yet fully set up in the database. Please try again later.");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate form
      if (!formState.category_id) {
        throw new Error('Please select an award category');
      }
      
      if (!formState.nominee_email) {
        throw new Error('Please select a nominee');
      }
      
      if (!formState.reason) {
        throw new Error('Please provide a reason for your nomination');
      }
      
      // Check reason length (minimum 10 characters)
      if (formState.reason.trim().length < 10) {
        throw new Error('Please provide a more detailed reason for your nomination (at least 10 characters)');
      }
      
      // Submit nomination
      const res = await fetch('/api/awards/nominations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(formState)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit nomination');
      }
      
      const newNomination = await res.json();
      
      // Update my nominations list
      setMyNominations(prev => [...prev, newNomination]);
      
      // Reset form
      setFormState({
        category_id: '',
        nominee_email: '',
        reason: ''
      });
      
      setSuccess('Your nomination has been submitted successfully! It will be reviewed by the club committee.');
      setExpanded(false);
    } catch (err) {
      console.error('Error submitting nomination:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMemberName = (email) => {
    const member = members.find(m => m.email === email);
    return member ? `${member.first_name} ${member.surname}` : email;
  };

  // Check if user already nominated a category
  const hasNominatedCategory = (categoryId) => {
    return myNominations.some(nom => nom.category_id === categoryId);
  };

  // If the awards tables don't exist yet, show a message
  if (!tablesExist) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          The awards system is currently being set up. Please check back later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      <Accordion 
        expanded={expanded === 'nominationPanel'} 
        onChange={handleAccordionChange('nominationPanel')}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Make a Nomination</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(error && !formState.category_id)}>
                  <InputLabel id="category-label">Award Category</InputLabel>
                  <Select
                    labelId="category-label"
                    name="category_id"
                    value={formState.category_id}
                    onChange={handleInputChange}
                    label="Award Category"
                    required
                  >
                    {categories.map(category => (
                      <MenuItem 
                        key={category.id} 
                        value={category.id}
                        disabled={hasNominatedCategory(category.id)}
                      >
                        {category.name} {hasNominatedCategory(category.id) ? '(Already Nominated)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={Boolean(error && !formState.nominee_email)}>
                  <InputLabel id="nominee-label">Nominee</InputLabel>
                  <Select
                    labelId="nominee-label"
                    name="nominee_email"
                    value={formState.nominee_email}
                    onChange={handleInputChange}
                    label="Nominee"
                    required
                  >
                    {members.map(member => (
                      <MenuItem key={member.id} value={member.email}>
                        {member.first_name} {member.surname}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="reason"
                  label="Reason for Nomination"
                  multiline
                  rows={4}
                  value={formState.reason}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={Boolean(error && (!formState.reason || formState.reason.trim().length < 10))}
                  helperText="Please provide a detailed reason (at least 10 characters) why this person deserves the award"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Nomination'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </AccordionDetails>
      </Accordion>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Your Nominations
      </Typography>
      
      {loadingNominations ? (
        <CircularProgress sx={{ my: 2 }} />
      ) : myNominations.length === 0 ? (
        <Alert severity="info">
          You haven't made any nominations yet.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {myNominations.map(nomination => {
            const category = categories.find(c => c.id === nomination.category_id) || 
                            (nomination.category && { name: nomination.category.name }) || 
                            { name: 'Unknown Category' };
            
            return (
              <Grid item xs={12} md={6} key={nomination.id}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {category.name}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Nominee:</strong> {formatMemberName(nomination.nominee_email)}
                  </Typography>
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>Status:</strong> {nomination.status.charAt(0).toUpperCase() + nomination.status.slice(1)}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Reason:</strong> {nomination.reason}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
