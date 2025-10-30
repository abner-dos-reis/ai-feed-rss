import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsAPI, queryKeys } from '../services/api';

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const [generalSettings, setGeneralSettings] = useState({
    app_name: 'AI Feed RSS',
    refresh_interval: 5,
    max_items_per_source: 100,
    auto_categorize: true,
    delete_old_items: true,
    retention_days: 30
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enable_notifications: true,
    email_notifications: false,
    notification_keywords: '',
    digest_frequency: 'daily'
  });

  const [aiSettings, setAiSettings] = useState({
    default_temperature: 0.7,
    max_tokens: 150,
    batch_processing: true,
    parallel_requests: 3,
    retry_failed: true,
    category_confidence_threshold: 0.8
  });

  const { data: currentSettings, isLoading } = useQuery(
    queryKeys.settings,
    () => settingsAPI.getAll().then(res => res.data),
    {
      onSuccess: (data) => {
        if (data.general) setGeneralSettings(data.general);
        if (data.notifications) setNotificationSettings(data.notifications);
        if (data.ai) setAiSettings(data.ai);
      }
    }
  );

  const updateSettingsMutation = useMutation(
    ({ category, settings }) => settingsAPI.update(category, settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(queryKeys.settings);
      }
    }
  );

  const exportMutation = useMutation(settingsAPI.export);
  const importMutation = useMutation(settingsAPI.import);
  const clearCacheMutation = useMutation(settingsAPI.clearCache);

  const handleSaveGeneral = () => {
    updateSettingsMutation.mutate({ 
      category: 'general', 
      settings: generalSettings 
    });
  };

  const handleSaveNotifications = () => {
    updateSettingsMutation.mutate({ 
      category: 'notifications', 
      settings: notificationSettings 
    });
  };

  const handleSaveAI = () => {
    updateSettingsMutation.mutate({ 
      category: 'ai', 
      settings: aiSettings 
    });
  };

  const handleExport = async () => {
    try {
      const response = await exportMutation.mutateAsync();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-feed-rss-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportDialogOpen(false);
    } catch (error) {
      alert('Erro ao exportar configurações: ' + error.message);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await importMutation.mutateAsync(data);
          queryClient.invalidateQueries();
          setImportDialogOpen(false);
          alert('Configurações importadas com sucesso!');
        } catch (error) {
          alert('Erro ao importar configurações: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Tem certeza que deseja limpar o cache? Esta ação não pode ser desfeita.')) {
      try {
        await clearCacheMutation.mutateAsync();
        alert('Cache limpo com sucesso!');
      } catch (error) {
        alert('Erro ao limpar cache: ' + error.message);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Configurações
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Personalize o comportamento da aplicação
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Geral" icon={<SettingsIcon />} />
          <Tab label="Notificações" icon={<NotificationsIcon />} />
          <Tab label="IA" icon={<SecurityIcon />} />
          <Tab label="Backup" icon={<BackupIcon />} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Configurações Gerais" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nome da Aplicação"
                      value={generalSettings.app_name}
                      onChange={(e) => setGeneralSettings(prev => ({ 
                        ...prev, 
                        app_name: e.target.value 
                      }))}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Intervalo de Atualização (minutos)"
                      type="number"
                      value={generalSettings.refresh_interval}
                      onChange={(e) => setGeneralSettings(prev => ({ 
                        ...prev, 
                        refresh_interval: parseInt(e.target.value) 
                      }))}
                      inputProps={{ min: 1, max: 60 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Máximo de Itens por Fonte"
                      type="number"
                      value={generalSettings.max_items_per_source}
                      onChange={(e) => setGeneralSettings(prev => ({ 
                        ...prev, 
                        max_items_per_source: parseInt(e.target.value) 
                      }))}
                      inputProps={{ min: 10, max: 1000 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Dias de Retenção"
                      type="number"
                      value={generalSettings.retention_days}
                      onChange={(e) => setGeneralSettings(prev => ({ 
                        ...prev, 
                        retention_days: parseInt(e.target.value) 
                      }))}
                      inputProps={{ min: 1, max: 365 }}
                      disabled={!generalSettings.delete_old_items}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generalSettings.auto_categorize}
                          onChange={(e) => setGeneralSettings(prev => ({ 
                            ...prev, 
                            auto_categorize: e.target.checked 
                          }))}
                        />
                      }
                      label="Categorização Automática com IA"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={generalSettings.delete_old_items}
                          onChange={(e) => setGeneralSettings(prev => ({ 
                            ...prev, 
                            delete_old_items: e.target.checked 
                          }))}
                        />
                      }
                      label="Excluir Itens Antigos Automaticamente"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveGeneral}
                    disabled={updateSettingsMutation.isLoading}
                  >
                    Salvar Configurações Gerais
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Informações do Sistema" />
              <CardContent>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Versão"
                      secondary="1.0.0"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Última Atualização"
                      secondary={new Date().toLocaleDateString()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Status"
                      secondary={
                        <Chip 
                          label="Ativo" 
                          color="success" 
                          size="small" 
                        />
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Configurações de Notificações" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.enable_notifications}
                          onChange={(e) => setNotificationSettings(prev => ({ 
                            ...prev, 
                            enable_notifications: e.target.checked 
                          }))}
                        />
                      }
                      label="Habilitar Notificações"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.email_notifications}
                          onChange={(e) => setNotificationSettings(prev => ({ 
                            ...prev, 
                            email_notifications: e.target.checked 
                          }))}
                          disabled={!notificationSettings.enable_notifications}
                        />
                      }
                      label="Notificações por Email"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Palavras-chave para Alertas"
                      placeholder="tecnologia, política, economia (separadas por vírgula)"
                      value={notificationSettings.notification_keywords}
                      onChange={(e) => setNotificationSettings(prev => ({ 
                        ...prev, 
                        notification_keywords: e.target.value 
                      }))}
                      disabled={!notificationSettings.enable_notifications}
                      helperText="Receba notificações quando encontrar conteúdo com essas palavras-chave"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!notificationSettings.enable_notifications}>
                      <InputLabel>Frequência do Resumo</InputLabel>
                      <Select
                        value={notificationSettings.digest_frequency}
                        onChange={(e) => setNotificationSettings(prev => ({ 
                          ...prev, 
                          digest_frequency: e.target.value 
                        }))}
                        label="Frequência do Resumo"
                      >
                        <MenuItem value="hourly">Hourly</MenuItem>
                        <MenuItem value="daily">Diário</MenuItem>
                        <MenuItem value="weekly">Semanal</MenuItem>
                        <MenuItem value="never">Nunca</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveNotifications}
                    disabled={updateSettingsMutation.isLoading}
                  >
                    Salvar Configurações de Notificações
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Configurações de IA" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Temperatura Padrão"
                      type="number"
                      value={aiSettings.default_temperature}
                      onChange={(e) => setAiSettings(prev => ({ 
                        ...prev, 
                        default_temperature: parseFloat(e.target.value) 
                      }))}
                      inputProps={{ min: 0, max: 2, step: 0.1 }}
                      helperText="Controla a criatividade das respostas (0-2)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Máximo de Tokens"
                      type="number"
                      value={aiSettings.max_tokens}
                      onChange={(e) => setAiSettings(prev => ({ 
                        ...prev, 
                        max_tokens: parseInt(e.target.value) 
                      }))}
                      inputProps={{ min: 50, max: 1000 }}
                      helperText="Limite de tokens para respostas"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Requisições Paralelas"
                      type="number"
                      value={aiSettings.parallel_requests}
                      onChange={(e) => setAiSettings(prev => ({ 
                        ...prev, 
                        parallel_requests: parseInt(e.target.value) 
                      }))}
                      inputProps={{ min: 1, max: 10 }}
                      helperText="Número máximo de requisições simultâneas"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Limite de Confiança"
                      type="number"
                      value={aiSettings.category_confidence_threshold}
                      onChange={(e) => setAiSettings(prev => ({ 
                        ...prev, 
                        category_confidence_threshold: parseFloat(e.target.value) 
                      }))}
                      inputProps={{ min: 0, max: 1, step: 0.1 }}
                      helperText="Confiança mínima para categorização (0-1)"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={aiSettings.batch_processing}
                          onChange={(e) => setAiSettings(prev => ({ 
                            ...prev, 
                            batch_processing: e.target.checked 
                          }))}
                        />
                      }
                      label="Processamento em Lote"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={aiSettings.retry_failed}
                          onChange={(e) => setAiSettings(prev => ({ 
                            ...prev, 
                            retry_failed: e.target.checked 
                          }))}
                        />
                      }
                      label="Tentar Novamente em Caso de Falha"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSaveAI}
                    disabled={updateSettingsMutation.isLoading}
                  >
                    Salvar Configurações de IA
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Backup e Restauração" />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Faça backup das suas configurações e dados, ou restaure de um backup anterior.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={() => setExportDialogOpen(true)}
                    fullWidth
                  >
                    Exportar Configurações
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => setImportDialogOpen(true)}
                    fullWidth
                  >
                    Importar Configurações
                  </Button>

                  <Divider sx={{ my: 1 }} />

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleClearCache}
                    fullWidth
                    disabled={clearCacheMutation.isLoading}
                  >
                    Limpar Cache
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Informações de Backup" />
              <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    O backup inclui todas as configurações, APIs configuradas e preferências do usuário. 
                    Os dados dos feeds RSS não são incluídos no backup.
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom>
                  Último backup:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Nenhum backup encontrado
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Tamanho estimado do backup:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  &lt; 1 MB
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Exportar Configurações</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Isto irá exportar todas as suas configurações, incluindo:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Configurações gerais da aplicação" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• APIs de IA configuradas" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Preferências de notificação" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Fontes RSS adicionadas" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            variant="contained"
            disabled={exportMutation.isLoading}
          >
            Exportar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Importar Configurações</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Selecione um arquivo de backup para restaurar suas configurações.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Atenção: Isto irá sobrescrever todas as configurações atuais.
            </Typography>
          </Alert>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ width: '100%', padding: '8px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;