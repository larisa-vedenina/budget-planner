import React from 'react';
import { Box, Typography } from '@mui/material';

const FontTest: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h1" sx={{ mb: 2 }}>
        Roboto Condensed Test
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h2">Heading 2 - Weight 600</Typography>
        <Typography variant="h3">Heading 3 - Weight 600</Typography>
        <Typography variant="h4">Heading 4 - Weight 600</Typography>
        <Typography variant="h5">Heading 5 - Weight 500</Typography>
        <Typography variant="body1">Body 1 - Normal text</Typography>
        <Typography variant="body2">Body 2 - Smaller text</Typography>
        <Typography variant="caption">Caption - Very small</Typography>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Font Weights Test:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
            <Box
              key={weight}
              sx={{
                p: 2,
                border: '1px solid #D9D9D9',
                borderRadius: 1,
                minWidth: '150px',
              }}
            >
              <Typography sx={{ fontWeight: weight }}>
                Weight {weight}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Roboto Condensed
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default FontTest;