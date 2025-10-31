import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  Whatshot as HotIcon,
  ViewList as AllIcon,
  Language as SiteIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import FeedArticlesModal from './FeedArticlesModal';

const Dashboard = ({ feeds = [] }) => {
  const [activeView, setActiveView] = useState('all');
  const [categorizedFeeds, setCategorizedFeeds] = useState({});
  const [siteButtons, setSiteButtons] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [articlesModalOpen, setArticlesModalOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    topics: [],
    customTopics: ''
  });

  useEffect(() => {
    // Extract unique sites from feeds
    const sites = [...new Set(feeds.map(feed => new URL(feed.url).hostname))];
    setSiteButtons(sites);
  }, [feeds]);

  const renderAllFeeds = () => (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        All Feeds ({feeds.length})
      </Typography>
      
      {feeds.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: 10, 
          backgroundColor: '#1a1a1a',
          border: '2px dashed #333'
        }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No feeds added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar to add your first feed!
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {feeds.map((feed, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card sx={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333',
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  borderColor: '#ff6b00'
                }
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {feed.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mb: 2
                    }}
                  >
                    {feed.url}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Chip 
                      label="Active" 
                      size="small" 
                      color="success"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip 
                      label={`${feed.itemCount || 0} items`}
                      size="small" 
                      sx={{ 
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedFeed(feed);
                        setArticlesModalOpen(true);
                      }}
                      sx={{
                        color: '#10b981',
                        borderColor: '#10b981',
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#10b981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)'
                        }
                      }}
                    >
                      Check
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderByCategory = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Feeds by Category
        </Typography>
        <IconButton 
          size="small" 
          sx={{ 
            color: '#8b5cf6',
            border: '1px solid #8b5cf6',
            '&:hover': {
              backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
      <Card sx={{ 
        textAlign: 'center', 
        py: 10, 
        backgroundColor: '#1a1a1a',
        border: '2px dashed #8b5cf6'
      }}>
        <CategoryIcon sx={{ fontSize: 80, color: '#8b5cf6', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          AI is organizing your feeds
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Categories and subcategories will appear here after processing
        </Typography>
      </Card>
    </Box>
  );

  const renderBySite = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Feeds by Site
      </Typography>
      
      {siteButtons.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: 10, 
          backgroundColor: '#1a1a1a',
          border: '2px dashed #10b981'
        }}>
          <SiteIcon sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            No sites available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add feeds to see sites here
          </Typography>
        </Card>
      ) : (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {siteButtons.map((site, index) => (
              <Chip
                key={index}
                label={site}
                onClick={() => setSelectedSite(site)}
                color={selectedSite === site ? 'primary' : 'default'}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: selectedSite === site ? 700 : 500,
                  fontSize: '0.9rem',
                  py: 2.5,
                  px: 1,
                  backgroundColor: selectedSite === site ? '#10b981' : '#2a2a2a',
                  color: selectedSite === site ? 'white' : 'text.primary',
                  border: selectedSite === site ? 'none' : '1px solid #333',
                  '&:hover': {
                    backgroundColor: selectedSite === site ? '#059669' : '#3a3a3a'
                  }
                }}
              />
            ))}
          </Box>

          {selectedSite && (
            <Card sx={{ 
              backgroundColor: '#1a1a1a', 
              border: '2px solid #10b981',
              p: 2
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#10b981' }}>
                  {selectedSite}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI is organizing feeds from this site into categories...
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );

  const renderHotFeeds = () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Hot Feeds - Personalized for You
        </Typography>
        <Button 
          size="small" 
          variant="outlined"
          onClick={() => {
            localStorage.removeItem('userPreferences');
            setUserPreferences({ topics: [], customTopics: '' });
            alert('Preferences reset successfully!');
          }}
          sx={{ 
            fontSize: '0.8rem',
            borderColor: '#ff6b00',
            color: '#ff6b00',
            '&:hover': {
              borderColor: '#e55a00',
              backgroundColor: 'rgba(255, 107, 0, 0.1)'
            }
          }}
        >
          Reset Preferences
        </Button>
      </Box>
      
      <Card sx={{ 
        textAlign: 'center', 
        py: 10, 
        backgroundColor: '#1a1a1a', 
        border: '2px dashed #ff6b00'
      }}>
        <HotIcon sx={{ fontSize: 80, color: '#ff6b00', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Set Your Preferences
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: 4 }}>
          Tell us what topics you're interested in, and AI will recommend the best content for you
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => setPreferencesOpen(true)}
          sx={{ 
            backgroundColor: '#ff6b00',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#e55a00'
            }
          }}
        >
          Configure Preferences
        </Button>
      </Card>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Info Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ fontSize: '3rem', mb: 1 }}>📡</Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Welcome to AI Feed RSS
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Use the sidebar to add feeds, manage APIs, and configure login sessions
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#10b981', 
            fontWeight: 600,
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          🤖 The AI Will Organize Your Feeds
        </Typography>
      </Box>

      {/* Filter Buttons */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <ButtonGroup 
          variant="outlined" 
          size="large"
          sx={{ 
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            '& .MuiButton-root': {
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              minWidth: '140px'
            }
          }}
        >
          <Button
            startIcon={<HotIcon />}
            onClick={() => setActiveView('hot')}
            variant={activeView === 'hot' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: activeView === 'hot' ? '#ff6b00' : 'transparent',
              borderColor: '#ff6b00',
              color: activeView === 'hot' ? 'white' : '#ff6b00',
              '&:hover': {
                backgroundColor: activeView === 'hot' ? '#e55a00' : 'rgba(255, 107, 0, 0.1)',
                borderColor: '#ff6b00'
              }
            }}
          >
            Hot
          </Button>
          <Button
            startIcon={<AllIcon />}
            onClick={() => setActiveView('all')}
            variant={activeView === 'all' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: activeView === 'all' ? '#3b82f6' : 'transparent',
              borderColor: '#3b82f6',
              color: activeView === 'all' ? 'white' : '#3b82f6',
              '&:hover': {
                backgroundColor: activeView === 'all' ? '#2563eb' : 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6'
              }
            }}
          >
            All
          </Button>
          <Button
            startIcon={<SiteIcon />}
            onClick={() => setActiveView('site')}
            variant={activeView === 'site' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: activeView === 'site' ? '#10b981' : 'transparent',
              borderColor: '#10b981',
              color: activeView === 'site' ? 'white' : '#10b981',
              '&:hover': {
                backgroundColor: activeView === 'site' ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                borderColor: '#10b981'
              }
            }}
          >
            By Site
          </Button>
          <Button
            startIcon={<CategoryIcon />}
            onClick={() => setActiveView('category')}
            variant={activeView === 'category' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: activeView === 'category' ? '#8b5cf6' : 'transparent',
              borderColor: '#8b5cf6',
              color: activeView === 'category' ? 'white' : '#8b5cf6',
              '&:hover': {
                backgroundColor: activeView === 'category' ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)',
                borderColor: '#8b5cf6'
              }
            }}
          >
            By Category
          </Button>
        </ButtonGroup>
      </Box>

      {/* Content Area */}
      <Box>
        {activeView === 'all' && renderAllFeeds()}
        {activeView === 'category' && renderByCategory()}
        {activeView === 'site' && renderBySite()}
        {activeView === 'hot' && renderHotFeeds()}
      </Box>

      {/* Preferences Modal */}
      <Dialog 
        open={preferencesOpen} 
        onClose={() => setPreferencesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a1a',
            border: '2px solid #ff6b00'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#ff6b00', 
          color: 'white',
          fontWeight: 700
        }}>
          Configure Your Preferences
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select topics you're interested in. The AI will recommend relevant content based on your preferences.
          </Typography>
          
          <FormGroup>
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Technology & Programming" 
            />
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Science & Research" 
            />
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Business & Finance" 
            />
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Entertainment & Media" 
            />
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Sports" 
            />
            <FormControlLabel 
              control={<Checkbox sx={{ color: '#ff6b00', '&.Mui-checked': { color: '#ff6b00' } }} />} 
              label="Health & Wellness" 
            />
          </FormGroup>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add custom topics (comma separated)..."
            value={userPreferences.customTopics}
            onChange={(e) => setUserPreferences({...userPreferences, customTopics: e.target.value})}
            sx={{ 
              mt: 3,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#333' },
                '&:hover fieldset': { borderColor: '#555' },
                '&.Mui-focused fieldset': { borderColor: '#ff6b00' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setPreferencesOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
              setPreferencesOpen(false);
              alert('Preferences saved! AI will now recommend content based on your interests.');
            }}
            variant="contained"
            sx={{ 
              backgroundColor: '#ff6b00',
              '&:hover': { backgroundColor: '#e55a00' }
            }}
          >
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feed Articles Modal */}
      <FeedArticlesModal
        open={articlesModalOpen}
        onClose={() => {
          setArticlesModalOpen(false);
          setSelectedFeed(null);
        }}
        feed={selectedFeed}
      />
    </Box>
  );
};

export default Dashboard;
