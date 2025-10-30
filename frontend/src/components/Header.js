import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';

const Header = ({ onMenuClick }) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ff6b00', // Orange background
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1,
            color: '#ffffff', // White text
            fontWeight: 700,
            fontSize: '1.5rem',
            letterSpacing: '0.5px'
          }}
        >
          AI Feed RSS
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
