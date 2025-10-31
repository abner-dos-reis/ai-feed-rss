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
  Divider,
  CircularProgress,
  Chip,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  AutoAwesome as AIIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

const FeedArticlesModal = ({ open, onClose, feed }) => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (open && feed) {
      loadArticles();
    }
  }, [open, feed]);

  useEffect(() => {
    // Filter articles based on search query
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        (article.description && article.description.toLowerCase().includes(query))
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      // Get existing articles from localStorage
      const storedArticles = JSON.parse(localStorage.getItem('feedArticles') || '{}');
      const feedArticles = storedArticles[feed.url] || [];

      // Fetch new articles from feed
      const response = await fetch('http://localhost:7201/api/rss-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: feed.url })
      });

      if (!response.ok) throw new Error('Failed to fetch feed');

      const text = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      // Parse RSS items
      const items = xmlDoc.querySelectorAll('item, entry');
      const newArticles = Array.from(items).map((item, index) => {
        const title = item.querySelector('title')?.textContent || 'Untitled';
        const link = item.querySelector('link')?.textContent || 
                     item.querySelector('link')?.getAttribute('href') || '';
        const description = item.querySelector('description')?.textContent ||
                           item.querySelector('summary')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent ||
                       item.querySelector('published')?.textContent ||
                       item.querySelector('updated')?.textContent ||
                       new Date().toISOString();

        return {
          id: link || `${feed.url}-${index}`,
          title,
          link,
          description: description.replace(/<[^>]*>/g, '').substring(0, 300),
          pubDate: new Date(pubDate),
          fetchedAt: new Date()
        };
      });

      // Merge with existing articles (don't delete old ones)
      const existingIds = new Set(feedArticles.map(a => a.id));
      const articlesToAdd = newArticles.filter(a => !existingIds.has(a.id));
      const mergedArticles = [...feedArticles, ...articlesToAdd]
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

      // Save back to localStorage
      storedArticles[feed.url] = mergedArticles;
      localStorage.setItem('feedArticles', JSON.stringify(storedArticles));

      setArticles(mergedArticles);
      setFilteredArticles(mergedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      // Load from cache if fetch fails
      const storedArticles = JSON.parse(localStorage.getItem('feedArticles') || '{}');
      const cached = storedArticles[feed.url] || [];
      setArticles(cached);
      setFilteredArticles(cached);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResult('');

    try {
      // Get API keys
      const apiKeys = JSON.parse(localStorage.getItem('aiApiKeys') || '{}');
      let apiKey = null;
      let provider = null;

      if (apiKeys.openai?.length > 0) {
        apiKey = apiKeys.openai[0];
        provider = 'openai';
      } else if (apiKeys.gemini?.length > 0) {
        apiKey = apiKeys.gemini[0];
        provider = 'gemini';
      }

      if (!apiKey) {
        setAiResult('Please configure AI APIs first.');
        setIsAiLoading(false);
        return;
      }

      // Prepare context with articles
      const articlesContext = filteredArticles.slice(0, 10).map((a, i) => 
        `${i+1}. ${a.title}\n   ${a.description.substring(0, 150)}...`
      ).join('\n\n');

      const prompt = `Based on these articles from ${feed.name}:\n\n${articlesContext}\n\nUser query: ${aiQuery}\n\nProvide a concise answer with article references.`;

      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
          })
        });
        const data = await response.json();
        setAiResult(data.choices[0].message.content);
      } else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await response.json();
        setAiResult(data.candidates[0].content.parts[0].text);
      }
    } catch (error) {
      setAiResult(`Error: ${error.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!feed) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a1a',
          border: '2px solid #ff6b00',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#ff6b00', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {feed.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Search Field */}
        <TextField
          fullWidth
          placeholder="Search articles by title or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#3b82f6' }} />
              </InputAdornment>
            )
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#333' },
              '&:hover fieldset': { borderColor: '#555' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
            }
          }}
        />

        {/* AI Search Field */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask AI about these articles..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AIIcon sx={{ color: '#ff6b00' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#333' },
                  '&:hover fieldset': { borderColor: '#555' },
                  '&.Mui-focused fieldset': { borderColor: '#ff6b00' }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAiSearch}
              disabled={isAiLoading || !aiQuery.trim()}
              sx={{
                backgroundColor: '#ff6b00',
                '&:hover': { backgroundColor: '#e55a00' }
              }}
            >
              {isAiLoading ? <CircularProgress size={24} /> : 'Ask'}
            </Button>
          </Box>

          {/* AI Result */}
          {aiResult && (
            <Paper sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: '#2a2a2a',
              border: '1px solid #ff6b00'
            }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {aiResult}
              </Typography>
            </Paper>
          )}
        </Box>

        <Divider sx={{ borderColor: '#333', mb: 2 }} />

        {/* Articles List */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredArticles.length} articles found
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: '#ff6b00' }} />
          </Box>
        ) : (
          <List sx={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredArticles.map((article, index) => (
              <React.Fragment key={article.id}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 107, 0, 0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {article.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {article.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={new Date(article.pubDate).toLocaleDateString()}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                        {article.link && (
                          <IconButton
                            size="small"
                            href={article.link}
                            target="_blank"
                            sx={{ color: '#3b82f6' }}
                          >
                            <OpenIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </ListItem>
                {index < filteredArticles.length - 1 && (
                  <Divider sx={{ borderColor: '#333' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedArticlesModal;
