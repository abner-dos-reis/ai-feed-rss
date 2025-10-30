import React, { useState } from 'react';
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
  Typography
} from '@mui/material';
import {
  RssFeed as FeedIcon,
  Api as ApiIcon,
  ChevronLeft as ChevronLeftIcon,
  Login as LoginIcon
} from '@mui/icons-material';

const Sidebar = ({ open, onClose, onAddFeed, onManageAPIs, onLoginSessions }) => {
  const drawerWidth = 280;

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
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
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
      </Box>
    </Drawer>
  );
};

export default Sidebar;
