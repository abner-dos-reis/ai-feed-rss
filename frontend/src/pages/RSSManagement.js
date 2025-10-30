import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  RssFeed as RssIcon,
  Language as SiteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { rssAPI, queryKeys } from '../services/api';
import { format } from 'date-fns';

const RSSManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const queryClient = useQueryClient();

  // Form setup
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      url: '',
      description: '',
      source_type: 'web',
      fetch_interval: 3600
    }
  });

  // Fetch RSS sources
  const { data: sources, isLoading, error } = useQuery(
    queryKeys.rssSources,
    () => rssAPI.getSources().then(res => res.data),
    {
      refetchInterval: 30000
    }
  );

  // Add RSS source mutation
  const addSourceMutation = useMutation(
    (data) => rssAPI.addSource(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.rssSources);
        toast.success('RSS source added successfully!');
        setOpenDialog(false);
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to add RSS source');
      }
    }
  );

  // Delete RSS source mutation
  const deleteSourceMutation = useMutation(
    (id) => rssAPI.deleteSource(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.rssSources);
        toast.success('RSS source deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to delete RSS source');
      }
    }
  );

  // Toggle RSS source mutation
  const toggleSourceMutation = useMutation(
    (id) => rssAPI.toggleSource(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.rssSources);
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to toggle RSS source');
      }
    }
  );

  // Process feeds mutation
  const processAllMutation = useMutation(
    () => rssAPI.processFeeds(),
    {
      onSuccess: () => {
        toast.success('RSS processing started!');
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error('Failed to start RSS processing');
      }
    }
  );

  const handleAddSource = (data) => {
    addSourceMutation.mutate(data);
  };

  const handleDeleteSource = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteSourceMutation.mutate(id);
    }
  };

  const handleToggleSource = (id) => {
    toggleSourceMutation.mutate(id);
  };

  const handleProcessAll = () => {
    setProcessing(true);
    processAllMutation.mutate();
    setTimeout(() => setProcessing(false), 2000);
  };

  const sourceTypes = [
    { value: 'web', label: 'Website' },
    { value: 'email', label: 'Email Newsletter' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'youtube', label: 'YouTube Channel' },
    { value: 'news', label: 'News Source' },
    { value: 'blog', label: 'Blog' },
    { value: 'podcast', label: 'Podcast' }
  ];

  const getStatusColor = (source) => {
    if (!source.is_active) return 'default';
    if (source.last_error) return 'error';
    if (source.last_fetched) return 'success';
    return 'warning';
  };

  const getStatusText = (source) => {
    if (!source.is_active) return 'Inactive';
    if (source.last_error) return 'Error';
    if (source.last_fetched) return 'Active';
    return 'Pending';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load RSS sources: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Gerenciamento RSS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Adicione e gerencie suas fontes de RSS feeds
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={processing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleProcessAll}
            disabled={processing}
          >
            {processing ? 'Processando...' : 'Processar Todos'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Adicionar RSS
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <RssIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {sources?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sources
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SuccessIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {sources?.filter(s => s.is_active && !s.last_error).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active & Healthy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {sources?.filter(s => s.last_error).length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With Errors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <SiteIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {sources?.reduce((sum, s) => sum + (s.total_items || 0), 0) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Items
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RSS Sources List */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            RSS Sources ({sources?.length || 0})
          </Typography>
          
          {sources?.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <RssIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma fonte RSS configurada
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Adicione sua primeira fonte RSS para começar
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
                Adicionar RSS
              </Button>
            </Box>
          ) : (
            <List>
              {sources?.map((source, index) => (
                <React.Fragment key={source.id}>
                  <ListItem>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {source.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {source.url}
                          </Typography>
                          {source.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {source.description}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={getStatusText(source)}
                            color={getStatusColor(source)}
                            size="small"
                          />
                          
                          <Switch
                            checked={source.is_active}
                            onChange={() => handleToggleSource(source.id)}
                            size="small"
                          />
                          
                          <Tooltip title="Delete source">
                            <IconButton 
                              onClick={() => handleDeleteSource(source.id, source.name)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={source.source_type} size="small" variant="outlined" />
                        <Chip label={`${source.total_items || 0} items`} size="small" variant="outlined" />
                        {source.site_name && (
                          <Chip label={source.site_name} size="small" variant="outlined" />
                        )}
                        {source.last_fetched && (
                          <Chip 
                            icon={<ScheduleIcon />}
                            label={`Updated ${format(new Date(source.last_fetched), 'dd/MM HH:mm')}`}
                            size="small" 
                            variant="outlined" 
                          />
                        )}
                      </Box>
                      
                      {source.last_error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {source.last_error}
                        </Alert>
                      )}
                    </Box>
                  </ListItem>
                  {index < sources.length - 1 && <Box sx={{ borderBottom: 1, borderColor: 'divider', mx: 2 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add RSS Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Nova Fonte RSS</DialogTitle>
        <form onSubmit={handleSubmit(handleAddSource)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Nome é obrigatório' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome da Fonte"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="Ex: TechCrunch, BBC News"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="url"
                  control={control}
                  rules={{ 
                    required: 'URL é obrigatória',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'URL deve começar com http:// ou https://'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="URL do RSS Feed"
                      fullWidth
                      error={!!errors.url}
                      helperText={errors.url?.message}
                      placeholder="https://exemplo.com/rss"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Descrição (Opcional)"
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Breve descrição sobre esta fonte"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="source_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Tipo de Fonte"
                      fullWidth
                    >
                      {sourceTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="fetch_interval"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Intervalo de Atualização"
                      fullWidth
                    >
                      <MenuItem value={1800}>30 minutos</MenuItem>
                      <MenuItem value={3600}>1 hora</MenuItem>
                      <MenuItem value={7200}>2 horas</MenuItem>
                      <MenuItem value={21600}>6 horas</MenuItem>
                      <MenuItem value={43200}>12 horas</MenuItem>
                      <MenuItem value={86400}>24 horas</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={addSourceMutation.isLoading}
            >
              {addSourceMutation.isLoading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default RSSManagement;