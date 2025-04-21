// --- START: Ensure form matches PDF fields ---
// Add/update fields and structure to match the official membership PDF
// 1. First Name
// 2. Surname
// 3. Email Address
// 4. Country of Birth
// 5. Address and Post Code
// 6. Date of Birth
// 7. Sex/Gender
// 8. Type of Membership (Club / Club + Affiliation)
// 9. Parent/Guardian signature (if under 18)
// 10. Telephone Number
// 11. Emergency Contact Name and Telephone Number
// 12. Emergency Contact Relationship
// 13. Medical Conditions
// 14. Agreement to Club Rules/Policies (checkbox)
// 15. Opt-out for Competitions (checkbox)
// 16. Opt-out for Photos (checkbox)
// 17. Digital Signature
// 18. Date of Signing
// --- END: Ensure form matches PDF fields ---

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import {
  Container, Typography, TextField, Button, Checkbox, FormControlLabel, Grid, Box, MenuItem, Alert, iframe
} from '@mui/material';
import SignaturePad from '../components/SignaturePad';
import Head from 'next/head';

const membershipOptions = [
  { label: 'Club Membership (£10 per year)', value: 'club' },
  { label: 'Club Membership + England Athletics Affiliation (£30 per year)', value: 'club+affiliation' },
];

export default function Apply() {
  const router = useRouter();
  const { handleSubmit, control, watch, reset, setValue } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCodePdf, setShowCodePdf] = useState(false);
  const [postCode, setPostCode] = useState("");

  // Check authentication
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });
  }, []);
  if (!user) return null;

  const onSubmit = async (data) => {
    setError(null);
    try {
      // 1. Check session and get authenticated user
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session:', sessionData);
      if (!sessionData.session || !sessionData.session.user) {
        setError('Session expired. Please log in again.');
        return;
      }
      const user = sessionData.session.user;
      console.log('User:', user); // Debug: ensure user is present
      if (!user || !user.id) throw new Error('User not authenticated. Please log in.');
      const email = user.email;
      const memberData = { ...data };
      memberData.post_code = postCode;
      // 2. Upload signature if present AND not disabled
      let signature_url = null;
      if (signature && signature !== 'DISABLED') {
        setUploading(true);
        try {
          const fileName = `signature-${user.id}-${Date.now()}.png`;
          // Validate base64 string
          if (!signature.startsWith('data:image/png;base64,')) {
            throw new Error('Signature is not a valid PNG image.');
          }
          const base64Data = signature.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          // Check that blob is not empty
          if (blob.size === 0) {
            throw new Error('Signature image is empty. Please try signing again.');
          }
          // Log bucket and user info for debugging policy
          console.log('Uploading to bucket:', 'signatures');
          console.log('User role (should be authenticated):', sessionData.session.user.role || 'unknown');
          const { data: uploadData, error: uploadError } = await supabase.storage.from('signatures').upload(fileName, blob, { upsert: true });
          console.log('UploadData:', uploadData);
          console.error('UploadError:', uploadError);
          setUploading(false);
          if (uploadError) {
            setError('Upload error: ' + (uploadError.message || JSON.stringify(uploadError)));
            return;
          }
          signature_url = uploadData.path;
        } catch (uploadErr) {
          setUploading(false);
          setError(uploadErr.message);
          return;
        }
      }
      // 3. Store member details
      const insertData = {
        ...memberData,
        post_code: postCode,
        email,
        has_medical_condition: !!data.medical_conditions,
        agreed_policies: !!data.agreed_policies,
        opt_in_competitions: !!data.opt_in_competitions,
        opt_in_aaga_challenge: !!data.opt_in_aaga_challenge,
        opt_out_photos: !!data.opt_out_photos,
        signature_url: signature_url || null,
        signed_at: new Date().toISOString(),
        auth_user_id: user.id, // <-- Ensure this is set and not null
      };
      console.log('Insert data:', insertData); // Debug: ensure auth_user_id is present
      const { error: dbError } = await supabase.from('members').insert([insertData]);
      if (dbError) throw dbError;
      setSubmitted(true);
      reset();
      setSignature(null);
      setPostCode("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Watch for under 18
  const dob = watch('date_of_birth');
  const isUnder18 = dob && (new Date().getFullYear() - new Date(dob).getFullYear() < 18);

  return (
    <Head>
      <title>SADRC Members Area - Apply</title>
      <meta name="description" content="Apply for membership to Skegness and District Running Club" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <Container maxWidth="md" sx={{ mt: 8, mb: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <Box sx={{
        width: '100%',
        maxWidth: 700,
        bgcolor: 'background.paper',
        boxShadow: 6,
        borderRadius: 4,
        p: { xs: 2, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.main', textAlign: 'center', letterSpacing: 2 }}>
          SADRC Members Area
        </Typography>
        {submitted && <Alert severity="success">Application submitted!</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller name="first_name" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="First Name" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="surname" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Surname" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="country_of_birth" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Country of Birth" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="address" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Address" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Post Code"
                name="post_code"
                value={postCode || ''}
                onChange={e => setPostCode(e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="date_of_birth" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="sex" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Sex/Gender" select fullWidth required>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="non-binary">Non-binary</MenuItem>
                  <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                </TextField>
              )} />
            </Grid>
            {/* If under 18, show parent/guardian signature */}
            {isUnder18 && (
              <Grid item xs={12}>
                <Controller name="parent_guardian_signature" control={control} defaultValue="" rules={{ required: isUnder18 }} render={({ field }) => (
                  <TextField {...field} label="Parent/Guardian Name and Signature (required for under 18)" fullWidth required />
                )} />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Controller name="telephone" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Telephone Number" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="emergency_name" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Emergency Contact Name" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="emergency_phone" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Emergency Contact Phone" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="emergency_relationship" control={control} defaultValue="" rules={{ required: true }} render={({ field }) => (
                <TextField {...field} label="Emergency Contact Relationship" fullWidth required />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="medical_conditions" control={control} defaultValue="" render={({ field }) => (
                <TextField {...field} label="Medical Conditions (leave blank if none)" fullWidth />
              )} />
            </Grid>
            {/* Membership Options */}
            <Grid item xs={12}>
              <Controller name="membership_type" control={control} defaultValue="club" render={({ field }) => (
                <TextField {...field} label="Membership Option" select fullWidth required>
                  {membershipOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            {/* Policy Acknowledgement */}
            <Grid item xs={12}>
              <Controller name="agreed_policies" control={control} defaultValue={false} rules={{ required: true }} render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={
                    <>
                      I agree to adhere to the SADRC values and the England Athletics Code of Conduct for Senior Athletes (
                      <a href="#code-pdf" onClick={e => { e.preventDefault(); setShowCodePdf(v => !v); }} style={{ color: '#ff9800', cursor: 'pointer' }}>read code</a>
                      ).
                    </>
                  }
                  required
                />
              )} />
            </Grid>
            {showCodePdf && (
              <Grid item xs={12} id="code-pdf">
                <Box sx={{ my: 2, border: '2px solid #ff9800', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
                  <iframe
                    src="/pdfs/codes-of-conduct-senior-athletes-1%20(1).pdf"
                    title="Code of Conduct PDF"
                    width="100%"
                    height="600px"
                    style={{ border: 'none' }}
                  />
                </Box>
              </Grid>
            )}
            {/* Opt-out options */}
            <Grid item xs={12} sm={6}>
              <Controller name="opt_in_competitions" control={control} defaultValue={false} render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Opt in to club competitions and league tables"
                />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="opt_out_photos" control={control} defaultValue={false} render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Opt out of having photographs displayed on the Club's social media pages"
                />
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="opt_in_aaga_challenge" control={control} defaultValue={false} render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Opt in to the AaGA Challenge"
                />
              )} />
            </Grid>
            {/* Payment Instructions */}
            <Grid item xs={12}>
              <Box my={2} p={2} borderRadius={2} sx={{ bgcolor: 'background.default', color: 'text.primary', border: 1, borderColor: 'primary.main' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
                  Payment Instructions (BACS):
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  Sort Code: <b>30-97-67</b><br />
                  Account Number: <b>23387568</b><br />
                  Account Name: <b>Skegness & District Running Club</b>
                </Typography>
              </Box>
            </Grid>
            {/* Digital Signature Capture */}
            <Grid item xs={12}>
              <SignaturePad
                value={signature}
                onChange={setSignature}
                label="Digital Signature (optional)"
              />
              {uploading && <Alert severity="info">Uploading signature...</Alert>}
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                Submit Application
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
}
