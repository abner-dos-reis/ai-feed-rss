import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Topic as TopicIcon,
  Language as SiteIcon,
  Timeline as TimelineIcon,
  RssFeed as RssIcon,
  Psychology as AIIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { api } from '../services/api';

const DRAWER_WIDTH = 240;

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get quick stats
  const { data: stats } = useQuery(
    'sidebarStats',
    () => api.get('/feeds/stats').then(res => res.data),
    {
      refetchInterval: 30000,
    }
  );

  const { data: apiStats } = useQuery(
    'apiStats',
    () => api.get('/ai-apis/status').then(res => res.data),
    {
      refetchInterval: 60000,
    }
  );

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/',
      badge: null
    },
    {
      text: 'Por Tópicos',
      icon: <TopicIcon />,
      path: '/feeds/topics',
      badge: stats?.top_topics ? Object.keys(stats.top_topics).length : null
    },
    {
      text: 'Por Sites',
      icon: <SiteIcon />,
      path: '/feeds/sites',
      badge: null
    },
    {
      text: 'Timeline Geral',
      icon: <TimelineIcon />,
      path: '/feeds/timeline',
      badge: stats?.recent_items_24h || null
    }
  ];

  const managementItems = [
    {
      text: 'Gerenciar RSS',
      icon: <RssIcon />,
      path: '/rss-management',
      badge: null
    },
    {
      text: 'APIs de IA',
      icon: <AIIcon />,
      path: '/ai-apis',
      badge: apiStats?.active_apis || null
    },
    {
      text: 'Configurações',
      icon: <SettingsIcon />,
      path: '/settings',
      badge: null
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isSelected = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    return path !== '/' && location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          mt: 8, // Account for navbar
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Quick Stats */}
        <Box sx={{ p: 2, backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Status Rápido
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
              📰 {stats?.total_items || 0} items total
            </Typography>
            <Typography variant="body2">
              🤖 {stats?.processing_stats?.completed || 0} processados
            </Typography>
            <Typography variant="body2">
              🔄 {apiStats?.active_apis || 0} APIs ativas
            </Typography>
          </Box>
        </Box>

        {/* Main Navigation */}
        <List sx={{ pt: 2 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              px: 2, 
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          >
            Visualizações
          </Typography>
          
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected(item.path) ? 'white' : 'action.active',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected(item.path) ? 600 : 400
                  }}
                />
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    color={isSelected(item.path) ? "secondary" : "primary"}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        {/* Management Section */}
        <List>
          <Typography 
            variant="overline" 
            sx={{ 
              px: 2, 
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}
          >
            Gerenciamento
          </Typography>
          
          {managementItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected(item.path) ? 'white' : 'action.active',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected(item.path) ? 600 : 400
                  }}
                />
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    color={isSelected(item.path) ? "secondary" : "primary"}
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* AI Status */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Box 
            sx={{ 
              backgroundColor: 'success.light',
              color: 'white',
              p: 1.5,
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <AnalyticsIcon sx={{ mb: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              IA Processando
            </Typography>
            <Typography variant="caption">
              {((stats?.processing_stats?.completed / stats?.total_items) * 100 || 0).toFixed(1)}% concluído
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;