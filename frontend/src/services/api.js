import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7201';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      // Redirect to login if needed
    }
    
    return Promise.reject(error);
  }
);

// RSS Management API
export const rssAPI = {
  getSources: () => api.get('/rss/sources'),
  addSource: (data) => api.post('/rss/sources', data),
  deleteSource: (id) => api.delete(`/rss/sources/${id}`),
  toggleSource: (id) => api.post(`/rss/sources/${id}/toggle`),
  processFeeds: (sourceIds = null) => api.post('/rss/process', { source_ids: sourceIds }),
  getSourceItems: (sourceId, params = {}) => api.get(`/rss/sources/${sourceId}/items`, { params }),
};

// AI APIs Management
export const aiAPI = {
  getAPIs: () => api.get('/ai-apis/'),
  addAPI: (data) => api.post('/ai-apis/', data),
  updateAPI: (id, data) => api.put(`/ai-apis/${id}`, data),
  deleteAPI: (id) => api.delete(`/ai-apis/${id}`),
  toggleAPI: (id) => api.post(`/ai-apis/${id}/toggle`),
  testAPI: (id) => api.post(`/ai-apis/${id}/test`),
  getStatus: () => api.get('/ai-apis/status'),
};

// Feeds Display API
export const feedsAPI = {
  // By Topics
  getByTopics: (includeEmpty = false) => api.get('/feeds/by-topics', { params: { include_empty: includeEmpty } }),
  getTopicItems: (topicId, params = {}) => api.get(`/feeds/by-topics/${topicId}/items`, { params }),
  
  // By Sites
  getBySites: () => api.get('/feeds/by-sites'),
  getSiteItems: (siteName, params = {}) => api.get(`/feeds/by-sites/${siteName}/items`, { params }),
  getSiteSources: (siteName) => api.get(`/feeds/by-sites/${siteName}/sources`),
  
  // Timeline
  getTimeline: (params = {}) => api.get('/feeds/timeline', { params }),
  
  // Item actions
  markRead: (itemId) => api.post(`/feeds/items/${itemId}/mark-read`),
  toggleBookmark: (itemId) => api.post(`/feeds/items/${itemId}/bookmark`),
  
  // Stats
  getStats: () => api.get('/feeds/stats'),
};

// Topics API
export const topicsAPI = {
  getAll: (params = {}) => api.get('/topics/', { params }),
  getHierarchy: () => api.get('/topics/hierarchy'),
  getTrending: (params = {}) => api.get('/topics/trending', { params }),
  getSentimentAnalysis: (params = {}) => api.get('/topics/sentiment-analysis', { params }),
  getWordCloud: (params = {}) => api.get('/topics/word-cloud', { params }),
  updateColor: (id, color) => api.post(`/topics/${id}/update-color`, null, { params: { color } }),
  updateIcon: (id, icon) => api.post(`/topics/${id}/update-icon`, null, { params: { icon } }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health', { baseURL: API_BASE_URL }),
};

// Utility functions
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'Server error';
    return { success: false, message, status: error.response.status };
  } else if (error.request) {
    // Request was made but no response
    return { success: false, message: 'Network error - check your connection', status: 0 };
  } else {
    // Something else happened
    return { success: false, message: error.message || 'Unknown error', status: 0 };
  }
};

// Query keys for React Query
export const queryKeys = {
  // RSS
  rssSources: 'rssSources',
  rssSourceItems: (sourceId) => ['rssSourceItems', sourceId],
  
  // AI APIs
  aiAPIs: 'aiAPIs',
  aiAPIStatus: 'aiAPIStatus',
  
  // Feeds
  feedsByTopics: 'feedsByTopics',
  feedsBySites: 'feedsBySites',
  feedsTimeline: 'feedsTimeline',
  feedStats: 'feedStats',
  topicItems: (topicId) => ['topicItems', topicId],
  siteItems: (siteName) => ['siteItems', siteName],
  siteSources: (siteName) => ['siteSources', siteName],
  
  // Topics
  topics: 'topics',
  topicsHierarchy: 'topicsHierarchy',
  topicsTrending: 'topicsTrending',
  topicsSentiment: 'topicsSentiment',
  topicsWordCloud: 'topicsWordCloud',
  
  // Health
  health: 'health',
};

export default api;