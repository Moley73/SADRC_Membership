import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Typography } from '@mui/material';

export default function SignaturePad({ value, onChange, label = "Signature" }) {
  const sigPad = useRef();
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set initial width
    setWindowWidth(window.innerWidth);
    
    // Add resize listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleClear = () => {
    sigPad.current.clear();
    if (onChange) {
      onChange('');
    }
  };

  const handleEnd = () => {
    if (onChange && sigPad.current) {
      onChange(sigPad.current.toDataURL());
    }
  };

  // Calculate responsive dimensions
  const getCanvasSize = () => {
    // Base size
    const baseWidth = 500;
    const baseHeight = 200;
    
    // For mobile screens
    if (windowWidth < 600) {
      return {
        width: '100%',
        height: 150
      };
    }
    
    // For tablets
    if (windowWidth < 960) {
      return {
        width: '100%',
        height: 180
      };
    }
    
    // For desktop
    return {
      width: baseWidth,
      height: baseHeight
    };
  };

  const size = getCanvasSize();

  return (
    <Box my={2}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main', fontWeight: 700 }}>{label}</Typography>
      <Box 
        sx={{ 
          border: '1px solid #ccc', 
          borderRadius: 1,
          width: '100%',
          maxWidth: '100%',
          background: '#fff',
        }}
      >
        <SignatureCanvas
          ref={sigPad}
          penColor="#ff9800"
          canvasProps={{ 
            width: size.width,
            height: size.height,
            style: { 
              width: '100%', 
              height: 'auto',
              maxWidth: '100%',
              minHeight: '150px'
            }
          }}
          backgroundColor="#fff"
          onEnd={handleEnd}
        />
      </Box>
      <Button 
        variant="outlined" 
        color="primary" 
        size="small" 
        onClick={handleClear}
        sx={{ mt: 1 }}
      >
        Clear Signature
      </Button>
    </Box>
  );
}
