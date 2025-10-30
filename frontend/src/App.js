import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FeedsByTopics from './pages/FeedsByTopics';
import FeedsBySites from './pages/FeedsBySites';
import Timeline from './pages/Timeline';
import RSSManagement from './pages/RSSManagement';
import AIAPIsManagement from './pages/AIAPIsManagement';
import Settings from './pages/Settings';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar />
            <Sidebar />
            
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                mt: 8, // Account for navbar height
                ml: { sm: 30 }, // Account for sidebar width
                backgroundColor: 'background.default',
                minHeight: '100vh'
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/feeds/topics" element={<FeedsByTopics />} />
                <Route path="/feeds/sites" element={<FeedsBySites />} />
                <Route path="/feeds/timeline" element={<Timeline />} />
                <Route path="/rss-management" element={<RSSManagement />} />
                <Route path="/ai-apis" element={<AIAPIsManagement />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Box>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;