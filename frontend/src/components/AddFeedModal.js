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
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close as CloseIcon, RssFeed as FeedIcon } from '@mui/icons-material';

const AddFeedModal = ({ open, onClose, onSave }) => {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedName, setFeedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [autoDetectedName, setAutoDetectedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFeedTitle = async (url) => {
    setLoading(true);
    setError('');
    try {
      // Fetch the RSS feed
      const response = await fetch(url);
      const text = await response.text();
      
      // Parse XML to get title
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      // Try different RSS/Atom formats
      let title = xmlDoc.querySelector('channel > title')?.textContent ||
                  xmlDoc.querySelector('feed > title')?.textContent ||
                  xmlDoc.querySelector('title')?.textContent ||
                  '';
      
      if (title) {
        setAutoDetectedName(title.trim());
        setFeedName(title.trim());
      } else {
        setAutoDetectedName('');
        setFeedName('Unnamed Feed');
      }
    } catch (err) {
      console.error('Failed to fetch feed title:', err);
      setError('Could not fetch feed title. You can enter it manually.');
      setAutoDetectedName('');
      setFeedName('Unnamed Feed');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (url) => {
    setFeedUrl(url);
    setError('');
    
    // Auto-fetch title when URL looks valid
    if (url.trim() && (url.startsWith('http://') || url.startsWith('https://'))) {
      // Debounce the fetch
      const timeoutId = setTimeout(() => {
        if (!customName) { // Only auto-fetch if user hasn't entered custom name
          fetchFeedTitle(url.trim());
        }
      }, 800);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleCustomNameChange = (name) => {
    setCustomName(name);
    if (name.trim()) {
      setFeedName(name.trim());
    } else {
      setFeedName(autoDetectedName || 'Unnamed Feed');
    }
  };

  const handleSave = () => {
    if (feedUrl.trim()) {
      const finalName = customName.trim() || autoDetectedName || 'Unnamed Feed';
      onSave({ url: feedUrl, name: finalName });
      setFeedUrl('');
      setFeedName('');
      setCustomName('');
      setAutoDetectedName('');
      setError('');
      onClose();
    }
  };

  const handleClose = () => {
    setFeedUrl('');
    setFeedName('');
    setCustomName('');
    setAutoDetectedName('');
    setError('');
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
          {error && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Feed URL"
            placeholder="https://example.com/rss or http://127.0.0.1:8895/api/rss/20"
            value={feedUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            required
            sx={{ mb: 3 }}
            helperText="Enter the complete RSS feed URL"
            InputProps={{
              endAdornment: loading && <CircularProgress size={20} />
            }}
          />

          {autoDetectedName && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Feed detected: <strong>{autoDetectedName}</strong>
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Custom Name (optional)"
            placeholder="Leave empty to use auto-detected name"
            value={customName}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            helperText={
              autoDetectedName 
                ? `Auto-detected: "${autoDetectedName}". Enter a custom name to override.`
                : "Custom name for this feed"
            }
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
          disabled={!feedUrl.trim() || loading}
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
