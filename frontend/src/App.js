import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme, CssBaseline, Box, Typography } from '@mui/material';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Create simple theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e3a8a',
    },
    success: {
      main: '#059669',
    },
    background: {
      default: '#0f0f0f',
      paper: '#1a1a1a',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box 
            sx={{ 
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'background.default'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
                AI Feed RSS
              </Typography>
              <Typography variant="h5" color="text.secondary">
                Frontend limpo e pronto para suas instruções
              </Typography>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;