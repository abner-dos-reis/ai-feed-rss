import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const ConfigModal = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #333',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: '#f59e0b' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Configuration
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Configuration options will be added here...
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #333' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            color: 'text.secondary',
            borderColor: '#333',
            '&:hover': {
              borderColor: '#555'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigModal;
