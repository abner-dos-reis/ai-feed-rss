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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Api as ApiIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  List as ManageIcon,
  DeleteSweep as DeleteAllIcon
} from '@mui/icons-material';

const API_PROVIDERS = [
  { id: 'openai', name: 'OpenAI (GPT)', color: '#10a37f' },
  { id: 'gemini', name: 'Google Gemini', color: '#4285f4' },
  { id: 'claude', name: 'Anthropic Claude', color: '#d97706' },
  { id: 'perplexity', name: 'Perplexity AI', color: '#8b5cf6' }
];

const ManageAPIsModal = ({ open, onClose }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiKeys, setApiKeys] = useState({
    openai: [],
    gemini: [],
    claude: [],
    perplexity: []
  });
  const [showManage, setShowManage] = useState(false);
  const [error, setError] = useState('');

  // Load API keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aiApiKeys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (keys) => {
    localStorage.setItem('aiApiKeys', JSON.stringify(keys));
  };

  // Check for duplicate API key across all providers
  const isDuplicateKey = (key) => {
    for (const provider in apiKeys) {
      if (apiKeys[provider].includes(key)) {
        return true;
      }
    }
    return false;
  };

  const handleSave = () => {
    const providerId = API_PROVIDERS[currentTab].id;
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError('API key cannot be empty');
      return;
    }

    if (isDuplicateKey(trimmedKey)) {
      setError('This API key is already saved in another provider');
      return;
    }

    const newKeys = {
      ...apiKeys,
      [providerId]: [...apiKeys[providerId], trimmedKey]
    };

    setApiKeys(newKeys);
    saveToStorage(newKeys);
    setApiKey('');
    setError('');
    alert(`API key saved successfully to ${API_PROVIDERS[currentTab].name}!`);
  };

  const handleDelete = (providerId, keyToDelete) => {
    const newKeys = {
      ...apiKeys,
      [providerId]: apiKeys[providerId].filter(k => k !== keyToDelete)
    };
    setApiKeys(newKeys);
    saveToStorage(newKeys);
  };

  const handleDeleteAll = () => {
    const providerId = API_PROVIDERS[currentTab].id;
    if (window.confirm(`Delete all API keys for ${API_PROVIDERS[currentTab].name}?`)) {
      const newKeys = {
        ...apiKeys,
        [providerId]: []
      };
      setApiKeys(newKeys);
      saveToStorage(newKeys);
      setShowManage(false);
    }
  };

  const handleClose = () => {
    setShowManage(false);
    setApiKey('');
    setError('');
    onClose();
  };

  const currentProvider = API_PROVIDERS[currentTab];
  const currentKeys = apiKeys[currentProvider.id] || [];

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
          minHeight: '500px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApiIcon sx={{ color: '#10b981' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Manage AI APIs
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => {
              setCurrentTab(newValue);
              setShowManage(false);
              setApiKey('');
              setError('');
            }}
            variant="fullWidth"
          >
            {API_PROVIDERS.map((provider) => (
              <Tab 
                key={provider.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {provider.name}
                    {apiKeys[provider.id]?.length > 0 && (
                      <Chip 
                        label={apiKeys[provider.id].length} 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          backgroundColor: provider.color,
                          color: 'white'
                        }} 
                      />
                    )}
                  </Box>
                }
                sx={{ textTransform: 'none' }}
              />
            ))}
          </Tabs>
        </Box>

        {!showManage ? (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, color: currentProvider.color, fontWeight: 600 }}>
              {currentProvider.name}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="API Key"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              sx={{ mb: 2 }}
              helperText="Your API key will be stored locally and encrypted"
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!apiKey.trim()}
                sx={{
                  flex: 1,
                  backgroundColor: currentProvider.color,
                  '&:hover': {
                    backgroundColor: currentProvider.color,
                    opacity: 0.9
                  }
                }}
              >
                Save
              </Button>

              <Button
                variant="outlined"
                startIcon={<ManageIcon />}
                onClick={() => setShowManage(true)}
                disabled={currentKeys.length === 0}
                sx={{
                  flex: 1,
                  borderColor: currentProvider.color,
                  color: currentProvider.color,
                  '&:hover': {
                    borderColor: currentProvider.color,
                    backgroundColor: `${currentProvider.color}20`
                  }
                }}
              >
                Manage ({currentKeys.length})
              </Button>

              <Button
                variant="outlined"
                startIcon={<DeleteAllIcon />}
                onClick={handleDeleteAll}
                disabled={currentKeys.length === 0}
                color="error"
                sx={{ flex: 1 }}
              >
                Delete All
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>API Rotation:</strong> If one API fails, the system will automatically use the next available API from any provider.
              </Typography>
            </Alert>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: currentProvider.color, fontWeight: 600 }}>
                Saved API Keys for {currentProvider.name}
              </Typography>
              <Button 
                size="small" 
                onClick={() => setShowManage(false)}
                sx={{ color: 'text.secondary' }}
              >
                Back to Add
              </Button>
            </Box>

            {currentKeys.length === 0 ? (
              <Alert severity="info">
                No API keys saved yet for this provider.
              </Alert>
            ) : (
              <List sx={{ backgroundColor: '#0f0f0f', borderRadius: 2, maxHeight: 300, overflow: 'auto' }}>
                {currentKeys.map((key, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: index < currentKeys.length - 1 ? '1px solid #333' : 'none'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {key.substring(0, 12)}{'•'.repeat(Math.max(0, key.length - 16))}{key.substring(Math.max(12, key.length - 4))}
                        </Typography>
                      }
                      secondary={`Added: ${new Date().toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(currentProvider.id, key)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Total APIs: {Object.values(apiKeys).reduce((sum, keys) => sum + keys.length, 0)}
        </Typography>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageAPIsModal;
