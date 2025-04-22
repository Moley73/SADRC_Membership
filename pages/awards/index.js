import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Container, Typography, Box, Paper, Tabs, Tab, Alert, 
  CircularProgress, Divider, Button, Grid
} from '@mui/material';
import { supabase } from '../../lib/supabaseClient';
import AuthGuard from '../../components/AuthGuard';
import NominationSection from '../../components/awards/NominationSection';
import VotingSection from '../../components/awards/VotingSection';

function AwardsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchAwardsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent infinite loading
        const timeoutPromise = (ms) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), ms)
        );

        // Fetch award settings using the public endpoint
        try {
          const settingsPromise = fetch('/api/awards/public-settings', {
            credentials: 'include'
          });
          
          const settingsRes = await Promise.race([
            settingsPromise,
            timeoutPromise(5000) // 5 second timeout
          ]);
          
          if (!settingsRes.ok) {
            throw new Error(`Failed to fetch award settings: ${settingsRes.status}`);
          }
          
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        } catch (settingsErr) {
          console.error('Error fetching settings:', settingsErr);
          // Set default settings to prevent UI from being stuck
          setSettings({
            current_phase: 'inactive',
            active_year: new Date().getFullYear()
          });
          throw settingsErr;
        }

        // Fetch award categories
        try {
          const categoriesPromise = fetch('/api/awards/categories', {
            credentials: 'include'
          });
          
          const categoriesRes = await Promise.race([
            categoriesPromise,
            timeoutPromise(5000) // 5 second timeout
          ]);
          
          if (!categoriesRes.ok) {
            throw new Error(`Failed to fetch award categories: ${categoriesRes.status}`);
          }
          
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        } catch (categoriesErr) {
          console.error('Error fetching categories:', categoriesErr);
          // Set empty categories to prevent UI from being stuck
          setCategories([]);
          throw categoriesErr;
        }

      } catch (err) {
        console.error('Error fetching awards data:', err);
        setError(`Failed to load awards data: ${err.message}`);
      } finally {
        // Always set loading to false, even if there are errors
        setLoading(false);
      }
    };

    fetchAwardsData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      );
    }

    if (!settings || settings.current_phase === 'inactive') {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          The awards system is currently inactive. Please check back later.
        </Alert>
      );
    }

    if (settings.current_phase === 'completed') {
      return (
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            The awards process for {settings.active_year} has been completed.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/awards/results')}
            sx={{ mt: 2 }}
          >
            View Results
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="awards tabs"
            centered
          >
            <Tab label="Nominations" disabled={settings.current_phase !== 'nomination'} />
            <Tab label="Voting" disabled={settings.current_phase !== 'voting'} />
          </Tabs>
        </Box>
        
        {activeTab === 0 && settings.current_phase === 'nomination' && (
          <NominationSection categories={categories} />
        )}
        
        {activeTab === 1 && settings.current_phase === 'voting' && (
          <VotingSection categories={categories} />
        )}
      </Box>
    );
  };

  return (
    <>
      <Head>
        <title>SADRC Members Area - Club Awards</title>
        <meta name="description" content="Nominate and vote for SADRC club awards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          SADRC Club Awards
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 4, color: 'text.secondary' }}>
          {settings?.active_year || new Date().getFullYear()}
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            About the Awards
          </Typography>
          <Typography variant="body1" paragraph>
            The SADRC Club Awards recognize outstanding achievements and contributions from our members.
            Each year, members can nominate and vote for fellow runners across various categories.
          </Typography>
          <Typography variant="body1">
            Current Phase: <strong>{settings?.current_phase ? settings.current_phase.charAt(0).toUpperCase() + settings.current_phase.slice(1) : 'Loading...'}</strong>
          </Typography>
        </Paper>
        
        {renderContent()}
      </Container>
    </>
  );
}

export default function Awards() {
  return (
    <AuthGuard>
      <AwardsPage />
    </AuthGuard>
  );
}
