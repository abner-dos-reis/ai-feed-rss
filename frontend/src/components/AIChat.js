import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Collapse,
  List,
  ListItem,
  Avatar,
  Fab,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you with feed recommendations, summaries, and answer questions about your content. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant',
        content: 'I understand your question. To provide better assistance, please make sure you have configured your AI APIs in the "Manage APIs" section. I can help analyze your feeds, provide summaries, and make personalized recommendations based on your preferences.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Summarize feeds', icon: '📝' },
    { label: 'Recommend content', icon: '✨' },
    { label: 'Trending topics', icon: '🔥' },
    { label: 'Organize feeds', icon: '📊' }
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 1300
      }}
    >
      {/* Floating Action Button */}
      {!isOpen && (
        <Fab
          color="primary"
          onClick={() => setIsOpen(true)}
          sx={{
            backgroundColor: '#ff6b00',
            '&:hover': {
              backgroundColor: '#e55a00'
            },
            boxShadow: '0 4px 20px rgba(255, 107, 0, 0.4)'
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Chat Window */}
      <Collapse in={isOpen} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            width: 380,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1a1a1a',
            border: '2px solid #ff6b00',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: '#ff6b00',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BotIcon />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  AI Assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Powered by your configured APIs
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid #333' }}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {quickActions.map((action, index) => (
                <Chip
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{action.icon}</span>
                      <span style={{ fontSize: '0.75rem' }}>{action.label}</span>
                    </Box>
                  }
                  size="small"
                  onClick={() => setInputMessage(action.label)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: '#2a2a2a',
                    '&:hover': {
                      backgroundColor: '#3a3a3a'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#1a1a1a'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#444',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#555'
                }
              }
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: '#ff6b00',
                      fontSize: '1rem'
                    }}
                  >
                    <AIIcon fontSize="small" />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    backgroundColor: message.role === 'user' ? '#ff6b00' : '#2a2a2a',
                    color: 'white',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.6,
                      fontSize: '0.65rem'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}

            {isTyping && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: '#ff6b00'
                  }}
                >
                  <AIIcon fontSize="small" />
                </Avatar>
                <Paper sx={{ p: 1.5, backgroundColor: '#2a2a2a' }}>
                  <CircularProgress size={20} sx={{ color: '#ff6b00' }} />
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #333',
              backgroundColor: '#0a0a0a'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me anything..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1a1a1a',
                    '& fieldset': {
                      borderColor: '#333'
                    },
                    '&:hover fieldset': {
                      borderColor: '#555'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff6b00'
                    }
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                sx={{
                  backgroundColor: '#ff6b00',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#e55a00'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: '#333',
                    color: '#666'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default AIChat;
