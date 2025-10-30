import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Button,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Topic as TopicIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { feedsAPI, queryKeys } from '../services/api';
import Skeleton from 'react-loading-skeleton';

const FeedsByTopics = () => {
  const [expandedTopics, setExpandedTopics] = useState({});
  const navigate = useNavigate();

  const { data: topics, isLoading } = useQuery(
    queryKeys.feedsByTopics,
    () => feedsAPI.getByTopics().then(res => res.data)
  );

  const handleExpandTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleViewItems = (topicId, topicName) => {
    // Navigate to items view - for now just show alert
    alert(`Ver itens do tópico: ${topicName}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Feeds por Tópicos
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={6} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={30} width="60%" />
                  <Skeleton height={20} width="40%" style={{ marginTop: 10 }} />
                  <Skeleton height={60} style={{ marginTop: 10 }} />
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
          Feeds por Tópicos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Conteúdo organizado automaticamente pela IA em tópicos e subtópicos
        </Typography>
      </Box>

      {topics?.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <TopicIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum tópico encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Adicione feeds RSS e aguarde o processamento da IA para ver os tópicos
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
          {topics?.map((topic) => (
            <Grid item xs={12} lg={6} key={topic.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {topic.name}
                      </Typography>
                      {topic.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {topic.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip 
                      label={`${topic.item_count} items`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<ArticleIcon />}
                      label={`${topic.item_count} artigos`}
                      size="small" 
                      variant="outlined"
                    />
                    {topic.color && (
                      <Chip 
                        label="Personalizado"
                        size="small"
                        sx={{ 
                          backgroundColor: topic.color,
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>

                  {topic.subtopics && topic.subtopics.length > 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                          Subtópicos ({topic.subtopics.length})
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => handleExpandTopic(topic.id)}
                        >
                          {expandedTopics[topic.id] ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </Box>

                      <Collapse in={expandedTopics[topic.id]}>
                        <List dense>
                          {topic.subtopics.map((subtopic) => (
                            <ListItem key={subtopic.id} sx={{ pl: 0 }}>
                              <ListItemText
                                primary={subtopic.name}
                                secondary={`${subtopic.item_count} items`}
                                primaryTypographyProps={{ fontSize: '0.9rem' }}
                                secondaryTypographyProps={{ fontSize: '0.8rem' }}
                              />
                              <Chip 
                                label={subtopic.item_count}
                                size="small"
                                color="secondary"
                                sx={{ ml: 1 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleViewItems(topic.id, topic.name)}
                    startIcon={<ArticleIcon />}
                  >
                    Ver Artigos
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

export default FeedsByTopics;