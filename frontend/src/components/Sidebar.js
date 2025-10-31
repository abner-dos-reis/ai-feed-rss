import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Typography,
  TextField,
  Avatar,
  Paper,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  RssFeed as FeedIcon,
  Api as ApiIcon,
  ChevronLeft as ChevronLeftIcon,
  Login as LoginIcon,
  Send as SendIcon,
  AutoAwesome as AIIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const Sidebar = ({ open, onClose, onAddFeed, onManageAPIs, onLoginSessions }) => {
  const drawerWidth = 280;
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you discover great articles and recommend content based on your feeds. What are you interested in today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const callAI = async (userMessage) => {
    // Get APIs from localStorage
    const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
    
    // Priority: OpenAI > Gemini > Claude > Perplexity
    let apiKey = null;
    let provider = null;

    if (apiKeys.openai && apiKeys.openai.length > 0) {
      apiKey = apiKeys.openai[0];
      provider = 'openai';
    } else if (apiKeys.gemini && apiKeys.gemini.length > 0) {
      apiKey = apiKeys.gemini[0];
      provider = 'gemini';
    } else if (apiKeys.claude && apiKeys.claude.length > 0) {
      apiKey = apiKeys.claude[0];
      provider = 'claude';
    } else if (apiKeys.perplexity && apiKeys.perplexity.length > 0) {
      apiKey = apiKeys.perplexity[0];
      provider = 'perplexity';
    }

    if (!apiKey) {
      return 'Please configure your AI APIs first. Go to "Manage APIs" to add your API keys.';
    }

    // Get user feeds for context
    const feeds = JSON.parse(localStorage.getItem('feeds') || '[]');
    const feedContext = feeds.length > 0 
      ? `\n\nUser's RSS Feeds: ${feeds.map(f => f.name).join(', ')}`
      : '';

    // System prompt focused on recommendations and articles
    const systemPrompt = `You are an AI assistant specialized in content curation and recommendations. Your role is to:

1. Help users discover high-quality articles and content from their RSS feeds
2. Provide personalized recommendations based on their interests
3. Summarize articles and identify key insights
4. Suggest trending topics and must-read pieces
5. Help organize and prioritize content consumption

Be concise, insightful, and focus on actionable recommendations. Always consider the user's current feeds when making suggestions.${feedContext}`;

    try {
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        const data = await response.json();
        if (data.error) {
          return `OpenAI Error: ${data.error.message}`;
        }
        return data.choices[0].message.content;

      } else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser: ${userMessage}`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500
            }
          })
        });

        const data = await response.json();
        if (data.error) {
          return `Gemini Error: ${data.error.message}`;
        }
        return data.candidates[0].content.parts[0].text;

      } else if (provider === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userMessage }
            ]
          })
        });

        const data = await response.json();
        if (data.error) {
          return `Claude Error: ${data.error.message}`;
        }
        return data.content[0].text;

      } else if (provider === 'perplexity') {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ]
          })
        });

        const data = await response.json();
        if (data.error) {
          return `Perplexity Error: ${data.error.message}`;
        }
        return data.choices[0].message.content;
      }

    } catch (error) {
      return `Error calling ${provider}: ${error.message}`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMsg = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    
    // Call AI API
    const aiResponse = await callAI(userMsg.content);
    
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    }]);
    setIsLoading(false);
  };

  const handleClearHistory = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: 'Hi! I can help you discover great articles and recommend content based on your feeds. What are you interested in today?',
        timestamp: new Date()
      }
    ]);
  };

  const menuItems = [
    {
      text: 'Add Feed Link',
      icon: <FeedIcon />,
      onClick: onAddFeed,
      color: '#3b82f6'
    },
    {
      text: 'Manage APIs',
      icon: <ApiIcon />,
      onClick: onManageAPIs,
      color: '#10b981'
    },
    {
      text: 'Login Sessions',
      icon: <LoginIcon />,
      onClick: onLoginSessions,
      color: '#8b5cf6'
    }
  ];

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? drawerWidth : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #333',
          mt: '64px', // Height of header
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)'
        },
      }}
    >
      <Box sx={{ flex: '0 0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ borderColor: '#333' }} />
        
        <List sx={{ px: 2, pt: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={item.onClick}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: item.color, minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider sx={{ borderColor: '#333', my: 2 }} />
      </Box>

      {/* AI Chat Section - Takes remaining space */}
      <Box sx={{ 
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        px: 2,
        pb: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff6b00' }}>
            <AIIcon />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              AI Assistant
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClearHistory}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: '#ff6b00',
                backgroundColor: 'rgba(255, 107, 0, 0.1)'
              }
            }}
            title="Clear chat history"
          >
            <DeleteIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          mb: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1a1a1a'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#444',
            borderRadius: '3px'
          }
        }}>
          {chatMessages.map((msg, idx) => (
            <Box key={idx} sx={{ 
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start'
            }}>
              {msg.role === 'assistant' && (
                <Avatar sx={{ 
                  width: 24, 
                  height: 24, 
                  backgroundColor: '#ff6b00',
                  fontSize: '0.75rem'
                }}>
                  <AIIcon sx={{ fontSize: '0.9rem' }} />
                </Avatar>
              )}
              <Paper sx={{ 
                p: 1,
                backgroundColor: msg.role === 'user' ? '#ff6b00' : '#2a2a2a',
                flex: 1,
                maxWidth: msg.role === 'user' ? '85%' : '100%',
                ml: msg.role === 'user' ? 'auto' : 0
              }}>
                <Typography variant="caption" sx={{ 
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: 1.4
                }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Avatar sx={{ 
                width: 24, 
                height: 24, 
                backgroundColor: '#ff6b00'
              }}>
                <AIIcon sx={{ fontSize: '0.9rem' }} />
              </Avatar>
              <Paper sx={{ p: 1, backgroundColor: '#2a2a2a' }}>
                <CircularProgress size={16} sx={{ color: '#ff6b00' }} />
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip 
            label="📝 Summarize" 
            size="small" 
            onClick={() => setInputMessage('Summarize my feeds')}
            sx={{ 
              fontSize: '0.7rem',
              height: '24px',
              cursor: 'pointer',
              backgroundColor: '#2a2a2a',
              '&:hover': { backgroundColor: '#3a3a3a' }
            }}
          />
          <Chip 
            label="✨ Recommend" 
            size="small"
            onClick={() => setInputMessage('Recommend content')}
            sx={{ 
              fontSize: '0.7rem',
              height: '24px',
              cursor: 'pointer',
              backgroundColor: '#2a2a2a',
              '&:hover': { backgroundColor: '#3a3a3a' }
            }}
          />
        </Box>

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask me..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.85rem',
                backgroundColor: '#0a0a0a',
                '& fieldset': { borderColor: '#333' },
                '&:hover fieldset': { borderColor: '#555' },
                '&.Mui-focused fieldset': { borderColor: '#ff6b00' }
              }
            }}
          />
          <IconButton
            size="small"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            sx={{
              backgroundColor: '#ff6b00',
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': { backgroundColor: '#e55a00' },
              '&.Mui-disabled': { backgroundColor: '#333', color: '#666' }
            }}
          >
            <SendIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
