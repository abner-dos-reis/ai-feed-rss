import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import {
  RssFeed as RssIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  Assessment as StatsIcon,
  Topic as TopicIcon,
  Language as SiteIcon,
  Timeline as TimelineIcon,
  Bookmark as BookmarkIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { feedsAPI, aiAPI, topicsAPI, queryKeys } from '../services/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch all necessary data
  const { data: stats, isLoading: statsLoading } = useQuery(
    queryKeys.feedStats,
    () => feedsAPI.getStats().then(res => res.data)
  );

  const { data: aiStats, isLoading: aiLoading } = useQuery(
    queryKeys.aiAPIStatus,
    () => aiAPI.getStatus().then(res => res.data)
  );

  const { data: trending, isLoading: trendingLoading } = useQuery(
    queryKeys.topicsTrending,
    () => topicsAPI.getTrending({ days: 7, limit: 5 }).then(res => res.data)
  );

  const { data: feedsByTopics, isLoading: topicsLoading } = useQuery(
    queryKeys.feedsByTopics,
    () => feedsAPI.getByTopics().then(res => res.data)
  );

  const { data: feedsBySites, isLoading: sitesLoading } = useQuery(
    queryKeys.feedsBySites,
    () => feedsAPI.getBySites().then(res => res.data)
  );

  const StatCard = ({ title, value, subtitle, icon, color, loading, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        
        {loading ? (
          <Skeleton height={40} width={100} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 1 }}>
            {value}
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary">
          {loading ? <Skeleton width={150} /> : subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  const processingProgress = stats?.total_items > 0 
    ? (stats.processing_stats.completed / stats.total_items) * 100 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral do seu sistema de feeds RSS com IA
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Items"
            value={stats?.total_items || 0}
            subtitle="Itens coletados"
            icon={<RssIcon />}
            color="primary.main"
            loading={statsLoading}
            onClick={() => navigate('/feeds/timeline')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processados IA"
            value={stats?.processing_stats?.completed || 0}
            subtitle={`${processingProgress.toFixed(1)}% concluído`}
            icon={<AIIcon />}
            color="secondary.main"
            loading={statsLoading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="APIs Ativas"
            value={aiStats?.active_apis || 0}
            subtitle={`${aiStats?.total_apis || 0} total configuradas`}
            icon={<StatsIcon />}
            color="success.main"
            loading={aiLoading}
            onClick={() => navigate('/ai-apis')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Últimas 24h"
            value={stats?.recent_items_24h || 0}
            subtitle="Novos itens"
            icon={<TrendingIcon />}
            color="warning.main"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* AI Processing Progress */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AIIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Progresso do Processamento IA
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={processingProgress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {`${processingProgress.toFixed(1)}%`}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {stats?.processing_stats?.completed || 0} de {stats?.total_items || 0} itens processados pela IA
          </Typography>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Visualizações Rápidas
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<TopicIcon />}
                  fullWidth
                  onClick={() => navigate('/feeds/topics')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Ver por Tópicos ({feedsByTopics?.length || 0})
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<SiteIcon />}
                  fullWidth
                  onClick={() => navigate('/feeds/sites')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Ver por Sites ({feedsBySites?.length || 0})
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  fullWidth
                  onClick={() => navigate('/feeds/timeline')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Timeline Geral
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Topics */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tópicos em Alta (7 dias)
              </Typography>
              
              {trendingLoading ? (
                <Skeleton count={5} height={30} />
              ) : (
                <List dense>
                  {trending?.slice(0, 5).map((topic, index) => (
                    <ListItem 
                      key={topic.topic} 
                      sx={{ px: 0 }}
                      onClick={() => navigate('/feeds/topics')}
                      button
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: '0.8rem' }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={topic.topic}
                        secondary={`${topic.recent_items} itens recentes`}
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                      <Chip 
                        label={topic.trend_score.toFixed(1)} 
                        size="small" 
                        color="primary"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sentiment Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Distribuição de Sentimento
              </Typography>
              
              {statsLoading ? (
                <Skeleton count={3} height={40} />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Positivo</Typography>
                    <Chip 
                      label={stats?.sentiment_distribution?.positive || 0} 
                      color="success" 
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Neutro</Typography>
                    <Chip 
                      label={stats?.sentiment_distribution?.neutral || 0} 
                      color="default" 
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Negativo</Typography>
                    <Chip 
                      label={stats?.sentiment_distribution?.negative || 0} 
                      color="error" 
                      size="small"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Status do Sistema
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: 'success.light', color: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Sistema Operacional
                </Typography>
                <Typography variant="body2">
                  ✅ APIs funcionando normalmente
                </Typography>
                <Typography variant="body2">
                  ✅ Processamento IA ativo
                </Typography>
                <Typography variant="body2">
                  ✅ RSS feeds sendo coletados
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'white' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Próximas Atualizações
                </Typography>
                <Typography variant="body2">
                  🔄 Processamento automático a cada 5 min
                </Typography>
                <Typography variant="body2">
                  📊 Relatórios detalhados em breve
                </Typography>
                <Typography variant="body2">
                  🔔 Notificações personalizadas
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;