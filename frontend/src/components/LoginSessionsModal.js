import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Login as LoginIcon,
  Language as WebIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const LoginSessionsModal = ({ open, onClose }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [sessions, setSessions] = useState([]);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loginSessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (newSessions) => {
    localStorage.setItem('loginSessions', JSON.stringify(newSessions));
  };

  const handleOpenWebsite = () => {
    if (websiteUrl.trim()) {
      // Open website in new window
      window.open(websiteUrl, '_blank', 'width=800,height=600');
    }
  };

  const handleSaveSession = () => {
    if (websiteUrl.trim()) {
      const newSession = {
        id: Date.now(),
        url: websiteUrl,
        name: siteName || new URL(websiteUrl).hostname,
        loggedIn: true,
        lastValidated: new Date().toISOString()
      };

      const newSessions = [...sessions, newSession];
      setSessions(newSessions);
      saveToStorage(newSessions);
      
      setWebsiteUrl('');
      setSiteName('');
      alert('Session saved successfully!');
    }
  };

  const handleDeleteSession = (id) => {
    if (window.confirm('Delete this session?')) {
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      saveToStorage(newSessions);
    }
  };

  const handleOpenSession = (url) => {
    window.open(url, '_blank', 'width=800,height=600');
  };

  const handleLogout = (id) => {
    const newSessions = sessions.map(s => 
      s.id === id ? { ...s, loggedIn: false } : s
    );
    setSessions(newSessions);
    saveToStorage(newSessions);
  };

  const handleClose = () => {
    setWebsiteUrl('');
    setSiteName('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          minHeight: '600px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LoginIcon sx={{ color: '#8b5cf6' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Login Sessions
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Login to websites and save your session to access protected content.
        </Typography>

        {/* Login to Website Section */}
        <Card sx={{ mb: 3, backgroundColor: '#0f0f0f', border: '1px solid #333' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Login to Website
            </Typography>

            <TextField
              fullWidth
              label="Website URL:"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Enter the full URL you want to access"
            />

            <TextField
              fullWidth
              label="Site Name (optional):"
              placeholder="My Site"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<WebIcon />}
                onClick={handleOpenWebsite}
                disabled={!websiteUrl.trim()}
                sx={{
                  backgroundColor: '#3b82f6',
                  '&:hover': {
                    backgroundColor: '#2563eb'
                  }
                }}
              >
                Open Website to Login
              </Button>

              <Button
                variant="contained"
                fullWidth
                startIcon={<SaveIcon />}
                onClick={handleSaveSession}
                disabled={!websiteUrl.trim()}
                sx={{
                  backgroundColor: '#10b981',
                  '&:hover': {
                    backgroundColor: '#059669'
                  }
                }}
              >
                Save Session (After Login)
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Logged In Sessions Section */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Logged In Sessions ({sessions.length})
          </Typography>

          {sessions.length === 0 ? (
            <Card sx={{ backgroundColor: '#0f0f0f', border: '1px solid #333' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <WebIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No logged in sessions yet
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List sx={{ backgroundColor: '#0f0f0f', borderRadius: 2, border: '1px solid #333' }}>
              {sessions.map((session, index) => (
                <React.Fragment key={session.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.02)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <LoginIcon sx={{ color: session.loggedIn ? '#10b981' : '#6b7280' }} />
                    </Box>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {session.name}
                          </Typography>
                          <Chip 
                            label={session.loggedIn ? "Logged In" : "Logged Out"}
                            size="small"
                            color={session.loggedIn ? "success" : "default"}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {session.url}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last validated: {new Date(session.lastValidated).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenSession(session.url)}
                          sx={{ 
                            color: '#3b82f6',
                            '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                          }}
                        >
                          <OpenIcon fontSize="small" />
                        </IconButton>
                        
                        {session.loggedIn && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleLogout(session.id)}
                            sx={{ mr: 1, minWidth: 70, fontSize: '0.75rem' }}
                          >
                            Logout
                          </Button>
                        )}
                        
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSession(session.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < sessions.length - 1 && <Divider sx={{ borderColor: '#333' }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginSessionsModal;
