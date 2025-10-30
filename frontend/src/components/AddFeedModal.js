import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, RssFeed as FeedIcon } from '@mui/icons-material';

const AddFeedModal = ({ open, onClose, onSave }) => {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedName, setFeedName] = useState('');

  const handleSave = () => {
    if (feedUrl.trim()) {
      onSave({ url: feedUrl, name: feedName || 'Unnamed Feed' });
      setFeedUrl('');
      setFeedName('');
      onClose();
    }
  };

  const handleClose = () => {
    setFeedUrl('');
    setFeedName('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FeedIcon sx={{ color: '#3b82f6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add RSS Feed
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Feed Name (optional)"
            placeholder="My News Feed"
            value={feedName}
            onChange={(e) => setFeedName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Feed URL"
            placeholder="https://example.com/rss or http://127.0.0.1:8895/api/rss/20"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            required
            helperText="Enter the complete RSS feed URL"
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={!feedUrl.trim()}
          sx={{ 
            backgroundColor: '#3b82f6',
            '&:hover': {
              backgroundColor: '#2563eb'
            }
          }}
        >
          Add Feed
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFeedModal;
