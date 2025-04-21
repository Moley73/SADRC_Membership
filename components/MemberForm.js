import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Container, Typography, TextField, Button, Checkbox, FormControlLabel, Grid, Box, MenuItem, Alert
} from '@mui/material';
import SignaturePad from './SignaturePad';

const membershipOptions = [
  { label: 'Club Membership (£10 per year)', value: 'club' },
  { label: 'Club Membership + England Athletics Affiliation (£30 per year)', value: 'club+affiliation' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-Binary', value: 'non-binary' },
];

export default function MemberForm({ member, onSubmit, submitLabel = 'Submit Application' }) {
  const { handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: member || {}
  });
  const [signature, setSignature] = useState(member?.signature_url || null);
  const [uploading, setUploading] = useState(false);
  const [showCodePdf, setShowCodePdf] = useState(false);
  const [postCode, setPostCode] = useState(member?.post_code || "");

  // Populate form with member data if editing
  useEffect(() => {
    if (member) {
      reset({
        ...member,
        agreed_policies: !!member.agreed_policies,
        opt_in_competitions: !!member.opt_in_competitions,
        opt_out_photos: !!member.opt_out_photos,
        opt_in_aaga_challenge: !!member.opt_in_aaga_challenge,
      });
      setSignature(member.signature_url || null);
      setPostCode(member.post_code || "");
    }
  }, [member, reset]);

  const handleFormSubmit = async (data) => {
    // Pass signature and postcode
    onSubmit({ ...data, signature_url: signature, post_code: postCode });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller name="first_name" control={control} rules={{ required: true }} render={({ field }) => (
            <TextField {...field} label="First Name" required fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="surname" control={control} rules={{ required: true }} render={({ field }) => (
            <TextField {...field} label="Surname" required fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="email" control={control} rules={{ required: true }} render={({ field }) => (
            <TextField {...field} label="Email" type="email" required fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="country_of_birth" control={control} render={({ field }) => (
            <TextField {...field} label="Country of Birth" fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="address" control={control} render={({ field }) => (
            <TextField {...field} label="Address" fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="post_code" control={control} render={({ field }) => (
            <TextField {...field} label="Post Code" fullWidth onChange={e => { setPostCode(e.target.value); field.onChange(e); }} />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="date_of_birth" control={control} render={({ field }) => (
            <TextField {...field} label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="gender" control={control} render={({ field }) => (
            <TextField 
              {...field} 
              select
              label="Gender" 
              fullWidth
            >
              {genderOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="membership_type" control={control} render={({ field }) => (
            <TextField {...field} select label="Type of Membership" required fullWidth>
              {membershipOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="phone" control={control} render={({ field }) => (
            <TextField {...field} label="Telephone Number" fullWidth />
          )} />
        </Grid>
        {/* Emergency Contact */}
        <Grid item xs={12} sm={6}>
          <Controller name="emergency_contact_name" control={control} render={({ field }) => (
            <TextField {...field} label="Emergency Contact Name" fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="emergency_contact_phone" control={control} render={({ field }) => (
            <TextField {...field} label="Emergency Contact Phone" fullWidth />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="emergency_contact_relationship" control={control} render={({ field }) => (
            <TextField {...field} label="Emergency Contact Relationship" fullWidth />
          )} />
        </Grid>
        {/* Medical Conditions */}
        <Grid item xs={12}>
          <Controller name="medical_conditions" control={control} render={({ field }) => (
            <TextField {...field} label="Medical Conditions" multiline rows={2} fullWidth />
          )} />
        </Grid>
        {/* Policy Acknowledgement */}
        <Grid item xs={12}>
          <Controller name="agreed_policies" control={control} rules={{ required: true }} render={({ field }) => (
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
        {/* Opt-in/out options */}
        <Grid item xs={12} sm={6}>
          <Controller name="opt_in_competitions" control={control} render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Opt in to club competitions and league tables"
            />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="opt_out_photos" control={control} render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Opt out of having photographs displayed on the Club's social media pages"
            />
          )} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller name="opt_in_aaga_challenge" control={control} render={({ field }) => (
            <FormControlLabel
              control={<Checkbox {...field} checked={field.value} />}
              label="Opt in to the AaGA Challenge"
            />
          )} />
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
            {submitLabel}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
