import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  RssFeed as RssFeedIcon,
  Refresh as RefreshIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { api } from '../services/api';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const queryClient = useQueryClient();

  // Get feed stats for notifications
  const { data: stats } = useQuery(
    'feedStats',
    () => api.get('/feeds/stats').then(res => res.data),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const handleRefresh = async () => {
    try {
      await api.post('/rss/process');
      toast.success('RSS processing started!');
      
      // Refresh all data
      queryClient.invalidateQueries();
    } catch (error) {
      toast.error('Failed to start RSS processing');
    }
  };

  const unreadCount = stats?.recent_items_24h || 0;

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'primary.main',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <Toolbar>
        {/* Logo and Title */}
        <RssFeedIcon sx={{ mr: 2, fontSize: 28 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            fontSize: '1.2rem'
          }}
        >
          AI Feed RSS
        </Typography>

        {/* Stats Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              mr: 1,
              fontSize: '0.8rem'
            }}
          >
            {stats?.total_items || 0} items
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem'
            }}
          >
            {stats?.processing_stats?.completed || 0} processed
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh all feeds">
            <IconButton 
              color="inherit" 
              onClick={handleRefresh}
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={darkMode ? "Modo Claro" : "Modo Escuro"}>
            <IconButton 
              color="inherit" 
              onClick={toggleDarkMode}
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={`${unreadCount} new items in last 24h`}>
            <IconButton 
              color="inherit"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton 
              color="inherit"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="User Account">
            <IconButton 
              color="inherit"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.main' }}>
                <AccountIcon />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;