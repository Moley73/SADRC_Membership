import { useState, useEffect } from 'react';
import { 
  Box, Typography, Accordion, AccordionSummary, AccordionDetails, 
  Button, Alert, CircularProgress, Divider, 
  Grid, Paper, Card, CardContent, CardActions, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import { supabase } from '../../lib/supabaseClient';

export default function VotingSection({ categories }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [members, setMembers] = useState([]);
  const [nominations, setNominations] = useState({});
  const [myVotes, setMyVotes] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [votingInProgress, setVotingInProgress] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get the current session to include the token in requests
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          console.error('No access token available');
          setError('Authentication error - please try logging out and back in');
          setLoading(false);
          return;
        }
        
        // Fetch club members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, email, first_name, surname')
          .order('surname');
          
        if (membersError) throw membersError;
        setMembers(membersData || []);
        
        // Fetch approved nominations for each category
        const nominationsMap = {};
        
        for (const category of categories) {
          const res = await fetch(`/api/awards/nominations?categoryId=${category.id}&status=approved`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          if (!res.ok) throw new Error(`Failed to fetch nominations for ${category.name}`);
          
          const categoryNominations = await res.json();
          nominationsMap[category.id] = categoryNominations;
        }
        
        setNominations(nominationsMap);
        
        // Fetch my votes
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // This would be a custom endpoint to get the user's votes
          const votesRes = await fetch('/api/awards/votes/my-votes', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          if (votesRes.ok) {
            const votesData = await votesRes.json();
            setMyVotes(votesData);
          }
        }
      } catch (err) {
        console.error('Error fetching voting data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [categories]);
  
  const handleAccordionChange = (categoryId) => (event, isExpanded) => {
    setExpandedCategory(isExpanded ? categoryId : null);
  };
  
  const handleVote = async (nominationId) => {
    try {
      setVotingInProgress(true);
      setError(null);
      setSuccess(null);
      
      // Get the current session to include the token in the request
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication error - please try logging out and back in');
      }
      
      // Submit vote
      const res = await fetch('/api/awards/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ nominationId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }
      
      const newVote = await res.json();
      
      // Update my votes list
      setMyVotes(prev => [...prev, newVote]);
      
      setSuccess('Your vote has been submitted successfully!');
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err.message);
    } finally {
      setVotingInProgress(false);
    }
  };
  
  const formatMemberName = (email) => {
    const member = members.find(m => m.email === email);
    if (member) {
      return `${member.first_name} ${member.surname}`;
    }
    return email;
  };
  
  const hasVotedInCategory = (categoryId) => {
    if (!myVotes.length) return false;
    
    // Check if any of the user's votes are for nominations in this category
    return myVotes.some(vote => {
      const categoryNominations = nominations[categoryId] || [];
      return categoryNominations.some(nom => nom.id === vote.nomination_id);
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Vote for Award Nominees
      </Typography>
      
      <Typography variant="body1" paragraph>
        Vote for your favorite nominees in each category. You can only vote once per category.
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
      
      {categories.length === 0 ? (
        <Alert severity="info">No award categories available.</Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {categories.map(category => {
            const categoryNominations = nominations[category.id] || [];
            const hasVoted = hasVotedInCategory(category.id);
            
            return (
              <Accordion 
                key={category.id}
                expanded={expandedCategory === category.id}
                onChange={handleAccordionChange(category.id)}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                    <Typography variant="h6">{category.name}</Typography>
                    {hasVoted && (
                      <Chip 
                        label="Voted" 
                        color="primary" 
                        size="small" 
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {category.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {categoryNominations.length === 0 ? (
                    <Alert severity="info">No approved nominations in this category.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {categoryNominations.map(nomination => {
                        return (
                          <Grid item xs={12} md={6} key={nomination.id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6" gutterBottom>
                                  {formatMemberName(nomination.nominee_email)}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  Nominated by: {formatMemberName(nomination.nominator_email)}
                                </Typography>
                                
                                <Typography variant="body1">
                                  {nomination.reason}
                                </Typography>
                              </CardContent>
                              <CardActions>
                                <Button 
                                  startIcon={<HowToVoteIcon />}
                                  variant="contained" 
                                  color="primary"
                                  disabled={hasVoted || votingInProgress}
                                  onClick={() => handleVote(nomination.id)}
                                  fullWidth
                                >
                                  {votingInProgress ? <CircularProgress size={24} /> : 'Vote'}
                                </Button>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
