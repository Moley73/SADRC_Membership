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
        setLoading(true);
        
        // Get the current session and access token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        try {
          const response = await fetch('/api/members?for=awards', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const membersData = await response.json();
            console.log(`Successfully fetched ${membersData.length} members via API`);
            setMembers(membersData);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback members fetch failed:', fallbackError);
        }
        
        // If we get here, the API endpoint failed, so try direct Supabase query
        console.log('Attempting to fetch members using Supabase query as fallback');
        
        const { data, error } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname');
          
        if (error) {
          console.error('Error fetching members:', error);
          
          // Check if it's a permission error and try with service role if available
          if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
            console.log('Attempting to fetch members using API endpoint as fallback');
            
            try {
              // Fallback to API endpoint that might use service role
              const response = await fetch('/api/members?for=awards', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
              });
              
              if (response.ok) {
                const membersData = await response.json();
                console.log(`Successfully fetched ${membersData.length} members via API`);
                setMembers(membersData);
                return;
              }
            } catch (fallbackError) {
              console.error('Fallback members fetch failed:', fallbackError);
            }
          }
          
          // If we get here, both methods failed
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} members directly`);
        setMembers(data || []);
        
        // If no members found but we're in development, add some test data
        if ((!data || data.length === 0) && process.env.NODE_ENV === 'development') {
          console.log('Adding test members for development');
          setMembers([
            { id: '1', email: 'test1@example.com', first_name: 'Test', surname: 'User 1' },
            { id: '2', email: 'test2@example.com', first_name: 'Test', surname: 'User 2' },
            { id: '3', email: 'test3@example.com', first_name: 'Test', surname: 'User 3' }
          ]);
        }
      } catch (err) {
        console.error('Exception fetching members:', err);
        
        // Add fallback test data in case of errors
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding fallback test members');
          setMembers([
            { id: '1', email: 'test1@example.com', first_name: 'Test', surname: 'User 1' },
            { id: '2', email: 'test2@example.com', first_name: 'Test', surname: 'User 2' },
            { id: '3', email: 'test3@example.com', first_name: 'Test', surname: 'User 3' }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch my nominations using the dedicated endpoint
    const fetchMyNominations = async () => {
      try {
        setLoadingNominations(true);
        
        // Get the current session to include the token in the request
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        console.log('Fetching nominations with token:', token ? 'Token available' : 'No token');
        
        if (!token) {
          console.error('No access token available for nominations');
          setError('Authentication error - please try logging out and back in');
          setLoadingNominations(false);
          return;
        }
        
        const res = await fetch('/api/awards/my-nominations', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Nominations API response status:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error('Nominations API error data:', errorData);
          
          // Check if the error is related to missing tables
          if (errorData.error && (
              errorData.error.includes("relation") || 
              errorData.error.includes("does not exist") ||
              errorData.error.includes("42P01") ||
              errorData.error.includes("not yet set up"))) {
            console.log('Awards tables not yet created in database');
            setTablesExist(false);
            return;
          }
          
          throw new Error(errorData.error || 'Failed to fetch nominations');
        }
        
        const nominations = await res.json();
        console.log(`Successfully fetched ${nominations.length} nominations`);
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
      
      // Get the current session to include the token in the request
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication error - please try logging out and back in');
      }
      
      // Submit nomination
      const res = await fetch('/api/awards/nominations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formState)
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        // Check if the error is related to missing tables
        if (responseData.error && (
            responseData.error.includes("relation") || 
            responseData.error.includes("does not exist") ||
            responseData.error.includes("42P01") ||
            responseData.error.includes("not yet set up") ||
            responseData.setupRequired)) {
          console.log('Awards tables not yet created in database');
          setTablesExist(false);
          throw new Error("The awards system is not yet fully set up in the database. Please try again later.");
        }
        
        throw new Error(responseData.error || 'Failed to submit nomination');
      }
      
      const newNomination = responseData;
      
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
