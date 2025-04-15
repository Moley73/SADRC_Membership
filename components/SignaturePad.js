import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Typography } from '@mui/material';

export default function SignaturePad({ value, onChange, label }) {
  const sigPad = useRef();

  const handleClear = () => {
    sigPad.current.clear();
    onChange(null);
  };

  const handleEnd = () => {
    if (!sigPad.current.isEmpty()) {
      onChange(sigPad.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  return (
    <Box my={2}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 700 }}>{label}</Typography>
      <Box
        sx={{
          border: '2px solid',
          borderColor: 'primary.main',
          borderRadius: 2,
          width: 320,
          height: 120,
          background: '#fff',
        }}
      >
        <SignatureCanvas
          ref={sigPad}
          penColor="#ff9800"
          backgroundColor="#fff"
          canvasProps={{ width: 320, height: 120, style: { borderRadius: 8 } }}
          onEnd={handleEnd}
        />
      </Box>
      <Button onClick={handleClear} variant="outlined" color="secondary" sx={{ mt: 1 }}>
        Clear
      </Button>
    </Box>
  );
}
