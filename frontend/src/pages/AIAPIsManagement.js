import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  CheckCircle as ActiveIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Security as KeyIcon,
  Speed as SpeedIcon,
  TrendingUp as UsageIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { aiApisAPI, queryKeys } from '../services/api';
import Skeleton from 'react-loading-skeleton';

const AIAPIsManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingApi, setEditingApi] = useState(null);
  const [showApiKey, setShowApiKey] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    api_key: '',
    base_url: '',
    model: '',
    priority: 1,
    is_active: true,
    rate_limit: 60,
    timeout: 30
  });

  const { data: apis, isLoading } = useQuery(
    queryKeys.aiApis,
    () => aiApisAPI.getAll().then(res => res.data)
  );

  const { data: usage, isLoading: usageLoading } = useQuery(
    queryKeys.aiUsage,
    () => aiApisAPI.getUsage().then(res => res.data)
  );

  const createMutation = useMutation(aiApisAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.aiApis);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => aiApisAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.aiApis);
        handleCloseDialog();
      }
    }
  );

  const deleteMutation = useMutation(aiApisAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.aiApis);
    }
  });

  const testMutation = useMutation(aiApisAPI.test);

  const handleOpenDialog = (api = null) => {
    if (api) {
      setEditingApi(api);
      setFormData({
        name: api.name,
        provider: api.provider,
        api_key: api.api_key,
        base_url: api.base_url || '',
        model: api.model || '',
        priority: api.priority,
        is_active: api.is_active,
        rate_limit: api.rate_limit || 60,
        timeout: api.timeout || 30
      });
    } else {
      setEditingApi(null);
      setFormData({
        name: '',
        provider: '',
        api_key: '',
        base_url: '',
        model: '',
        priority: 1,
        is_active: true,
        rate_limit: 60,
        timeout: 30
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingApi(null);
  };

  const handleSubmit = () => {
    if (editingApi) {
      updateMutation.mutate({ id: editingApi.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta API?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTest = async (id) => {
    try {
      const result = await testMutation.mutateAsync(id);
      alert(`Teste realizado com sucesso! Tempo de resposta: ${result.response_time}ms`);
    } catch (error) {
      alert(`Erro no teste: ${error.message}`);
    }
  };

  const toggleApiKeyVisibility = (apiId) => {
    setShowApiKey(prev => ({
      ...prev,
      [apiId]: !prev[apiId]
    }));
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.substring(Math.max(8, key.length - 4));
  };

  const getProviderColor = (provider) => {
    const colors = {
      'openai': '#00a67e',
      'anthropic': '#d97706',
      'groq': '#6366f1',
      'huggingface': '#ff9500'
    };
    return colors[provider.toLowerCase()] || '#6b7280';
  };

  const providers = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-2'] },
    { value: 'groq', label: 'Groq', models: ['llama2-70b', 'mixtral-8x7b', 'gemma-7b'] },
    { value: 'huggingface', label: 'HuggingFace', models: ['custom'] }
  ];

  const getAvailableModels = (provider) => {
    const p = providers.find(p => p.value === provider);
    return p ? p.models : [];
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 4 }}>
          Gerenciamento de APIs de IA
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={30} width="80%" />
                  <Skeleton height={20} width="60%" style={{ marginTop: 10 }} />
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            APIs de IA
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure e gerencie as APIs de inteligência artificial
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Adicionar API
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="APIs Configuradas" icon={<SettingsIcon />} />
          <Tab label="Estatísticas de Uso" icon={<UsageIcon />} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          {!apis?.length ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <KeyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma API configurada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Adicione APIs de IA para começar a processar feeds
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Adicionar Primeira API
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {apis.map((api) => (
                <Grid item xs={12} md={6} lg={4} key={api.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {api.name}
                          </Typography>
                          <Chip
                            label={api.provider}
                            size="small"
                            sx={{ 
                              bgcolor: getProviderColor(api.provider),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {api.is_active ? (
                            <ActiveIcon sx={{ color: 'success.main', mr: 1 }} />
                          ) : (
                            <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Prioridade {api.priority}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Chave da API:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              bgcolor: 'grey.100',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              flex: 1
                            }}
                          >
                            {showApiKey[api.id] ? api.api_key : maskApiKey(api.api_key)}
                          </Typography>
                          <IconButton 
                            size="small"
                            onClick={() => toggleApiKeyVisibility(api.id)}
                          >
                            {showApiKey[api.id] ? <VisibilityOff /> : <ViewIcon />}
                          </IconButton>
                        </Box>
                      </Box>

                      {api.model && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Modelo: <strong>{api.model}</strong>
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<SpeedIcon />}
                          label={`${api.rate_limit}/min`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${api.timeout}s timeout`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {api.last_used && (
                        <Typography variant="caption" color="text.secondary">
                          Último uso: {new Date(api.last_used).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        onClick={() => handleTest(api.id)}
                        disabled={testMutation.isLoading}
                      >
                        Testar
                      </Button>
                      <Box>
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenDialog(api)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDelete(api.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uso por Provedor
                </Typography>
                {usageLoading ? (
                  <Skeleton count={4} height={40} />
                ) : (
                  <List>
                    {usage?.by_provider?.map((item, index) => (
                      <React.Fragment key={item.provider}>
                        <ListItem>
                          <ListItemText
                            primary={item.provider}
                            secondary={`${item.total_requests} requisições`}
                          />
                          <ListItemSecondaryAction>
                            <Typography variant="body2">
                              {item.success_rate}% sucesso
                            </Typography>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < usage.by_provider.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas Gerais
                </Typography>
                {usageLoading ? (
                  <Skeleton count={4} height={30} />
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Total de requisições:</Typography>
                      <Typography fontWeight={600}>{usage?.total_requests || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Taxa de sucesso:</Typography>
                      <Typography fontWeight={600}>{usage?.success_rate || 0}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography>Tempo médio:</Typography>
                      <Typography fontWeight={600}>{usage?.avg_response_time || 0}ms</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>APIs ativas:</Typography>
                      <Typography fontWeight={600}>{apis?.filter(api => api.is_active).length || 0}</Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingApi ? 'Editar API' : 'Adicionar Nova API'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome da API"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provedor</InputLabel>
              <Select
                value={formData.provider}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  provider: e.target.value,
                  model: '' // Reset model when provider changes
                }))}
                label="Provedor"
              >
                {providers.map(provider => (
                  <MenuItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Chave da API"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              sx={{ mb: 2 }}
            />

            {formData.provider && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Modelo</InputLabel>
                <Select
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  label="Modelo"
                >
                  {getAvailableModels(formData.provider).map(model => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="URL Base (opcional)"
              value={formData.base_url}
              onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Prioridade"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Rate Limit (req/min)"
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate_limit: parseInt(e.target.value) }))}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Timeout (segundos)"
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                />
              }
              label="API Ativa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {editingApi ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIAPIsManagement;