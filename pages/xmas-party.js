import Head from 'next/head';
import { Container, Typography, Box, Paper } from '@mui/material';

export default function XmasPartyPage() {
  return (
    <>
      <Head>
        <title>Christmas Party | SADRC Members Area</title>
        <meta name="description" content="SADRC Christmas Party information page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            SADRC Christmas Party
          </Typography>
          
          <Box sx={{ my: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Coming Soon
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ mt: 4 }}>
              We're currently planning the SADRC Christmas Party. 
              Check back soon for information about the date, venue, tickets, 
              and special events for this year's celebration.
            </Typography>
            
            <Typography variant="body1">
              For any questions about the Christmas Party, please contact the social secretary.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
