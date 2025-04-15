import Head from 'next/head';
import { Container, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>SADRC Membership</title>
        <meta name="description" content="Join Skegness and District Running Club" />
      </Head>
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box textAlign="center">
          <Typography variant="h3" gutterBottom>
            SADRC Membership
          </Typography>
          <Typography variant="h6" gutterBottom>
            Welcome to the Skegness and District Running Club membership portal.
          </Typography>
          <Link href="/apply" passHref legacyBehavior>
            <Button variant="contained" color="primary" size="large">
              Apply for Membership
            </Button>
          </Link>
        </Box>
      </Container>
    </>
  );
}
