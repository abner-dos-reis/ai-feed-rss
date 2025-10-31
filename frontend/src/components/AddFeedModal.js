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
  const [autoDetectedName, setAutoDetectedName] = useState('');
  const [itemCount, setItemCount] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');

  const detectFeedName = async (url) => {
    if (!url.trim()) return;

    setIsDetecting(true);
    setError('');

    try {
      // Fetch the RSS feed
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid RSS feed format');
      }

      // Try to get title from RSS 2.0 or Atom feed
      let title = xmlDoc.querySelector('channel > title')?.textContent ||
                  xmlDoc.querySelector('feed > title')?.textContent ||
                  '';

      // Count items in feed
      const items = xmlDoc.querySelectorAll('item, entry');
      setItemCount(items.length);

      if (title) {
        setAutoDetectedName(title.trim());
      } else {
        setError('Could not detect feed name from URL');
      }
    } catch (err) {
      console.error('Error detecting feed name:', err);
      setError('Failed to auto-detect feed name. Please enter manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFeedUrl(url);
    setAutoDetectedName('');
    setItemCount(0);
    
    // Auto-detect when URL looks complete
    if (url.includes('http') && (url.includes('rss') || url.includes('feed') || url.includes('xml'))) {
      detectFeedName(url);
    }
  };

  const handleSave = () => {
    if (feedUrl.trim()) {
      const finalName = feedName.trim() || autoDetectedName || 'Unnamed Feed';
      onSave({ 
        url: feedUrl, 
        name: finalName,
        itemCount: itemCount 
      });
      setFeedUrl('');
      setFeedName('');
      setAutoDetectedName('');
      setItemCount(0);
      setError('');
      onClose();
    }
  };

  const handleClose = () => {
    setFeedUrl('');
    setFeedName('');
    setAutoDetectedName('');
    setItemCount(0);
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
          <TextField
            fullWidth
            label="Feed URL"
            placeholder="https://example.com/rss or http://127.0.0.1:8895/api/rss/20"
            value={feedUrl}
            onChange={handleUrlChange}
            required
            helperText="Enter the complete RSS feed URL"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: isDetecting && (
                <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
              )
            }}
          />

          {autoDetectedName && !feedName && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Detected feed name:</strong> {autoDetectedName}
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Custom Feed Name (optional)"
            placeholder="Override detected name"
            value={feedName}
            onChange={(e) => setFeedName(e.target.value)}
            helperText={autoDetectedName && !feedName ? `Will use: "${autoDetectedName}"` : 'Leave empty to use auto-detected name'}
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
          disabled={!feedUrl.trim() || isDetecting}
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
