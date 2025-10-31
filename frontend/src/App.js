import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AddFeedModal from './components/AddFeedModal';
import ManageAPIsModal from './components/ManageAPIsModal';
import LoginSessionsModal from './components/LoginSessionsModal';
import ConfigModal from './components/ConfigModal';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Create dark theme
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
    text: {
      primary: '#f5f5f5',
      secondary: '#a3a3a3',
    },
    divider: '#333333',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [addFeedOpen, setAddFeedOpen] = useState(false);
  const [manageAPIsOpen, setManageAPIsOpen] = useState(false);
  const [loginSessionsOpen, setLoginSessionsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [feeds, setFeeds] = useState([]);

  // Load feeds from localStorage on mount
  useEffect(() => {
    const storedFeeds = localStorage.getItem('feeds');
    if (storedFeeds) {
      setFeeds(JSON.parse(storedFeeds));
    }
  }, []);

  const handleSaveFeed = (feed) => {
    console.log('Feed saved:', feed);
    const updatedFeeds = [...feeds, { ...feed, id: Date.now() }];
    setFeeds(updatedFeeds);
    localStorage.setItem('feeds', JSON.stringify(updatedFeeds));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onAddFeed={() => setAddFeedOpen(true)}
              onManageAPIs={() => setManageAPIsOpen(true)}
              onLoginSessions={() => setLoginSessionsOpen(true)}
              onConfig={() => setConfigOpen(true)}
            />
            
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                mt: 8, // Account for header height
                ml: sidebarOpen ? '280px' : '60px', // Keep some space when closed
                transition: 'margin 0.3s',
                backgroundColor: 'background.default',
                minHeight: '100vh'
              }}
            >
              <Dashboard feeds={feeds} />
            </Box>
          </Box>

          {/* Modals */}
          <AddFeedModal
            open={addFeedOpen}
            onClose={() => setAddFeedOpen(false)}
            onSave={handleSaveFeed}
          />

          <ManageAPIsModal
            open={manageAPIsOpen}
            onClose={() => setManageAPIsOpen(false)}
          />

          <LoginSessionsModal
            open={loginSessionsOpen}
            onClose={() => setLoginSessionsOpen(false)}
          />

          <ConfigModal
            open={configOpen}
            onClose={() => setConfigOpen(false)}
          />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;