import React, { useState } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Card,
  CardContent,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import {
  Article as ArticleIcon,
  Schedule as TimeIcon,
  Language as SiteIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { feedsAPI, queryKeys } from '../services/api';
import { format, startOfDay, subDays, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';

const TimelinePage = () => {
  const [timeFilter, setTimeFilter] = useState('7days');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const { data: timelineData, isLoading } = useQuery(
    [queryKeys.feedsTimeline, timeFilter],
    () => feedsAPI.getTimeline(timeFilter).then(res => res.data)
  );

  const handleExpandItem = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const formatTimeAgo = (date) => {
    const itemDate = new Date(date);
    if (isToday(itemDate)) {
      return `Hoje, ${format(itemDate, 'HH:mm')}`;
    } else if (isYesterday(itemDate)) {
      return `Ontem, ${format(itemDate, 'HH:mm')}`;
    } else {
      return format(itemDate, "dd 'de' MMM, HH:mm", { locale: ptBR });
    }
  };

  const getTimelineDotColor = (category) => {
    const colors = {
      'tecnologia': 'primary',
      'economia': 'success',
      'esportes': 'warning',
      'saúde': 'error',
      'entretenimento': 'secondary',
      'política': 'info'
    };
    return colors[category?.toLowerCase()] || 'grey';
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        url: item.link
      });
    } else {
      navigator.clipboard.writeText(item.link);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleBookmark = (item) => {
    alert(`Item marcado como favorito: ${item.title}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Timeline de Feeds
        </Typography>
        <Timeline>
          {[1, 2, 3, 4, 5].map(i => (
            <TimelineItem key={i}>
              <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                <Skeleton width={80} />
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot>
                  <Skeleton circle width={24} height={24} />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card>
                  <CardContent>
                    <Skeleton height={30} width="80%" />
                    <Skeleton height={20} width="60%" style={{ marginTop: 10 }} />
                    <Skeleton height={40} style={{ marginTop: 15 }} />
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Timeline de Feeds
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Acompanhe as notícias em ordem cronológica
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            label="Período"
            startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            <MenuItem value="today">Hoje</MenuItem>
            <MenuItem value="yesterday">Ontem</MenuItem>
            <MenuItem value="7days">Últimos 7 dias</MenuItem>
            <MenuItem value="30days">Últimos 30 dias</MenuItem>
            <MenuItem value="all">Todos</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {!timelineData?.length ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <TimeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum feed encontrado no período
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tente selecionar um período maior ou adicione mais feeds RSS
            </Typography>
            <Button variant="contained">
              Adicionar Feeds RSS
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Timeline position="right">
          {timelineData.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const isLast = index === timelineData.length - 1;
            
            return (
              <TimelineItem key={item.id}>
                <TimelineOppositeContent 
                  sx={{ 
                    m: 'auto 0',
                    flex: 0.3,
                    px: 2
                  }}
                  align="right"
                  variant="body2"
                  color="text.secondary"
                >
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {formatTimeAgo(item.published)}
                    </Typography>
                    {item.source_name && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        {item.source_name}
                      </Typography>
                    )}
                  </Box>
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot 
                    color={getTimelineDotColor(item.category)}
                    sx={{ 
                      width: 16, 
                      height: 16,
                      border: '3px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 0 0 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <ArticleIcon sx={{ fontSize: 12 }} />
                  </TimelineDot>
                  {!isLast && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ py: '12px', px: 2, flex: 1 }}>
                  <Card 
                    sx={{ 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 2 }}>
                          {item.title}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => handleExpandItem(item.id)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {item.category && (
                          <Chip
                            label={item.category}
                            size="small"
                            color={getTimelineDotColor(item.category)}
                            variant="filled"
                          />
                        )}
                        
                        {item.subcategory && (
                          <Chip
                            label={item.subcategory}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Collapse in={isExpanded}>
                        <Box sx={{ mb: 2 }}>
                          {item.summary && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {item.summary}
                            </Typography>
                          )}
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <SiteIcon sx={{ fontSize: 14 }} />
                            </Avatar>
                            <Typography variant="body2">
                              {item.source_name}
                            </Typography>
                          </Box>
                        </Box>
                      </Collapse>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          component="a"
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ler mais
                        </Button>
                        
                        <Box>
                          <IconButton 
                            size="small"
                            onClick={() => handleBookmark(item)}
                            sx={{ mr: 1 }}
                          >
                            <BookmarkIcon />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleShare(item)}
                          >
                            <ShareIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Box>
  );
};

export default TimelinePage;