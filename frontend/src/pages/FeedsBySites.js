import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Language as SiteIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { feedsAPI, queryKeys } from '../services/api';
import { format } from 'date-fns';
import Skeleton from 'react-loading-skeleton';

const FeedsBySites = () => {
  const navigate = useNavigate();

  const { data: sites, isLoading } = useQuery(
    queryKeys.feedsBySites,
    () => feedsAPI.getBySites().then(res => res.data)
  );

  const handleViewSite = (siteName) => {
    alert(`Ver feeds do site: ${siteName}`);
  };

  const getInitials = (siteName) => {
    return siteName.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (siteName) => {
    const colors = ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
    const index = siteName.length % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Feeds por Sites
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton circle height={60} width={60} />
                  <Skeleton height={30} width="80%" style={{ marginTop: 10 }} />
                  <Skeleton height={20} width="60%" style={{ marginTop: 5 }} />
                  <Skeleton height={40} style={{ marginTop: 15 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Feeds por Sites
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Conteúdo agrupado por site de origem
        </Typography>
      </Box>

      {sites?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SiteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum site encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Adicione feeds RSS para ver os sites organizados aqui
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/rss-management')}
            >
              Adicionar Feeds RSS
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {sites?.map((site) => (
            <Grid item xs={12} sm={6} md={4} key={site.site_name}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
                onClick={() => handleViewSite(site.site_name)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getRandomColor(site.site_name),
                        width: 60,
                        height: 60,
                        mr: 2,
                        fontSize: '1.2rem',
                        fontWeight: 600
                      }}
                    >
                      {getInitials(site.site_name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {site.site_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {site.source_count} fonte{site.source_count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Itens totais
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {site.total_items}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Últimas 24h
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {site.recent_items}
                      </Typography>
                    </Box>

                    {site.total_items > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Atividade recente
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(site.recent_items / site.total_items) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<ArticleIcon />}
                      label={`${site.total_items} total`}
                      size="small"
                      variant="outlined"
                    />
                    
                    {site.recent_items > 0 && (
                      <Chip
                        icon={<TrendingIcon />}
                        label={`${site.recent_items} novos`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>

                  {site.last_updated && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Atualizado {format(new Date(site.last_updated), 'dd/MM HH:mm')}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SiteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSite(site.site_name);
                    }}
                  >
                    Ver Feeds
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FeedsBySites;