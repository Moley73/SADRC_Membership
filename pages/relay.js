import Head from 'next/head';
import { Container, Typography, Box, Paper } from '@mui/material';

export default function RelayPage() {
  return (
    <>
      <Head>
        <title>SADRC Relay | SADRC Members Area</title>
        <meta name="description" content="SADRC Relay information page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            SADRC Relay
          </Typography>
          
          <Box sx={{ my: 6 }}>
            <Typography variant="h4" component="h2" gutterBottom>
              Coming Soon
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ mt: 4 }}>
              We're currently working on the SADRC Relay section. 
              Check back soon for information about upcoming relay events, 
              team formations, and results.
            </Typography>
            
            <Typography variant="body1">
              For any questions about the SADRC Relay events, please contact the club secretary.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
