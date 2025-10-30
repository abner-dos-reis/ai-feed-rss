import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AddFeedModal from './components/AddFeedModal';
import ManageAPIsModal from './components/ManageAPIsModal';
import LoginSessionsModal from './components/LoginSessionsModal';

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

  const handleSaveFeed = (feed) => {
    console.log('Feed saved:', feed);
    // TODO: Send to backend
    alert(`Feed added: ${feed.name}`);
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
            />
            
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                mt: 8, // Account for header height
                ml: sidebarOpen ? '280px' : 0,
                transition: 'margin 0.3s',
                backgroundColor: 'background.default',
                minHeight: '100vh'
              }}
            >
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Box
                  component="img"
                  src="https://cdn-icons-png.flaticon.com/512/2921/2921822.png"
                  alt="RSS"
                  sx={{ width: 120, height: 120, mb: 3, opacity: 0.6 }}
                />
                <Box sx={{ fontSize: '4rem', mb: 2 }}>📡</Box>
                <Box sx={{ fontSize: '2rem', fontWeight: 700, mb: 2 }}>
                  Welcome to AI Feed RSS
                </Box>
                <Box sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>
                  Use the sidebar to add feeds, manage APIs, and configure login sessions
                </Box>
              </Box>
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
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;