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
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Close as CloseIcon, 
  RssFeed as FeedIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

const AddFeedModal = ({ open, onClose, onSave }) => {
  const [tabValue, setTabValue] = useState(0);
  const [feedUrl, setFeedUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [feedName, setFeedName] = useState('');
  const [autoDetectedName, setAutoDetectedName] = useState('');
  const [itemCount, setItemCount] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState([]);
  const [error, setError] = useState('');

  const detectFeedName = async (url) => {
    if (!url.trim()) return;

    setIsDetecting(true);
    setError('');

    try {
      // Use backend proxy to bypass CORS
      const response = await fetch('http://localhost:7201/api/rss-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
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

  const handleBulkProcess = async () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim());
    if (urls.length === 0) return;

    setIsProcessing(true);
    setBulkResults([]);
    const results = [];

    for (const url of urls) {
      try {
        const response = await fetch('http://localhost:7201/api/rss-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() })
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        const title = xmlDoc.querySelector('channel > title')?.textContent ||
                     xmlDoc.querySelector('feed > title')?.textContent ||
                     'Unnamed Feed';
        const items = xmlDoc.querySelectorAll('item, entry');

        // Auto-save successful feed
        onSave({
          url: url.trim(),
          name: title.trim(),
          itemCount: items.length
        });

        results.push({
          url: url.trim(),
          name: title.trim(),
          itemCount: items.length,
          status: 'success'
        });
      } catch (error) {
        results.push({
          url: url.trim(),
          status: 'error',
          error: error.message
        });
      }
    }

    setBulkResults(results);
    setIsProcessing(false);
  };

  const handleClose = () => {
    setFeedUrl('');
    setFeedName('');
    setAutoDetectedName('');
    setItemCount(0);
    setBulkUrls('');
    setBulkResults([]);
    setTabValue(0);
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
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
      
      <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#3b82f6'
              }
            }
          }}
        >
          <Tab label="Single Feed" />
          <Tab label="Bulk Import" />
        </Tabs>
      </Box>

      <DialogContent>
        {tabValue === 0 && (
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
        )}

        {tabValue === 1 && (
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label="RSS Feed URLs"
              placeholder="https://example.com/feed1&#10;https://example.com/feed2&#10;https://example.com/feed3"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              helperText="Enter one URL per line. All feeds will be processed automatically."
              sx={{ mb: 2 }}
            />

            {bulkResults.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Results ({bulkResults.length} URLs processed)
                </Typography>
                <List sx={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  border: '1px solid #333',
                  borderRadius: 1
                }}>
                  {bulkResults.map((result, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        {result.status === 'success' ? (
                          <SuccessIcon sx={{ color: '#10b981', mr: 1 }} />
                        ) : (
                          <ErrorIcon sx={{ color: '#ef4444', mr: 1 }} />
                        )}
                        <ListItemText
                          primary={
                            result.status === 'success' 
                              ? `${result.name} (${result.itemCount} items)`
                              : result.url
                          }
                          secondary={
                            result.status === 'error' 
                              ? `Error: ${result.error}`
                              : result.url
                          }
                          primaryTypographyProps={{
                            sx: { 
                              fontSize: '0.9rem',
                              color: result.status === 'success' ? '#10b981' : '#ef4444'
                            }
                          }}
                          secondaryTypographyProps={{
                            sx: { fontSize: '0.75rem' }
                          }}
                        />
                      </ListItem>
                      {index < bulkResults.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
          {bulkResults.length > 0 ? 'Close' : 'Cancel'}
        </Button>
        
        {tabValue === 0 && (
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
        )}

        {tabValue === 1 && (
          <Button 
            onClick={handleBulkProcess} 
            variant="contained"
            disabled={!bulkUrls.trim() || isProcessing}
            sx={{ 
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            {isProcessing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <span>Processing...</span>
              </Box>
            ) : (
              `Process ${bulkUrls.split('\n').filter(u => u.trim()).length} URLs`
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddFeedModal;
